import * as THREE from 'three'
import { AVATAR_URL, BOX_URL, createClipLoop, loadGltf, prepareRig } from '../avatar/rig'

// Forma "viva" das partículas: o avatar riggado fazendo uma animação. As
// partículas ficam espalhadas pela superfície do modelo (pontos sorteados
// nos triângulos, proporcional à área) e, a cada quadro, seguem os ossos.
//
// O skinning é feito aqui na CPU, com as mesmas contas do three.js
// (SkinnedMesh.applyBoneTransform), mas sem objetos por vértice: uma matriz
// combinada por osso e depois soma ponderada. ~20 mil vértices ≈ 1 ms.

export type SkinnedShape = {
  // Posições no mesmo espaço das outras formas (altura 2, centro na origem).
  positions: Float32Array
  // O próprio modelo animado (altura 1, pés em 0): dá para desenhar ele sólido
  // por cima das partículas, sempre na mesma pose delas.
  object: THREE.Object3D
  update: (elapsed: number) => void
  dispose: () => void
}

export async function loadSkinnedShape(
  count: number,
  animUrl = BOX_URL,
): Promise<SkinnedShape | null> {
  const [gltf, anim] = await Promise.all([loadGltf(AVATAR_URL), loadGltf(animUrl)])
  const model = gltf.scene
  prepareRig(model)

  let mesh: THREE.SkinnedMesh | undefined
  model.traverse((o) => {
    if (!mesh && (o as THREE.SkinnedMesh).isSkinnedMesh) mesh = o as THREE.SkinnedMesh
  })
  if (!mesh) return null
  const skinnedMesh = mesh
  const clip = anim.animations[0]
  const loop = clip ? createClipLoop(model, clip) : null

  // ---------- Dados do modelo em arrays simples ----------
  const geo = skinnedMesh.geometry
  const pos = geo.getAttribute('position')
  const skinIndex = geo.getAttribute('skinIndex')
  const skinWeight = geo.getAttribute('skinWeight')
  const vCount = pos.count
  const local = new Float32Array(vCount * 3)
  const bi = new Uint16Array(vCount * 4)
  const bw = new Float32Array(vCount * 4)
  for (let v = 0; v < vCount; v++) {
    local[v * 3] = pos.getX(v)
    local[v * 3 + 1] = pos.getY(v)
    local[v * 3 + 2] = pos.getZ(v)
    bi[v * 4] = skinIndex.getX(v)
    bi[v * 4 + 1] = skinIndex.getY(v)
    bi[v * 4 + 2] = skinIndex.getZ(v)
    bi[v * 4 + 3] = skinIndex.getW(v)
    bw[v * 4] = skinWeight.getX(v)
    bw[v * 4 + 1] = skinWeight.getY(v)
    bw[v * 4 + 2] = skinWeight.getZ(v)
    bw[v * 4 + 3] = skinWeight.getW(v)
  }

  // ---------- Sorteio dos pontos na superfície ----------
  const index = geo.index
  const triCount = index ? index.count / 3 : vCount / 3
  const corner = (t: number, c: number) => (index ? index.getX(t * 3 + c) : t * 3 + c)
  const cdf = new Float32Array(triCount)
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  let total = 0
  for (let t = 0; t < triCount; t++) {
    const a = corner(t, 0) * 3
    const b = corner(t, 1) * 3
    const c = corner(t, 2) * 3
    ab.set(local[b] - local[a], local[b + 1] - local[a + 1], local[b + 2] - local[a + 2])
    ac.set(local[c] - local[a], local[c + 1] - local[a + 1], local[c + 2] - local[a + 2])
    total += ab.cross(ac).length() / 2
    cdf[t] = total
  }
  const tri = new Uint32Array(count * 3)
  const bary = new Float32Array(count * 3)
  const used = new Uint8Array(vCount)
  for (let p = 0; p < count; p++) {
    const r = Math.random() * total
    let lo = 0
    let hi = triCount - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cdf[mid] < r) lo = mid + 1
      else hi = mid
    }
    let u = Math.random()
    let w = Math.random()
    if (u + w > 1) {
      u = 1 - u
      w = 1 - w
    }
    for (let c = 0; c < 3; c++) {
      const v = corner(lo, c)
      tri[p * 3 + c] = v
      used[v] = 1
    }
    bary[p * 3] = 1 - u - w
    bary[p * 3 + 1] = u
    bary[p * 3 + 2] = w
  }
  const usedList = Uint32Array.from({ length: vCount }, (_, v) => v).filter((v) => used[v])

  // ---------- Pose por quadro ----------
  const bones = skinnedMesh.skeleton.bones
  const inverses = skinnedMesh.skeleton.boneInverses
  const boneMats = new Float32Array(bones.length * 16)
  const pre = new THREE.Matrix4()
  const parentInverse = new THREE.Matrix4()
  const m = new THREE.Matrix4()
  const skinned = new Float32Array(vCount * 3)
  const positions = new Float32Array(count * 3)

  function update(elapsed: number) {
    loop?.apply(elapsed)
    model.updateMatrixWorld(true)
    // Por osso: mundo da malha × bindInverse × osso × inverso do osso × bind.
    // Tudo relativo ao pai do modelo: quando ele está pendurado na cena (o
    // boneco sólido), a posição e a escala do grupo das partículas não podem
    // entrar nas posições, senão seriam aplicadas duas vezes.
    if (model.parent) parentInverse.copy(model.parent.matrixWorld).invert()
    else parentInverse.identity()
    pre
      .multiplyMatrices(skinnedMesh.matrixWorld, skinnedMesh.bindMatrixInverse)
      .premultiply(parentInverse)
    for (let k = 0; k < bones.length; k++) {
      m.multiplyMatrices(bones[k].matrixWorld, inverses[k]).premultiply(pre).multiply(skinnedMesh.bindMatrix)
      boneMats.set(m.elements, k * 16)
    }
    for (let n = 0; n < usedList.length; n++) {
      const v = usedList[n]
      const x = local[v * 3]
      const y = local[v * 3 + 1]
      const z = local[v * 3 + 2]
      let ox = 0
      let oy = 0
      let oz = 0
      for (let j = 0; j < 4; j++) {
        const weight = bw[v * 4 + j]
        if (weight === 0) continue
        const e = bi[v * 4 + j] * 16
        ox += weight * (boneMats[e] * x + boneMats[e + 4] * y + boneMats[e + 8] * z + boneMats[e + 12])
        oy += weight * (boneMats[e + 1] * x + boneMats[e + 5] * y + boneMats[e + 9] * z + boneMats[e + 13])
        oz += weight * (boneMats[e + 2] * x + boneMats[e + 6] * y + boneMats[e + 10] * z + boneMats[e + 14])
      }
      skinned[v * 3] = ox
      skinned[v * 3 + 1] = oy
      skinned[v * 3 + 2] = oz
    }
    // Modelo: altura 1 com os pés em 0. Forma: altura 2 centrada (raio 1).
    for (let p = 0; p < count; p++) {
      const a = tri[p * 3] * 3
      const b = tri[p * 3 + 1] * 3
      const c = tri[p * 3 + 2] * 3
      const wa = bary[p * 3]
      const wb = bary[p * 3 + 1]
      const wc = bary[p * 3 + 2]
      positions[p * 3] = (wa * skinned[a] + wb * skinned[b] + wc * skinned[c]) * 2
      positions[p * 3 + 1] = (wa * skinned[a + 1] + wb * skinned[b + 1] + wc * skinned[c + 1] - 0.5) * 2
      positions[p * 3 + 2] = (wa * skinned[a + 2] + wb * skinned[b + 2] + wc * skinned[c + 2]) * 2
    }
  }

  update(0)

  model.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.frustumCulled = false // a pose sai da caixa de repouso
  })

  return {
    positions,
    object: model,
    update,
    dispose() {
      loop?.dispose()
      model.traverse((o) => {
        const mm = o as THREE.Mesh
        if (!mm.isMesh) return
        mm.geometry.dispose()
        for (const mat of Array.isArray(mm.material) ? mm.material : [mm.material]) {
          for (const value of Object.values(mat)) if (value instanceof THREE.Texture) value.dispose()
          mat.dispose()
        }
      })
    },
  }
}
