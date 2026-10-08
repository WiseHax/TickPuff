/**
 * Building blocks for procedural companions: a shared cel-shading look (toon
 * ramp, soft top-to-bottom shading, a rim light and ink outlines) plus smooth
 * primitives. Geometry is created per build and released by `disposeObject`
 * when the companion is swapped.
 */
import * as THREE from 'three';

let toonRamp: THREE.DataTexture | null = null;

/** Four-step light ramp: soft cel shading with a gentle core shadow. */
function getToonRamp(): THREE.DataTexture {
  if (toonRamp) return toonRamp;
  const levels = [120, 172, 222, 255];
  const steps = new Uint8Array(levels.flatMap((v) => [v, v, v, 255]));
  toonRamp = new THREE.DataTexture(steps, levels.length, 1, THREE.RGBAFormat);
  toonRamp.minFilter = THREE.NearestFilter;
  toonRamp.magFilter = THREE.NearestFilter;
  toonRamp.generateMipmaps = false;
  toonRamp.needsUpdate = true;
  return toonRamp;
}

/**
 * Lighting shared by every companion material, set by the renderer for the
 * current world and time of day.
 */
export const companionLook = {
  rimColor: { value: new THREE.Color(0xffffff) },
  rimStrength: { value: 0.45 },
  /** Outline width in view-space units per unit of depth (≈ constant pixels). */
  outlineWidth: { value: 0.0012 },
};

/** Adds a view-dependent rim light to a toon material. */
function withRim(material: THREE.MeshToonMaterial): THREE.MeshToonMaterial {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.rimColor = companionLook.rimColor;
    shader.uniforms.rimStrength = companionLook.rimStrength;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 rimColor;\nuniform float rimStrength;')
      .replace(
        '#include <opaque_fragment>',
        `float rimFacing = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
        outgoingLight += rimColor * rimStrength * smoothstep(0.55, 0.9, rimFacing) * diffuseColor.rgb;
        #include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () => 'tickpuff-toon-rim';
  return material;
}

export interface MaterialOptions {
  transparent?: boolean;
  opacity?: number;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  side?: THREE.Side;
}

export function toon(color: THREE.ColorRepresentation, options: MaterialOptions = {}): THREE.MeshToonMaterial {
  return withRim(
    new THREE.MeshToonMaterial({
      color,
      gradientMap: getToonRamp(),
      vertexColors: true,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissiveIntensity ?? 1,
      side: options.side ?? THREE.FrontSide,
      depthWrite: !(options.transparent ?? false),
    }),
  );
}

/** Unlit material for glowing details (eyes, lights). */
export function glow(color: THREE.ColorRepresentation, opacity = 1): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
}

/** How much darker the underside of a surface is than its top (painted ambient occlusion). */
const DEFAULT_SHADE = 0.22;

/**
 * Vertex colours that darken a surface from top to bottom. Toon materials
 * multiply them with their base colour, which reads as soft, painted light.
 */
function shadeGeometry(geometry: THREE.BufferGeometry, shade: number): THREE.BufferGeometry {
  const position = geometry.getAttribute('position');
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const minY = box?.min.y ?? -1;
  const span = Math.max(1e-6, (box?.max.y ?? 1) - minY);
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const t = (position.getY(i) - minY) / span;
    const v = 1 - shade * (1 - Math.sqrt(t));
    colors[i * 3] = v;
    colors[i * 3 + 1] = v;
    colors[i * 3 + 2] = v;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

/** Mesh with painted top-to-bottom shading (required by `toon` materials, which use vertex colours). */
export function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, shade = DEFAULT_SHADE): THREE.Mesh {
  return new THREE.Mesh(shadeGeometry(geometry, shade), material);
}

/** Marks a small detail (eye, nose, marking) so it gets no outline. */
export function detail<T extends THREE.Object3D>(object: T): T {
  object.traverse((child) => (child.userData.noOutline = true));
  return object;
}

/** Ellipsoid with radii (rx, ry, rz). */
export function ellipsoid(rx: number, ry: number, rz: number, material: THREE.Material, segments = 32): THREE.Mesh {
  const m = mesh(new THREE.SphereGeometry(1, segments, Math.max(10, Math.round(segments * 0.75))), material);
  m.scale.set(rx, ry, rz);
  return m;
}

export function sphere(radius: number, material: THREE.Material, segments = 28): THREE.Mesh {
  return mesh(new THREE.SphereGeometry(radius, segments, Math.max(10, Math.round(segments * 0.75))), material);
}

/** Capsule hanging down from its pivot (pivot at the top end). */
export function limb(radius: number, length: number, material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.CapsuleGeometry(radius, Math.max(0.001, length - radius * 2), 8, 16);
  geometry.translate(0, -length / 2, 0);
  return mesh(geometry, material, 0.12);
}

/** Tapered limb hanging down from its pivot: thick at the top, thin at the bottom. */
export function taperedLimb(top: number, bottom: number, length: number, material: THREE.Material): THREE.Mesh {
  const points = [
    new THREE.Vector2(0, 0),
    ...Array.from({ length: 7 }, (_, i) => {
      const a = (i / 6) * (Math.PI / 2);
      return new THREE.Vector2(Math.sin(a) * bottom, bottom - Math.cos(a) * bottom);
    }),
    ...Array.from({ length: 7 }, (_, i) => {
      const a = (i / 6) * (Math.PI / 2);
      return new THREE.Vector2(Math.cos(a) * top, length - top + Math.sin(a) * top);
    }),
  ];
  const geometry = new THREE.LatheGeometry(points, 18);
  geometry.translate(0, -length, 0);
  return mesh(geometry, material, 0.12);
}

/** Cone pointing up from its base (pivot at the base). */
export function cone(radius: number, height: number, material: THREE.Material, radial = 20): THREE.Mesh {
  const geometry = new THREE.ConeGeometry(radius, height, radial);
  geometry.translate(0, height / 2, 0);
  return mesh(geometry, material, 0.12);
}

/**
 * Soft rounded cone (an ear, a tuft, a beak) pointing up from its base:
 * a lathe profile with a bulging base and a rounded tip.
 */
export function softCone(radius: number, height: number, material: THREE.Material, bulge = 0.25): THREE.Mesh {
  const points: THREE.Vector2[] = [];
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = radius * (1 - t) ** 0.85 * (1 + bulge * Math.sin(t * Math.PI));
    points.push(new THREE.Vector2(Math.max(0.0005, r), t * height));
  }
  points.unshift(new THREE.Vector2(0, 0));
  return mesh(new THREE.LatheGeometry(points, 20), material, 0.1);
}

export function torus(radius: number, tube: number, material: THREE.Material, arc = Math.PI * 2): THREE.Mesh {
  return mesh(new THREE.TorusGeometry(radius, tube, 12, 40, arc), material, 0);
}

export function cylinder(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  material: THREE.Material,
  radial = 24,
) {
  return mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radial), material, 0.12);
}

/** Rounded box (machines). */
export function roundedBox(
  width: number,
  height: number,
  depth: number,
  radius: number,
  material: THREE.Material,
): THREE.Mesh {
  const r = Math.min(radius, width / 2, height / 2, depth / 2);
  const geometry = new THREE.BoxGeometry(width, height, depth, 6, 6, 6);
  const position = geometry.getAttribute('position');
  const inner = new THREE.Vector3(width / 2 - r, height / 2 - r, depth / 2 - r);
  const v = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    c.set(
      THREE.MathUtils.clamp(v.x, -inner.x, inner.x),
      THREE.MathUtils.clamp(v.y, -inner.y, inner.y),
      THREE.MathUtils.clamp(v.z, -inner.z, inner.z),
    );
    v.sub(c).normalize().multiplyScalar(r).add(c);
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return mesh(geometry, material, 0.15);
}

/** Group placed at a position; handy for pivots. */
export function pivot(x = 0, y = 0, z = 0, ...children: THREE.Object3D[]): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  if (children.length) group.add(...children);
  return group;
}

export function at<T extends THREE.Object3D>(object: T, x: number, y: number, z: number): T {
  object.position.set(x, y, z);
  return object;
}

export function rotated<T extends THREE.Object3D>(object: T, x: number, y = 0, z = 0): T {
  object.rotation.set(x, y, z);
  return object;
}

export interface EyeOptions {
  /** Iris colour; the eye is a dark glossy bead when omitted. */
  iris?: THREE.ColorRepresentation;
  /** Vertical slit pupil (cats). */
  slit?: boolean;
  /** Width / height of the eye (1 = round). */
  aspect?: number;
  /** Strength of the lower catch-light tinted with the iris colour. */
  sparkle?: number;
}

/**
 * Big glossy cartoon eye: dark rim, coloured iris, pupil and two
 * catch-lights. Returns the eye pivot; scale its Y to blink.
 */
export function eye(radius: number, rim: THREE.ColorRepresentation = 0x15121a, options: EyeOptions = {}): THREE.Group {
  const group = new THREE.Group();
  const aspect = options.aspect ?? 0.88;
  const ball = ellipsoid(radius * aspect, radius, radius * 0.55, toon(rim), 24);
  group.add(ball);
  if (options.iris !== undefined) {
    const iris = ellipsoid(radius * aspect * 0.78, radius * 0.8, radius * 0.3, glow(options.iris), 24);
    iris.position.set(0, -radius * 0.05, radius * 0.32);
    group.add(iris);
    const pupil = ellipsoid(
      radius * aspect * (options.slit ? 0.2 : 0.42),
      radius * (options.slit ? 0.68 : 0.45),
      radius * 0.2,
      glow(0x0b0a10),
      16,
    );
    pupil.position.set(0, -radius * 0.05, radius * 0.46);
    group.add(pupil);
  }
  const sparkle = options.sparkle ?? 0.85;
  const shine = sphere(radius * 0.3, glow(0xffffff), 12);
  shine.scale.set(1, 1.1, 0.5);
  shine.position.set(radius * 0.32 * aspect, radius * 0.38, radius * 0.55);
  group.add(shine);
  const small = sphere(radius * 0.13, glow(0xffffff, sparkle), 10);
  small.position.set(-radius * 0.3 * aspect, -radius * 0.38, radius * 0.55);
  group.add(small);
  return detail(group);
}

/** Soft blush mark on a cheek. */
export function blush(radius: number, color: THREE.ColorRepresentation = 0xff8fa6, opacity = 0.55): THREE.Mesh {
  const m = ellipsoid(radius, radius * 0.6, radius * 0.25, glow(color, opacity), 16);
  m.renderOrder = 2;
  return detail(m);
}

/**
 * Round paw at the end of a leg, with toe beans on the bottom.
 * Positioned so its top sits at the pivot.
 */
export function paw(radius: number, fur: THREE.Material, beans?: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  group.add(at(ellipsoid(radius * 1.05, radius * 0.7, radius * 1.25, fur, 20), 0, -radius * 0.55, radius * 0.25));
  if (beans) {
    for (const x of [-0.45, 0, 0.45]) {
      group.add(
        detail(at(sphere(radius * 0.22, beans, 8), x * radius, -radius * 0.95, radius * (0.95 - Math.abs(x) * 0.3))),
      );
    }
  }
  return group;
}

/** Mirror a builder across X to make a left/right pair. */
export function pair(build: (side: -1 | 1) => THREE.Object3D): [THREE.Object3D, THREE.Object3D] {
  return [build(-1), build(1)];
}

/** Body pivot with its rest height remembered for the animator. */
export function bodyAt(y: number): THREE.Group {
  const body = pivot(0, y, 0);
  body.userData.restY = y;
  return body;
}

// ── Ink outlines ─────────────────────────────────────────────

const OUTLINE_VERTEX = /* glsl */ `
  uniform float outlineWidth;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vec3 viewNormal = normalize(normalMatrix * normal);
    viewPosition.xyz += viewNormal * outlineWidth * -viewPosition.z;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const OUTLINE_FRAGMENT = /* glsl */ `
  uniform vec3 color;
  uniform float opacity;
  void main() {
    gl_FragColor = vec4(color, opacity);
  }
`;

/** Material for the back-face hull that draws the outline. */
export function outlineMaterial(color: THREE.ColorRepresentation, opacity = 1): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      opacity: { value: opacity },
      outlineWidth: companionLook.outlineWidth,
    },
    vertexShader: OUTLINE_VERTEX,
    fragmentShader: OUTLINE_FRAGMENT,
    side: THREE.BackSide,
    transparent: opacity < 1,
  });
}

/**
 * Gives every opaque, outline-able mesh under `root` an inked outline
 * (an inverted hull that shares the mesh's geometry).
 */
export function addOutlines(root: THREE.Object3D, color: THREE.ColorRepresentation, opacity = 1): void {
  const material = outlineMaterial(color, opacity);
  const targets: THREE.Mesh[] = [];
  root.traverse((object) => {
    const m = object as THREE.Mesh;
    if (!m.isMesh || m.userData.noOutline || m.userData.outline) return;
    const own = Array.isArray(m.material) ? m.material[0] : m.material;
    if (!own || own.transparent || own instanceof THREE.MeshBasicMaterial) return;
    targets.push(m);
  });
  for (const target of targets) {
    const hull = new THREE.Mesh(target.geometry, material);
    hull.userData.outline = true;
    hull.userData.noOutline = true;
    hull.renderOrder = -1;
    target.add(hull);
  }
}

/** Release every geometry, material and texture under `root` (shared ramp excluded). */
export function disposeObject(root: THREE.Object3D): void {
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  root.traverse((object) => {
    const m = object as THREE.Mesh;
    if (m.geometry) geometries.add(m.geometry);
    if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => materials.add(mat));
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture && value !== toonRamp) value.dispose();
    }
    material.dispose();
  }
}
