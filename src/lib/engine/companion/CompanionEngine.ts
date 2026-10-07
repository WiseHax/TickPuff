import * as THREE from 'three';
import type { PetState, WeatherType } from '../types';
import type { PerformanceLevel } from '../../stores/performance';
import { companionRegistry, type CompanionDefinition } from './CompanionRegistry';
import { ProceduralBuilder, type ProceduralRig } from './ProceduralBuilder';
import { ParticleEngine } from './ParticleEngine';

export class CompanionEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private particleEngine: ParticleEngine;

  private directionalLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;

  private activeDefinition: CompanionDefinition | null = null;
  private rig: ProceduralRig | null = null;

  private targetLookX = 0;
  private targetLookY = 0;
  private currentState: PetState = 'IDLE';

  private rafId: number = 0;
  private lastTime: number = 0;
  private targetRootX: number = 0;
  private targetRootZ: number = 0;

  constructor(container: HTMLElement, performance: PerformanceLevel) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.particleEngine = new ParticleEngine(this.scene);

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 3, 10);
    this.camera.lookAt(0, 1, 0);

    const useShadows = performance !== 'ECO';
    const useAntialias = performance === 'BEAUTIFUL';

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: useAntialias });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(performance === 'BEAUTIFUL' ? window.devicePixelRatio : 1);
    
    if (useShadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    container.appendChild(this.renderer.domElement);

    this.setupLighting(useShadows);
    this.setupGround(useShadows);

    this.animate = this.animate.bind(this);
    this.rafId = requestAnimationFrame(this.animate);
  }

  private setupLighting(useShadows: boolean) {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    this.directionalLight.position.set(5, 8, 5);
    if (useShadows) {
      this.directionalLight.castShadow = true;
      this.directionalLight.shadow.mapSize.width = 1024;
      this.directionalLight.shadow.mapSize.height = 1024;
      this.directionalLight.shadow.bias = -0.001;
    }
    this.scene.add(this.directionalLight);

    const backLight = new THREE.DirectionalLight(0x90b0d0, 0.8);
    backLight.position.set(-5, 4, -5);
    this.scene.add(backLight);
  }

  private setupGround(useShadows: boolean) {
    if (!useShadows) return;
    const planeGeo = new THREE.PlaneGeometry(20, 20);
    const planeMat = new THREE.ShadowMaterial({ opacity: 0.3 });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.scene.add(plane);
  }

  // --- PUBLIC API ---

  public loadPet(petId: string) {
    const def = companionRegistry[petId] || companionRegistry['fox'];
    
    if (this.rig) {
      this.scene.remove(this.rig.root);
      // Proper resource disposal is complex in ThreeJS, this is simplified
      this.rig = null;
    }

    this.activeDefinition = def;

    // Support for future GLTF loading would branch here based on def.modelUrl
    if (def.modelUrl) {
      // Future: load GLTF
    } else {
      this.rig = ProceduralBuilder.build(def.proceduralId || 'generic');
      
      // Apply offset/scale
      this.rig.root.scale.setScalar(def.scale);
      this.rig.root.position.set(0, def.yOffset, def.zOffset);
      
      // Update shadow softness if renderer supports it
      if (this.directionalLight.shadow) {
        // approximate shadow softness using mapSize in PCF
      }

      this.scene.add(this.rig.root);
    }
  }

  public updateLightingColors(dayAccent: string, ambientColor: string) {
    if (!this.directionalLight) return;
    this.directionalLight.color.set(dayAccent);
    this.ambientLight.color.set(ambientColor);
  }

  public setState(state: PetState) {
    this.currentState = state;
    if (state === 'WALK') {
      // Pick a random destination across the screen bounds (approx -5 to 5 horizontally)
      this.targetRootX = (Math.random() - 0.5) * 10;
      this.targetRootZ = (Math.random() - 0.5) * 2;
      
      // Face the direction of travel
      if (this.rig) {
        const dx = this.targetRootX - this.rig.root.position.x;
        const dz = this.targetRootZ - this.rig.root.position.z;
        this.rig.root.rotation.y = Math.atan2(dx, dz);
      }
    } else if (state === 'IDLE' || state === 'SLEEP') {
      // Smoothly return to front facing if just resting
      if (this.rig) this.rig.root.rotation.y = 0;
    }
  }

  public updateMouse(normalizedX: number, normalizedY: number) {
    this.targetLookX = normalizedX;
    this.targetLookY = normalizedY;
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    cancelAnimationFrame(this.rafId);
    if (this.rig) {
      this.scene.remove(this.rig.root);
    }
    
    // Deep dispose of geometries and materials to prevent memory leaks
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });

    this.particleEngine.dispose();
    this.renderer.dispose();
    if (this.container && this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  public setWeather(weather: WeatherType) {
    this.particleEngine.setWeather(weather);
  }

  // --- RENDER LOOP ---

  private animate() {
    this.rafId = requestAnimationFrame(this.animate);
    const t = this.clock.getElapsedTime();

    const dt = t - (this.lastTime || t);
    this.lastTime = t;

    if (this.rig) {
      this.updateAnimations(t);
    }
    
    this.particleEngine.update(dt);

    this.renderer.render(this.scene, this.camera);
  }



  private updateAnimations(t: number) {
    if (!this.rig) return;
    const { root, body, head, tail, leftEar, rightEar, leftLeg, rightLeg, leftArm, rightArm } = this.rig;

    // IK Head Tracking
    const targetHeadRotY = -this.targetLookX * 0.8;
    const targetHeadRotX = this.targetLookY * 0.5;
    head.rotation.y += (targetHeadRotY - head.rotation.y) * 0.05;
    head.rotation.x += (targetHeadRotX - head.rotation.x) * 0.05;

    // Roaming Translation
    if (this.currentState === 'WALK') {
      const dx = this.targetRootX - root.position.x;
      const dz = this.targetRootZ - root.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist > 0.1) {
        const speed = 0.03;
        root.position.x += (dx / dist) * speed;
        root.position.z += (dz / dist) * speed;
      } else {
        // Reached destination, stop walking
        this.currentState = 'IDLE';
        root.rotation.y = 0;
      }
    } else {
      // Return to center naturally if in IDLE for a long time (optional, skipping for true roaming)
    }

    // State Machine Blending
    if (this.currentState === 'SLEEP') {
      body.scale.y = 1 + Math.sin(t * 1.5) * 0.02; // Slow breathing
      head.rotation.x += (0.5 - head.rotation.x) * 0.05;
      tail.rotation.y += (Math.PI / 2 - tail.rotation.y) * 0.05;
      tail.rotation.x += (0.2 - tail.rotation.x) * 0.05;
      leftEar.rotation.z += (Math.PI / 2 - leftEar.rotation.z) * 0.05;
      rightEar.rotation.z += (-Math.PI / 2 - rightEar.rotation.z) * 0.05;
      
      // Limbs neutral
      if (leftLeg) leftLeg.rotation.x += (0 - leftLeg.rotation.x) * 0.1;
      if (rightLeg) rightLeg.rotation.x += (0 - rightLeg.rotation.x) * 0.1;
      if (leftArm) leftArm.rotation.x += (0 - leftArm.rotation.x) * 0.1;
      if (rightArm) rightArm.rotation.x += (0 - rightArm.rotation.x) * 0.1;
    } 
    else if (this.currentState === 'WALK') {
      const walkSpeed = 8;
      const baseY = body.userData.baseY || 1.0;
      body.position.y = baseY + Math.abs(Math.sin(t * walkSpeed)) * 0.1;
      body.rotation.z = Math.sin(t * walkSpeed / 2) * 0.05;
      tail.rotation.y = Math.sin(t * walkSpeed) * 0.3;
      tail.rotation.x = -0.2;
      leftEar.rotation.z += (Math.PI / 8 - leftEar.rotation.z) * 0.1;
      rightEar.rotation.z += (-Math.PI / 8 - rightEar.rotation.z) * 0.1;
      
      // Limb swinging
      if (leftLeg) leftLeg.rotation.x = Math.sin(t * walkSpeed) * 0.5;
      if (rightLeg) rightLeg.rotation.x = Math.sin(t * walkSpeed + Math.PI) * 0.5;
      if (leftArm) leftArm.rotation.x = Math.sin(t * walkSpeed + Math.PI) * 0.5;
      if (rightArm) rightArm.rotation.x = Math.sin(t * walkSpeed) * 0.5;
    }
    else if (this.currentState === 'REACT') {
      const baseY = body.userData.baseY || 1.0;
      body.position.y = baseY + Math.sin(t * 15) * 0.05;
      tail.rotation.y = Math.sin(t * 15) * 0.4;
      leftEar.rotation.z = Math.sin(t * 10) * 0.2 + Math.PI / 8;
      rightEar.rotation.z = -Math.sin(t * 10) * 0.2 - Math.PI / 8;
      
      // Limbs jump
      if (leftLeg) leftLeg.rotation.x = 0;
      if (rightLeg) rightLeg.rotation.x = 0;
      if (leftArm) leftArm.rotation.x = Math.PI/4;
      if (rightArm) rightArm.rotation.x = Math.PI/4;
    }
    else {
      // IDLE
      const breathSpeed = this.activeDefinition?.personality === 'ENERGETIC' ? 4 : 2;
      body.scale.y = 1 + Math.sin(t * breathSpeed) * 0.015;
      const baseY = body.userData.baseY || 1.0;
      body.position.y += (baseY - body.position.y) * 0.1;
      body.rotation.z += (0 - body.rotation.z) * 0.1;
      
      tail.rotation.y = Math.sin(t * 2) * 0.1;
      tail.rotation.x = -0.2 + Math.sin(t * 1.5) * 0.05;
      
      // Random ear twitches
      if (Math.random() < 0.01) leftEar.rotation.z = 0;
      else leftEar.rotation.z += (Math.PI / 8 - leftEar.rotation.z) * 0.1;

      if (Math.random() < 0.01) rightEar.rotation.z = 0;
      else rightEar.rotation.z += (-Math.PI / 8 - rightEar.rotation.z) * 0.1;
      
      // Limbs neutral
      if (leftLeg) leftLeg.rotation.x += (0 - leftLeg.rotation.x) * 0.1;
      if (rightLeg) rightLeg.rotation.x += (0 - rightLeg.rotation.x) * 0.1;
      if (leftArm) leftArm.rotation.x += (0 - leftArm.rotation.x) * 0.1;
      if (rightArm) rightArm.rotation.x += (0 - rightArm.rotation.x) * 0.1;
    }
  }
}
