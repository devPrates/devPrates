// Simplex noise 3D (Ashima Arts / Stefan Gustavson, licença MIT).
const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

// position = forma de origem, aPosB = forma de destino. uMorph leva de uma
// para a outra com atraso por partícula; no meio do caminho elas explodem na
// direção de aRandom.xyz e se remontam.
export const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform float uScatter;
uniform float uNoise;
uniform float uIntro;
uniform float uSize;
uniform float uPixelRatio;
uniform vec2 uMouse;
uniform float uMouseRadius;
uniform float uMouseForce;
uniform float uScroll;
uniform float uWrap;

attribute vec3 aPosB;
attribute vec4 aRandom;

varying float vAlpha;
varying float vTone;
varying float vGlow;

${NOISE}

void main() {
  float seed = aRandom.w;

  // Cada partícula começa a migrar num momento diferente.
  float m = clamp(uMorph * 1.5 - seed * 0.5, 0.0, 1.0);
  m = m * m * (3.0 - 2.0 * m);
  vec3 p = mix(position, aPosB, m);

  float burst = sin(3.14159265 * m);
  p += aRandom.xyz * burst * uScatter;

  float t = uTime * 0.18;
  vec3 drift = vec3(
    snoise(p * 1.3 + vec3(t, 0.0, 0.0)),
    snoise(p * 1.3 + vec3(31.4, t, 0.0)),
    snoise(p * 1.3 + vec3(0.0, 57.2, t))
  );
  p += drift * (uNoise + burst * 0.18);

  // Entrada: chegam de longe e se juntam na primeira forma.
  float intro = clamp(uIntro * 1.6 - seed * 0.6, 0.0, 1.0);
  intro = 1.0 - pow(1.0 - intro, 3.0);
  p = mix(aRandom.xyz * 5.0 + vec3(0.0, 0.0, 2.0), p, intro);

  vec4 world = modelMatrix * vec4(p, 1.0);

  // Poeira: rola junto com o scroll e dá a volta na tela.
  if (uWrap > 0.5) {
    world.y = mod(world.y + uScroll + 3.5, 7.0) - 3.5;
  }

  // O mouse afasta as partículas, como um dedo na areia.
  vec2 toMouse = world.xy - uMouse;
  float dist = length(toMouse);
  float force = smoothstep(uMouseRadius, 0.0, dist);
  world.xy += normalize(toMouse + 1e-5) * force * uMouseForce;
  world.z += force * uMouseForce * 0.6;

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixelRatio * (0.55 + seed * 0.9) / -mv.z;

  vAlpha = (0.35 + fract(seed * 7.13) * 0.65) * (1.0 + burst * 0.6);
  vTone = fract(seed * 13.7);
  vGlow = force;
}
`

export const fragmentShader = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uOpacity;
uniform float uSolid;

varying float vAlpha;
varying float vTone;
varying float vGlow;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.05, d);

  // Maioria dourada, algumas mais claras (creme) para dar brilho.
  vec3 color = mix(uColorA, uColorB, smoothstep(0.0, 0.85, vTone));
  color = mix(color, uColorC, step(0.92, vTone) * 0.8 + vGlow * 0.5);

  // No fim da página as partículas clareiam até o creme do PRATES sólido.
  color = mix(color, uColorC, uSolid);
  gl_FragColor = vec4(color, a * vAlpha * uOpacity);
  #include <colorspace_fragment>
}
`
