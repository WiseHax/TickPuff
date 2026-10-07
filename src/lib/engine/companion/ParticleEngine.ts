import * as THREE from 'three';
import type { WeatherType } from '../types';

interface ParticleOptions {
  count: number;
  speed: number;
  size: number;
  color: number;
  opacity: number;
  dropShape?: boolean; // True for rain, false for snow/dust
}

export class ParticleEngine {
  private particles: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.PointsMaterial | null = null;
  private velocities: Float32Array | null = null;
  private type: WeatherType = 'clear';

  constructor(private scene: THREE.Scene) {}

  public setWeather(type: WeatherType) {
    if (this.type === type) return;
    this.type = type;
    this.clear();

    switch (type) {
      case 'rain':
      case 'heavy-rain':
        this.createParticles({
          count: type === 'heavy-rain' ? 3000 : 1000,
          speed: 15,
          size: 0.05,
          color: 0xaaaaff,
          opacity: 0.6,
          dropShape: true
        });
        break;
      case 'snow':
        this.createParticles({
          count: 1500,
          speed: 2,
          size: 0.1,
          color: 0xffffff,
          opacity: 0.8
        });
        break;
      case 'petals':
      case 'leaves':
        this.createParticles({
          count: 500,
          speed: 1.5,
          size: 0.15,
          color: type === 'petals' ? 0xffb7c5 : 0xe67e22,
          opacity: 0.9
        });
        break;
      case 'dust':
      case 'stars':
      case 'bubbles':
        this.createParticles({
          count: 800,
          speed: 0.5,
          size: 0.04,
          color: type === 'bubbles' ? 0x88ccff : 0xffddaa,
          opacity: 0.5
        });
        break;
      case 'fog':
      case 'clear':
      default:
        // Handled by environment fog/lighting, no particles needed
        break;
    }
  }

  private createParticles(opts: ParticleOptions) {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(opts.count * 3);
    this.velocities = new Float32Array(opts.count * 3);

    for (let i = 0; i < opts.count; i++) {
      // Spawn in a wide volume around the camera
      positions[i * 3] = (Math.random() - 0.5) * 30; // x
      positions[i * 3 + 1] = Math.random() * 20;     // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z

      // Velocity
      if (this.type === 'rain' || this.type === 'heavy-rain') {
        this.velocities[i * 3] = (Math.random() - 0.5) * 0.1; // slight wind
        this.velocities[i * 3 + 1] = -(Math.random() * 0.2 + opts.speed); // fast down
        this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
      } else {
        // Snow, petals, dust flutter
        this.velocities[i * 3] = (Math.random() - 0.5) * opts.speed; // drift x
        this.velocities[i * 3 + 1] = -(Math.random() * 0.5 + opts.speed * 0.5); // drift down
        this.velocities[i * 3 + 2] = (Math.random() - 0.5) * opts.speed; // drift z
      }
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Simple circle/drop texture logic using canvas (cheap procedural texture)
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    if (opts.dropShape) {
      // Draw a line for rain
      ctx.fillStyle = '#fff';
      ctx.fillRect(15, 0, 2, 32);
    } else {
      // Draw a soft circle
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);

    this.material = new THREE.PointsMaterial({
      color: opts.color,
      size: opts.size,
      transparent: true,
      opacity: opts.opacity,
      map: texture,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);
  }

  public update(dt: number) {
    if (!this.particles || !this.geometry || !this.velocities) return;

    const positions = this.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3] += this.velocities[i * 3] * dt;
      positions[i * 3 + 1] += this.velocities[i * 3 + 1] * dt;
      positions[i * 3 + 2] += this.velocities[i * 3 + 2] * dt;

      // Add flutter to X and Z for snow/petals/bubbles
      if (this.type !== 'rain' && this.type !== 'heavy-rain') {
        positions[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.02;
        positions[i * 3 + 2] += Math.cos(Date.now() * 0.001 + i) * 0.02;
      }

      // Reset if out of bounds (falling below ground)
      if (positions[i * 3 + 1] < -2) {
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      }
      
      // Bubbles rise instead of fall
      if (this.type === 'bubbles' && positions[i * 3 + 1] > 20) {
          positions[i * 3 + 1] = -2;
      }
      if (this.type === 'bubbles') {
          positions[i * 3 + 1] -= this.velocities[i * 3 + 1] * dt * 2; // reverse gravity
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  public clear() {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.geometry?.dispose();
      this.material?.dispose();
      this.material?.map?.dispose();
      this.particles = null;
    }
  }

  public dispose() {
    this.clear();
  }
}
