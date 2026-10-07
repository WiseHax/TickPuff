/**
 * Pointer interaction with the companion.
 *
 * The WebGL canvas never receives pointer events (it sits under the UI and
 * the window drag region). Instead an invisible, focusable button follows
 * the companion's projected screen bounds: hovering it makes the companion
 * look at you, clicking (or Enter/Space) pokes it.
 */
import * as THREE from 'three';

export interface InteractionCallbacks {
  onPoke(): void;
  onHoverChange(hovered: boolean): void;
}

export class InteractionController {
  hovered = false;
  private readonly pointer = new THREE.Vector2(0, 0);
  private readonly raycaster = new THREE.Raycaster();
  private readonly plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private readonly lookPoint = new THREE.Vector3();
  private readonly corner = new THREE.Vector3();
  private readonly cleanups: (() => void)[] = [];

  constructor(
    private readonly hitbox: HTMLElement | null,
    private readonly callbacks: InteractionCallbacks,
  ) {
    const onMove = (event: PointerEvent) => {
      this.pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    this.cleanups.push(() => window.removeEventListener('pointermove', onMove));

    if (hitbox) {
      const enter = () => this.setHovered(true);
      const leave = () => this.setHovered(false);
      const click = () => callbacks.onPoke();
      hitbox.addEventListener('pointerenter', enter);
      hitbox.addEventListener('pointerleave', leave);
      hitbox.addEventListener('focus', enter);
      hitbox.addEventListener('blur', leave);
      hitbox.addEventListener('click', click);
      this.cleanups.push(() => {
        hitbox.removeEventListener('pointerenter', enter);
        hitbox.removeEventListener('pointerleave', leave);
        hitbox.removeEventListener('focus', enter);
        hitbox.removeEventListener('blur', leave);
        hitbox.removeEventListener('click', click);
      });
    }
  }

  private setHovered(value: boolean) {
    if (this.hovered === value) return;
    this.hovered = value;
    this.callbacks.onHoverChange(value);
  }

  /**
   * Head yaw/pitch (relative to the body heading) that points the face at
   * the pointer, imagined slightly in front of the companion.
   */
  lookAngles(camera: THREE.Camera, head: THREE.Vector3, heading: number): { yaw: number; pitch: number } {
    this.plane.constant = -(head.z + 4);
    this.raycaster.setFromCamera(this.pointer, camera);
    const point = this.raycaster.ray.intersectPlane(this.plane, this.lookPoint);
    if (!point) return { yaw: 0, pitch: 0 };
    const dx = point.x - head.x;
    const dy = point.y - head.y;
    const dz = point.z - head.z;
    let yaw = Math.atan2(dx, dz) - heading;
    yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    const pitch = -Math.atan2(dy, Math.hypot(dx, dz));
    return { yaw, pitch };
  }

  /**
   * Position the hitbox over the companion: a box from the feet (`base`)
   * up to `height` world units, `width` units wide, projected to the screen.
   */
  updateHitbox(camera: THREE.Camera, base: THREE.Vector3, height: number, width: number, visible: boolean) {
    if (!this.hitbox) return;
    if (!visible) {
      this.hitbox.style.display = 'none';
      return;
    }
    const project = (x: number, y: number) => {
      this.corner.set(base.x + x, base.y + y, base.z).project(camera);
      return { x: ((this.corner.x + 1) / 2) * window.innerWidth, y: ((1 - this.corner.y) / 2) * window.innerHeight };
    };
    const topLeft = project(-width / 2, height);
    const bottomRight = project(width / 2, 0);
    const style = this.hitbox.style;
    style.display = 'block';
    style.transform = `translate(${topLeft.x.toFixed(1)}px, ${topLeft.y.toFixed(1)}px)`;
    style.width = `${Math.max(24, bottomRight.x - topLeft.x).toFixed(1)}px`;
    style.height = `${Math.max(24, bottomRight.y - topLeft.y).toFixed(1)}px`;
  }

  dispose() {
    this.cleanups.forEach((cleanup) => cleanup());
    this.cleanups.length = 0;
  }
}
