import * as THREE from 'three';
import type { PetState } from './types';
import type { PerformanceLevel } from '../stores/performance';

export class Companion3D {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  private petGroup: THREE.Group;
  private headGroup: THREE.Group;
  private tailGroup: THREE.Group;
  private leftEar: THREE.Mesh;
  private rightEar: THREE.Mesh;
  private bodyMesh: THREE.Mesh;

  private targetLookX = 0;
  private targetLookY = 0;
  private currentState: PetState = 'IDLE';

  private rafId: number = 0;

  constructor(container: HTMLElement, performance: PerformanceLevel) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

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
    this.buildProceduralPet();
    this.setupGround(useShadows);

    this.animate = this.animate.bind(this);
    this.rafId = requestAnimationFrame(this.animate);
  }

  private setupLighting(useShadows: boolean) {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const directionalLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    directionalLight.position.set(5, 8, 5);
    if (useShadows) {
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      directionalLight.shadow.bias = -0.001;
    }
    this.scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0x90b0d0, 0.8);
    backLight.position.set(-5, 4, -5);
    this.scene.add(backLight);
  }

  private setupGround(useShadows: boolean) {
    // Invisible plane to catch shadows
    if (!useShadows) return;
    const planeGeo = new THREE.PlaneGeometry(20, 20);
    const planeMat = new THREE.ShadowMaterial({ opacity: 0.3 });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.scene.add(plane);
  }

  private buildProceduralPet() {
    this.petGroup = new THREE.Group();

    // Materials - Low poly flat shading style
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xd35400, roughness: 0.8, flatShading: true });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.9, flatShading: true });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.5, flatShading: true });

    // Body
    this.bodyMesh = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 6), orangeMat);
    this.bodyMesh.position.y = 1;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.petGroup.add(this.bodyMesh);

    const chestMesh = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.8, 6), whiteMat);
    chestMesh.position.set(0, 0.9, 0.2);
    chestMesh.castShadow = true;
    this.petGroup.add(chestMesh);

    // Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.8, 0);
    this.petGroup.add(this.headGroup);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.4), orangeMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Snout
    const snoutMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.8), whiteMat);
    snoutMesh.position.set(0, -0.2, 0.8);
    snoutMesh.castShadow = true;
    this.headGroup.add(snoutMesh);

    const noseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), darkMat);
    noseMesh.position.set(0, 0.1, 0.4);
    snoutMesh.add(noseMesh);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.3, 0.8, 4);
    this.leftEar = new THREE.Mesh(earGeo, darkMat);
    this.leftEar.position.set(-0.5, 0.8, -0.2);
    this.leftEar.rotation.z = Math.PI / 8;
    this.headGroup.add(this.leftEar);

    this.rightEar = new THREE.Mesh(earGeo, darkMat);
    this.rightEar.position.set(0.5, 0.8, -0.2);
    this.rightEar.rotation.z = -Math.PI / 8;
    this.headGroup.add(this.rightEar);

    // Tail
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0, 0.5, -0.8);
    this.petGroup.add(this.tailGroup);

    const tailMesh = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2, 5), orangeMat);
    tailMesh.position.set(0, 0, -0.8);
    tailMesh.rotation.x = Math.PI / 2;
    tailMesh.castShadow = true;
    this.tailGroup.add(tailMesh);
    
    const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 5), whiteMat);
    tailTip.position.set(0, 0, -1.8);
    tailTip.rotation.x = -Math.PI / 2;
    this.tailGroup.add(tailTip);

    this.scene.add(this.petGroup);
  }

  public setState(state: PetState) {
    this.currentState = state;
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

  private animate() {
    this.rafId = requestAnimationFrame(this.animate);
    const t = this.clock.getElapsedTime();

    // Smooth Look IK (Head follows mouse smoothly)
    // Map normalized mouse to gentle angles
    const targetHeadRotY = -this.targetLookX * 0.8;
    const targetHeadRotX = this.targetLookY * 0.5;
    
    this.headGroup.rotation.y += (targetHeadRotY - this.headGroup.rotation.y) * 0.05;
    this.headGroup.rotation.x += (targetHeadRotX - this.headGroup.rotation.x) * 0.05;

    // Skeletal Animation Logic based on state
    if (this.currentState === 'SLEEP') {
      // Curled up
      this.bodyMesh.scale.y = 1 + Math.sin(t * 1.5) * 0.02; // Slow deep breathing
      this.headGroup.rotation.x += (0.5 - this.headGroup.rotation.x) * 0.05;
      this.tailGroup.rotation.y += (Math.PI / 2 - this.tailGroup.rotation.y) * 0.05;
      this.tailGroup.rotation.x += (0.2 - this.tailGroup.rotation.x) * 0.05;
      this.leftEar.rotation.z = Math.PI / 2;
      this.rightEar.rotation.z = -Math.PI / 2;
    } 
    else if (this.currentState === 'WALK') {
      this.bodyMesh.position.y = 1 + Math.abs(Math.sin(t * 8)) * 0.1;
      this.bodyMesh.rotation.z = Math.sin(t * 4) * 0.05;
      this.tailGroup.rotation.y = Math.sin(t * 6) * 0.3;
      this.tailGroup.rotation.x = -0.2;
      this.leftEar.rotation.z = Math.PI / 8;
      this.rightEar.rotation.z = -Math.PI / 8;
    }
    else if (this.currentState === 'REACT') {
      this.bodyMesh.position.y = 1 + Math.sin(t * 15) * 0.05;
      this.headGroup.position.y = 1.8 + Math.sin(t * 20) * 0.05;
      this.tailGroup.rotation.y = Math.sin(t * 15) * 0.4;
      this.leftEar.rotation.z = Math.sin(t * 10) * 0.2 + Math.PI / 8;
      this.rightEar.rotation.z = -Math.sin(t * 10) * 0.2 - Math.PI / 8;
    }
    else {
      // IDLE
      this.bodyMesh.scale.y = 1 + Math.sin(t * 3) * 0.015; // Normal breathing
      this.bodyMesh.position.y = 1;
      this.bodyMesh.rotation.z = 0;
      this.headGroup.position.y = 1.8;
      this.tailGroup.rotation.y = Math.sin(t * 2) * 0.1; // Gentle sway
      this.tailGroup.rotation.x = -0.2 + Math.sin(t * 1.5) * 0.05;
      
      // Random ear twitches
      if (Math.random() < 0.01) this.leftEar.rotation.z = 0;
      else this.leftEar.rotation.z += (Math.PI / 8 - this.leftEar.rotation.z) * 0.1;

      if (Math.random() < 0.01) this.rightEar.rotation.z = 0;
      else this.rightEar.rotation.z += (-Math.PI / 8 - this.rightEar.rotation.z) * 0.1;
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    cancelAnimationFrame(this.rafId);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
