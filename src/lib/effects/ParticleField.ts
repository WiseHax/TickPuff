/**
 * One GPU particle effect: a single THREE.Points draw call whose motion is
 * computed entirely in the vertex shader from per-particle random seeds and
 * a time uniform. Updating an effect each frame costs one uniform write.
 */
import * as THREE from 'three';
import { SHAPE_IDS, particleCount, type ParticlePreset } from './presets';

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uFall;
  uniform float uDrift;
  uniform float uSwirl;
  uniform float uWind;
  uniform float uWander;
  uniform float uSize;
  uniform float uScale;
  uniform float uMaxSize;
  uniform vec3 uVolume;
  uniform vec3 uOrigin;
  attribute vec4 aSeed;
  attribute vec3 aColor;
  attribute float aSize;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vRot;
  varying float vTwinkle;

  void main() {
    float speed = 0.7 + 0.6 * aSeed.w;
    vec3 p;
    p.y = mod(aSeed.y * uVolume.y - uTime * uFall * speed, uVolume.y);
    p.x = mod(aSeed.x * uVolume.x + uTime * uWind * speed, uVolume.x);
    p.z = aSeed.z * uVolume.z;
    float phase = aSeed.w * 6.2831 + uTime * uSwirl * (0.6 + aSeed.z);
    p.x += sin(phase) * uDrift;
    p.z += cos(phase * 0.8) * uDrift * 0.5;
    p += vec3(
      sin(uTime * 0.31 + aSeed.x * 20.0),
      sin(uTime * 0.23 + aSeed.y * 17.0),
      cos(uTime * 0.27 + aSeed.z * 13.0)
    ) * uWander;

    // Fade at the top and bottom of the volume so wrapping is invisible.
    float yN = p.y / uVolume.y;
    vAlpha = smoothstep(0.0, 0.08, yN) * smoothstep(1.0, 0.85, yN);

    vec4 mv = modelViewMatrix * vec4(p + uOrigin, 1.0);
    gl_Position = projectionMatrix * mv;
    // Clamp so nothing near the camera turns into a giant sprite.
    gl_PointSize = min(uSize * aSize * uScale / max(0.1, -mv.z), uMaxSize);
    vColor = aColor;
    vRot = phase * 0.7;
    vTwinkle = 0.55 + 0.45 * sin(uTime * (1.5 + aSeed.z * 2.0) + aSeed.x * 40.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform int uKind;
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vRot;
  varying float vTwinkle;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float s = sin(vRot);
    float co = cos(vRot);
    vec2 r = vec2(c.x * co - c.y * s, c.x * s + c.y * co);
    float d = length(c);
    float a = 0.0;
    vec3 color = vColor;

    if (uKind == 0) {          // rain streak
      float width = 1.0 - smoothstep(0.0, 0.05, abs(c.x + c.y * 0.12));
      a = width * smoothstep(0.5, 0.1, abs(c.y)) * 0.9;
    } else if (uKind == 1) {   // soft round (snow, dust)
      a = smoothstep(0.5, 0.05, d);
    } else if (uKind == 2) {   // petal: ellipse with a notch at the tip
      float e = length(r / vec2(0.22, 0.42));
      a = smoothstep(1.0, 0.8, e) * smoothstep(0.02, 0.1, length(r - vec2(0.0, 0.42)));
      color *= 0.9 + 0.2 * (0.5 - r.y);
    } else if (uKind == 3) {   // leaf with a darker midrib
      float e = length(r / vec2(0.17, 0.45));
      a = smoothstep(1.0, 0.85, e);
      color *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.025, abs(r.x)));
    } else if (uKind == 4) {   // bubble ring with a highlight
      float ring = smoothstep(0.5, 0.43, d) * smoothstep(0.3, 0.43, d);
      float highlight = smoothstep(0.12, 0.0, length(c - vec2(-0.14, -0.14)));
      a = ring * 0.8 + highlight;
    } else if (uKind == 5) {   // firefly glow
      a = (smoothstep(0.5, 0.0, d) * 0.55 + smoothstep(0.12, 0.0, d)) * vTwinkle;
    } else {                   // spark
      a = smoothstep(0.25, 0.0, d) * vTwinkle;
    }

    a *= vAlpha * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(color, a);
  }
`;

export class ParticleField {
  readonly points: THREE.Points;
  private readonly material: THREE.ShaderMaterial;

  constructor(
    readonly preset: ParticlePreset,
    density: number,
    random: () => number = Math.random,
  ) {
    const count = particleCount(preset, density);
    const geometry = new THREE.BufferGeometry();
    const seeds = new Float32Array(count * 4);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const palette = preset.colors.map((hex) => new THREE.Color(hex));
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < 4; j++) seeds[i * 4 + j] = random();
      const color = palette[Math.floor(random() * palette.length)];
      colors.set([color.r, color.g, color.b], i * 3);
      sizes[i] = 0.6 + random() * 0.8;
    }
    // Positions are computed in the shader; the attribute only sets the count.
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: preset.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uFall: { value: preset.fall },
        uDrift: { value: preset.drift },
        uSwirl: { value: preset.swirl },
        uWind: { value: preset.wind },
        uWander: { value: preset.wander },
        uSize: { value: preset.size },
        uScale: { value: 500 },
        uMaxSize: { value: 48 },
        uVolume: { value: new THREE.Vector3(...preset.volume) },
        uOrigin: { value: new THREE.Vector3(...preset.origin) },
        uKind: { value: SHAPE_IDS[preset.shape] },
        uOpacity: { value: preset.opacity },
      },
    });
    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false; // positions live in the shader
    this.points.renderOrder = 2;
  }

  get count(): number {
    return this.points.geometry.getAttribute('position').count;
  }

  update(time: number) {
    this.material.uniforms.uTime.value = time;
  }

  /** Pixels per world unit at distance 1 (depends on viewport and FOV). */
  setScale(scale: number, pixelRatio = 1) {
    this.material.uniforms.uScale.value = scale;
    this.material.uniforms.uMaxSize.value = 48 * pixelRatio;
  }

  setOpacity(multiplier: number) {
    this.material.uniforms.uOpacity.value = this.preset.opacity * multiplier;
  }

  dispose() {
    this.points.removeFromParent();
    this.points.geometry.dispose();
    this.material.dispose();
  }
}
