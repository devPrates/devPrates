import * as THREE from 'three'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { type GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Peças comuns do avatar riggado (Tripo, esqueleto Mixamo), usadas pelo
// avatar sólido do hero e pelo boneco de partículas dos serviços.

export const AVATAR_URL = '/3D/prates-avatar.glb'
export const HEART_URL = '/3D/prates-anim-coracao.glb'
export const BOX_URL = '/3D/prates-anim-boxe.glb'
export const CALL_URL = '/3D/prates-anim-ligacao.glb'
export const BOW_URL = '/3D/prates-anim-reverencia.glb'
export const WARMUP_URL = '/3D/prates-anim-aquecimento.glb'

let loader: GLTFLoader | null = null
export function loadGltf(url: string): Promise<GLTF> {
  if (!loader) {
    loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
  }
  return loader.loadAsync(url)
}

// Deixa o modelo de frente para +Z, com os pés em y = 0, centrado em x/z e
// com altura 1. Cada exportação do Tripo vem numa orientação; a frente sai
// dos quadris: frente = cima × direita.
export function prepareRig(model: THREE.Object3D) {
  model.updateWorldMatrix(true, true)
  const hip = (side: string) => {
    let found: THREE.Object3D | undefined
    model.traverse((o) => {
      if (!found && (o as THREE.Bone).isBone && o.name.endsWith(`${side}UpLeg`)) found = o
    })
    return found?.getWorldPosition(new THREE.Vector3())
  }
  const left = hip('Left')
  const right = hip('Right')
  if (left && right) {
    const forward = new THREE.Vector3(0, 1, 0).cross(right.sub(left).setY(0))
    if (forward.lengthSq() > 1e-8) model.rotation.y = -Math.atan2(forward.x, forward.z)
  }
  model.updateWorldMatrix(true, true)
  const box = new THREE.Box3().setFromObject(model, true)
  const size = box.getSize(new THREE.Vector3())
  const s = 1 / (size.y || 1)
  model.scale.setScalar(s)
  model.position.set(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s)
  model.updateWorldMatrix(true, true)
}

export type ClipLoop = {
  // Põe os ossos na pose do instante `elapsed` (segundos) do loop.
  apply: (elapsed: number) => void
  dispose: () => void
}

// Toca um clipe em loop sem tranco. Os clipes do Tripo não foram feitos para
// repetir (o último quadro não bate com o primeiro), então o final de cada
// volta é misturado com o começo da próxima por `blend` segundos, com duas
// ações do mesmo clipe e pesos complementares. Volta de período = duração − blend.
export function createClipLoop(model: THREE.Object3D, clip: THREE.AnimationClip, blend = 0.5): ClipLoop {
  // O retarget tem ossos de ponta que o rig pode não ter: tira essas trilhas.
  clip.tracks = clip.tracks.filter((track) =>
    model.getObjectByName(THREE.PropertyBinding.parseTrackName(track.name).nodeName),
  )
  const mixer = new THREE.AnimationMixer(model)
  const main = mixer.clipAction(clip)
  const tail = mixer.clipAction(clip.clone())
  for (const action of [main, tail]) {
    action.play()
    action.paused = true // o tempo é definido à mão a cada quadro
  }
  const d = clip.duration
  const period = Math.max(0.1, d - blend)
  return {
    apply(elapsed) {
      const u = ((elapsed % period) + period) % period
      const f = u < blend ? u / blend : 1
      main.time = u
      main.setEffectiveWeight(f)
      tail.time = Math.min(d, u + period)
      tail.setEffectiveWeight(1 - f)
      mixer.update(0)
    },
    dispose() {
      mixer.stopAllAction()
      mixer.uncacheRoot(model)
    },
  }
}
