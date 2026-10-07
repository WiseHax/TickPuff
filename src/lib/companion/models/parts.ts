/**
 * Building blocks for procedural companions: a shared toon material ramp and
 * smooth primitives. Geometry is created per build and released by
 * `disposeObject` when the companion is swapped.
 */
import * as THREE from 'three';

let toonRamp: THREE.DataTexture | null = null;

/** Three-step light ramp that gives the soft cel-shaded look. */
function getToonRamp(): THREE.DataTexture {
  if (toonRamp) return toonRamp;
  const steps = new Uint8Array([110, 110, 110, 255, 190, 190, 190, 255, 255, 255, 255, 255]);
  toonRamp = new THREE.DataTexture(steps, 3, 1, THREE.RGBAFormat);
  toonRamp.minFilter = THREE.NearestFilter;
  toonRamp.magFilter = THREE.NearestFilter;
  toonRamp.generateMipmaps = false;
  toonRamp.needsUpdate = true;
  return toonRamp;
}

export interface MaterialOptions {
  transparent?: boolean;
  opacity?: number;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  side?: THREE.Side;
}

export function toon(color: THREE.ColorRepresentation, options: MaterialOptions = {}): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: getToonRamp(),
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 1,
    side: options.side ?? THREE.FrontSide,
    depthWrite: !(options.transparent ?? false),
  });
}

/** Unlit material for glowing details (eyes, lights). */
export function glow(color: THREE.ColorRepresentation, opacity = 1): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(geometry, material);
}

/** Ellipsoid with radii (rx, ry, rz). */
export function ellipsoid(rx: number, ry: number, rz: number, material: THREE.Material, segments = 24): THREE.Mesh {
  const m = mesh(new THREE.SphereGeometry(1, segments, Math.max(8, Math.round(segments * 0.75))), material);
  m.scale.set(rx, ry, rz);
  return m;
}

export function sphere(radius: number, material: THREE.Material, segments = 20): THREE.Mesh {
  return mesh(new THREE.SphereGeometry(radius, segments, Math.max(8, Math.round(segments * 0.75))), material);
}

/** Capsule hanging down from its pivot (pivot at the top end). */
export function limb(radius: number, length: number, material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.CapsuleGeometry(radius, Math.max(0.001, length - radius * 2), 6, 12);
  geometry.translate(0, -length / 2, 0);
  return mesh(geometry, material);
}

/** Cone pointing up from its base (pivot at the base). */
export function cone(radius: number, height: number, material: THREE.Material, radial = 16): THREE.Mesh {
  const geometry = new THREE.ConeGeometry(radius, height, radial);
  geometry.translate(0, height / 2, 0);
  return mesh(geometry, material);
}

export function torus(radius: number, tube: number, material: THREE.Material): THREE.Mesh {
  return mesh(new THREE.TorusGeometry(radius, tube, 10, 32), material);
}

export function cylinder(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  material: THREE.Material,
  radial = 20,
) {
  return mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radial), material);
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

/**
 * Cute glossy eye: dark iris plus a small highlight.
 * Returns the eye pivot (scale its Y to blink).
 */
export function eye(
  radius: number,
  color: THREE.ColorRepresentation = 0x1b1b24,
  options: { pupil?: THREE.ColorRepresentation; slit?: boolean } = {},
): THREE.Group {
  const group = new THREE.Group();
  const iris = sphere(radius, toon(color), 16);
  iris.scale.z = 0.6;
  group.add(iris);
  if (options.pupil !== undefined) {
    const pupil = ellipsoid(radius * (options.slit ? 0.28 : 0.55), radius * 0.8, radius * 0.3, toon(options.pupil), 12);
    pupil.position.z = radius * 0.45;
    group.add(pupil);
  }
  const shine = sphere(radius * 0.32, glow(0xffffff), 8);
  shine.position.set(radius * 0.3, radius * 0.35, radius * 0.55);
  group.add(shine);
  return group;
}

/** Mirror a builder across X to make a left/right pair. */
export function pair(build: (side: -1 | 1) => THREE.Object3D): [THREE.Object3D, THREE.Object3D] {
  return [build(-1), build(1)];
}

/** Release every geometry, material and texture under `root` (shared ramp excluded). */
export function disposeObject(root: THREE.Object3D): void {
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    const m = object as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => materials.add(mat));
  });
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture && value !== toonRamp) value.dispose();
    }
    material.dispose();
  }
}
