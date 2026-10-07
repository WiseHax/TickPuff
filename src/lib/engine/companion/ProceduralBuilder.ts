import * as THREE from 'three';

export interface ProceduralRig {
  root: THREE.Group;
  body: THREE.Mesh | THREE.Group;
  head: THREE.Group;
  tail: THREE.Group;
  leftEar: THREE.Object3D;
  rightEar: THREE.Object3D;
  leftLeg?: THREE.Object3D;
  rightLeg?: THREE.Object3D;
  leftArm?: THREE.Object3D;
  rightArm?: THREE.Object3D;
}

export class ProceduralBuilder {
  
  static build(proceduralId: string): ProceduralRig {
    switch (proceduralId) {
      case 'fox': return this.buildFox();
      case 'cat': return this.buildCat();
      case 'robot': return this.buildRobot();
      case 'bear': return this.buildBear();
      case 'bunny': return this.buildBunny();
      case 'penguin': return this.buildPenguin();
      case 'owl': return this.buildOwl();
      case 'fish': return this.buildFish();
      default: return this.buildGeneric();
    }
  }

  // Helper to create a rounded box (approximated with a cylinder or standard box for WebGL1 compatibility)
  private static createLimb(radius: number, length: number, color: number): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(radius, radius, length, 8);
    geo.translate(0, -length / 2, 0); // Pivot at top
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    return mesh;
  }

  private static buildFox(): ProceduralRig {
    const root = new THREE.Group();
    const bodyGroup = new THREE.Group();
    const head = new THREE.Group();
    const tail = new THREE.Group();
    const leftEar = new THREE.Group();
    const rightEar = new THREE.Group();

    const orange = 0xd35400;
    const white = 0xecf0f1;
    const dark = 0x2c3e50;

    // Body Setup
    const bodyMat = new THREE.MeshStandardMaterial({ color: orange, roughness: 0.8 });
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 2), bodyMat);
    bodyMesh.castShadow = true;
    bodyGroup.add(bodyMesh);

    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 2.1), new THREE.MeshStandardMaterial({ color: white }));
    chestMesh.position.set(0, -0.1, 0);
    bodyGroup.add(chestMesh);

    root.add(bodyGroup);
    bodyGroup.position.y = 1.0;
    bodyGroup.userData.baseY = 1.0;

    // Head
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.5), bodyMat);
    headMesh.castShadow = true;
    head.add(headMesh);
    
    // Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.0), new THREE.MeshStandardMaterial({ color: white }));
    snout.position.set(0, -0.2, 1.0);
    head.add(snout);
    
    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.2), new THREE.MeshStandardMaterial({ color: dark }));
    nose.position.set(0, 0.1, 0.6);
    snout.add(nose);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.2, 0.2, 0.1);
    const eyeMat = new THREE.MeshStandardMaterial({ color: dark });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.4, 0.2, 0.76);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.4, 0.2, 0.76);
    head.add(leftEye, rightEye);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.3, 0.6, 4);
    earGeo.translate(0, 0.3, 0);
    const leftEarMesh = new THREE.Mesh(earGeo, bodyMat);
    leftEar.add(leftEarMesh);
    leftEar.position.set(-0.5, 0.6, -0.2);
    
    const rightEarMesh = new THREE.Mesh(earGeo, bodyMat);
    rightEar.add(rightEarMesh);
    rightEar.position.set(0.5, 0.6, -0.2);
    
    head.add(leftEar, rightEar);
    head.position.set(0, 1.2, 0.8);
    bodyGroup.add(head);

    // Tail
    const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.6), bodyMat);
    tailMesh.position.set(0, 0, -0.8); // Pivot offset
    tail.add(tailMesh);
    tail.position.set(0, 0.2, -1.0);
    bodyGroup.add(tail);

    // Limbs
    const leftLeg = this.createLimb(0.2, 1.0, dark);
    leftLeg.position.set(-0.4, -0.7, -0.6);
    const rightLeg = this.createLimb(0.2, 1.0, dark);
    rightLeg.position.set(0.4, -0.7, -0.6);
    const leftArm = this.createLimb(0.2, 1.0, dark);
    leftArm.position.set(-0.4, -0.7, 0.6);
    const rightArm = this.createLimb(0.2, 1.0, dark);
    rightArm.position.set(0.4, -0.7, 0.6);

    bodyGroup.add(leftLeg, rightLeg, leftArm, rightArm);

    return { root, body: bodyGroup, head, tail, leftEar, rightEar, leftLeg, rightLeg, leftArm, rightArm };
  }

  private static buildCat(): ProceduralRig {
    const root = new THREE.Group();
    const bodyGroup = new THREE.Group();
    const head = new THREE.Group();
    const tail = new THREE.Group();
    const leftEar = new THREE.Group();
    const rightEar = new THREE.Group();

    const color = 0x34495e;
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
    
    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2, 16), bodyMat);
    bodyMesh.rotation.x = Math.PI / 2;
    bodyMesh.castShadow = true;
    bodyGroup.add(bodyMesh);
    
    root.add(bodyGroup);
    bodyGroup.position.y = 0.8;
    bodyGroup.userData.baseY = 0.8;

    // Head
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), bodyMat);
    headMesh.castShadow = true;
    head.add(headMesh);
    
    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f }); // Yellow eyes
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.3, 0.1, 0.75);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.3, 0.1, 0.75);
    head.add(leftEye, rightEye);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.25, 0.5, 4);
    earGeo.translate(0, 0.25, 0);
    const earMesh = new THREE.Mesh(earGeo, bodyMat);
    leftEar.add(earMesh.clone());
    leftEar.position.set(-0.4, 0.6, 0);
    rightEar.add(earMesh.clone());
    rightEar.position.set(0.4, 0.6, 0);
    head.add(leftEar, rightEar);

    head.position.set(0, 0.8, 1.0);
    bodyGroup.add(head);

    // Tail
    const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8), bodyMat);
    tailMesh.position.set(0, 0.75, 0);
    tail.add(tailMesh);
    tail.position.set(0, 0, -1.0);
    bodyGroup.add(tail);

    // Limbs
    const leftLeg = this.createLimb(0.15, 0.8, color);
    leftLeg.position.set(-0.4, -0.4, -0.7);
    const rightLeg = this.createLimb(0.15, 0.8, color);
    rightLeg.position.set(0.4, -0.4, -0.7);
    const leftArm = this.createLimb(0.15, 0.8, color);
    leftArm.position.set(-0.4, -0.4, 0.7);
    const rightArm = this.createLimb(0.15, 0.8, color);
    rightArm.position.set(0.4, -0.4, 0.7);

    bodyGroup.add(leftLeg, rightLeg, leftArm, rightArm);

    return { root, body: bodyGroup, head, tail, leftEar, rightEar, leftLeg, rightLeg, leftArm, rightArm };
  }

  private static buildRobot(): ProceduralRig {
    const root = new THREE.Group();
    const bodyGroup = new THREE.Group();
    const head = new THREE.Group();
    const tail = new THREE.Group(); // Antenna
    const leftEar = new THREE.Group();
    const rightEar = new THREE.Group();

    const metal = 0x95a5a6;
    const dark = 0x2c3e50;
    const bodyMat = new THREE.MeshStandardMaterial({ color: metal, metalness: 0.8, roughness: 0.2 });
    
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), bodyMat);
    bodyMesh.castShadow = true;
    bodyGroup.add(bodyMesh);
    
    root.add(bodyGroup);
    bodyGroup.position.y = 1.0;
    bodyGroup.userData.baseY = 1.0;

    // Head
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.2), bodyMat);
    headMesh.castShadow = true;
    head.add(headMesh);
    
    // Visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 1.25), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    head.add(visor);
    // Eye
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 1.26), new THREE.MeshBasicMaterial({ color: 0x00ffcc }));
    head.add(eye);

    head.position.set(0, 1.5, 0);
    bodyGroup.add(head);

    // Antenna (mapped to tail for animation)
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6), bodyMat);
    ant.position.set(0, 0.3, 0);
    tail.add(ant);
    tail.position.set(0, 0.5, 0);
    head.add(tail);

    // Limbs
    const leftLeg = this.createLimb(0.2, 1.0, dark);
    leftLeg.position.set(-0.5, -0.75, 0);
    const rightLeg = this.createLimb(0.2, 1.0, dark);
    rightLeg.position.set(0.5, -0.75, 0);
    const leftArm = this.createLimb(0.2, 1.0, dark);
    leftArm.position.set(-0.9, 0, 0);
    const rightArm = this.createLimb(0.2, 1.0, dark);
    rightArm.position.set(0.9, 0, 0);

    bodyGroup.add(leftLeg, rightLeg, leftArm, rightArm);

    return { root, body: bodyGroup, head, tail, leftEar, rightEar, leftLeg, rightLeg, leftArm, rightArm };
  }

  private static buildBear(): ProceduralRig {
    const root = new THREE.Group();
    const bodyGroup = new THREE.Group();
    const head = new THREE.Group();
    const tail = new THREE.Group();
    const leftEar = new THREE.Group();
    const rightEar = new THREE.Group();

    const brown = 0x8d6e63;
    const bodyMat = new THREE.MeshStandardMaterial({ color: brown, roughness: 0.9 });
    
    const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), bodyMat);
    bodyMesh.castShadow = true;
    bodyGroup.add(bodyMesh);
    
    root.add(bodyGroup);
    bodyGroup.position.y = 1.0;
    bodyGroup.userData.baseY = 1.0;

    // Head
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), bodyMat);
    headMesh.castShadow = true;
    head.add(headMesh);
    
    // Snout
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshStandardMaterial({ color: 0xd7ccc8 }));
    snout.position.set(0, -0.2, 0.7);
    head.add(snout);
    
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
    nose.position.set(0, 0.1, 0.35);
    snout.add(nose);

    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
    leftEye.position.set(-0.3, 0.2, 0.7);
    const rightEye = leftEye.clone();
    rightEye.position.set(0.3, 0.2, 0.7);
    head.add(leftEye, rightEye);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const earMesh = new THREE.Mesh(earGeo, bodyMat);
    leftEar.add(earMesh.clone());
    leftEar.position.set(-0.6, 0.5, 0);
    rightEar.add(earMesh.clone());
    rightEar.position.set(0.6, 0.5, 0);
    head.add(leftEar, rightEar);

    head.position.set(0, 1.0, 0.6);
    bodyGroup.add(head);

    // Tail
    const tailMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), bodyMat);
    tail.add(tailMesh);
    tail.position.set(0, -0.5, -1.1);
    bodyGroup.add(tail);

    // Limbs
    const leftLeg = this.createLimb(0.3, 0.8, brown);
    leftLeg.position.set(-0.5, -0.6, -0.5);
    const rightLeg = this.createLimb(0.3, 0.8, brown);
    rightLeg.position.set(0.5, -0.6, -0.5);
    const leftArm = this.createLimb(0.3, 0.8, brown);
    leftArm.position.set(-0.5, -0.6, 0.6);
    const rightArm = this.createLimb(0.3, 0.8, brown);
    rightArm.position.set(0.5, -0.6, 0.6);

    bodyGroup.add(leftLeg, rightLeg, leftArm, rightArm);

    return { root, body: bodyGroup, head, tail, leftEar, rightEar, leftLeg, rightLeg, leftArm, rightArm };
  }

  private static buildBunny(): ProceduralRig {
    const root = new THREE.Group();
    const bodyGroup = new THREE.Group();
    const head = new THREE.Group();
    const tail = new THREE.Group();
    const leftEar = new THREE.Group();
    const rightEar = new THREE.Group();

    const white = 0xffffff;
    const bodyMat = new THREE.MeshStandardMaterial({ color: white, roughness: 0.9 });
    
    const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 32), bodyMat);
    bodyMesh.castShadow = true;
    bodyGroup.add(bodyMesh);
    
    root.add(bodyGroup);
    bodyGroup.position.y = 0.7;
    bodyGroup.userData.baseY = 0.7;

    // Head
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 32), bodyMat);
    headMesh.castShadow = true;
    head.add(headMesh);
    
    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
    leftEye.position.set(-0.3, 0.1, 0.65);
    const rightEye = leftEye.clone();
    rightEye.position.set(0.3, 0.1, 0.65);
    head.add(leftEye, rightEye);

    // Ears
    const earGeo = new THREE.CapsuleGeometry(0.15, 0.8, 4, 16);
    earGeo.translate(0, 0.4, 0);
    const earMesh = new THREE.Mesh(earGeo, bodyMat);
    leftEar.add(earMesh.clone());
    leftEar.position.set(-0.3, 0.5, 0);
    rightEar.add(earMesh.clone());
    rightEar.position.set(0.3, 0.5, 0);
    head.add(leftEar, rightEar);

    head.position.set(0, 0.8, 0.4);
    bodyGroup.add(head);

    // Tail
    const tailMesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), bodyMat);
    tail.add(tailMesh);
    tail.position.set(0, -0.3, -0.8);
    bodyGroup.add(tail);

    // Limbs
    const leftLeg = this.createLimb(0.2, 0.6, white);
    leftLeg.position.set(-0.4, -0.6, -0.3);
    const rightLeg = this.createLimb(0.2, 0.6, white);
    rightLeg.position.set(0.4, -0.6, -0.3);
    const leftArm = this.createLimb(0.15, 0.5, white);
    leftArm.position.set(-0.4, -0.3, 0.5);
    const rightArm = this.createLimb(0.15, 0.5, white);
    rightArm.position.set(0.4, -0.3, 0.5);

    bodyGroup.add(leftLeg, rightLeg, leftArm, rightArm);

    return { root, body: bodyGroup, head, tail, leftEar, rightEar, leftLeg, rightLeg, leftArm, rightArm };
  }

  private static buildPenguin(): ProceduralRig {
    const root = new THREE.Group();
    const bodyGroup = new THREE.Group();
    const head = new THREE.Group();
    const tail = new THREE.Group();
    const leftEar = new THREE.Group();
    const rightEar = new THREE.Group();

    const black = 0x111111;
    const white = 0xffffff;
    const bodyMat = new THREE.MeshStandardMaterial({ color: black, roughness: 0.7 });
    
    const bodyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.8, 1.0, 16, 16), bodyMat);
    bodyMesh.castShadow = true;
    bodyGroup.add(bodyMesh);

    const bellyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 0.9, 16, 16), new THREE.MeshStandardMaterial({ color: white }));
    bellyMesh.position.set(0, -0.05, 0.1);
    bodyGroup.add(bellyMesh);
    
    root.add(bodyGroup);
    bodyGroup.position.y = 1.0;
    bodyGroup.userData.baseY = 1.0;

    // Head
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 32), bodyMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    const faceMesh = new THREE.Mesh(new THREE.SphereGeometry(0.65, 32, 32), new THREE.MeshStandardMaterial({ color: white }));
    faceMesh.position.set(0, -0.1, 0.1);
    head.add(faceMesh);
    
    // Beak
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0xf39c12 }));
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0, 0.8);
    head.add(beak);

    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: black });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
    leftEye.position.set(-0.3, 0.2, 0.65);
    const rightEye = leftEye.clone();
    rightEye.position.set(0.3, 0.2, 0.65);
    head.add(leftEye, rightEye);

    head.position.set(0, 1.2, 0);
    bodyGroup.add(head);

    // Limbs
    const orange = 0xf39c12;
    const leftLeg = this.createLimb(0.2, 0.4, orange);
    leftLeg.position.set(-0.3, -1.0, 0);
    const rightLeg = this.createLimb(0.2, 0.4, orange);
    rightLeg.position.set(0.3, -1.0, 0);
    
    const flipperGeo = new THREE.BoxGeometry(0.2, 1.0, 0.4);
    flipperGeo.translate(0, -0.5, 0);
    const leftArm = new THREE.Mesh(flipperGeo, bodyMat);
    leftArm.position.set(-0.8, 0.5, 0);
    const rightArm = new THREE.Mesh(flipperGeo, bodyMat);
    rightArm.position.set(0.8, 0.5, 0);

    bodyGroup.add(leftLeg, rightLeg, leftArm, rightArm);

    return { root, body: bodyGroup, head, tail, leftEar, rightEar, leftLeg, rightLeg, leftArm, rightArm };
  }

  private static buildOwl(): ProceduralRig {
    const root = new THREE.Group();
    const bodyGroup = new THREE.Group();
    const head = new THREE.Group();
    const tail = new THREE.Group();
    const leftEar = new THREE.Group();
    const rightEar = new THREE.Group();

    const brown = 0x8d6e63;
    const lightBrown = 0xd7ccc8;
    const bodyMat = new THREE.MeshStandardMaterial({ color: brown, roughness: 0.9 });
    
    const bodyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.8, 0.5, 16, 16), bodyMat);
    bodyMesh.castShadow = true;
    bodyGroup.add(bodyMesh);

    const bellyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 0.4, 16, 16), new THREE.MeshStandardMaterial({ color: lightBrown }));
    bellyMesh.position.set(0, -0.05, 0.15);
    bodyGroup.add(bellyMesh);
    
    root.add(bodyGroup);
    bodyGroup.position.y = 0.8;
    bodyGroup.userData.baseY = 0.8;

    // Head
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.85, 32, 32), bodyMat);
    headMesh.castShadow = true;
    head.add(headMesh);
    
    // Beak
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 16), new THREE.MeshStandardMaterial({ color: 0xf39c12 }));
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.2, 0.85);
    head.add(beak);

    // Eyes
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const eyeBlackMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    const leftEyeWhite = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16), eyeWhiteMat);
    leftEyeWhite.rotation.x = Math.PI / 2;
    leftEyeWhite.position.set(-0.35, 0.1, 0.8);
    const leftEyePupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeBlackMat);
    leftEyePupil.position.set(0, 0, 0.05);
    leftEyeWhite.add(leftEyePupil);
    
    const rightEyeWhite = leftEyeWhite.clone();
    rightEyeWhite.position.set(0.35, 0.1, 0.8);
    
    head.add(leftEyeWhite, rightEyeWhite);

    head.position.set(0, 0.8, 0);
    bodyGroup.add(head);

    // Limbs
    const orange = 0xf39c12;
    const leftLeg = this.createLimb(0.1, 0.4, orange);
    leftLeg.position.set(-0.3, -0.7, 0.2);
    const rightLeg = this.createLimb(0.1, 0.4, orange);
    rightLeg.position.set(0.3, -0.7, 0.2);

    bodyGroup.add(leftLeg, rightLeg);

    return { root, body: bodyGroup, head, tail, leftEar, rightEar, leftLeg, rightLeg };
  }

  private static buildFish(): ProceduralRig {
    const root = new THREE.Group();
    const bodyGroup = new THREE.Group();
    const head = new THREE.Group();
    const tail = new THREE.Group();
    const leftEar = new THREE.Group();
    const rightEar = new THREE.Group();

    const blue = 0x3498db;
    const bodyMat = new THREE.MeshStandardMaterial({ color: blue, roughness: 0.5, metalness: 0.3 });
    
    const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 16), bodyMat);
    bodyMesh.scale.set(0.5, 0.8, 1.2);
    bodyMesh.castShadow = true;
    bodyGroup.add(bodyMesh);
    
    root.add(bodyGroup);
    bodyGroup.position.y = 1.0;
    bodyGroup.userData.baseY = 1.0;

    // Head is just the front of the body
    head.position.set(0, 0, 0.8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
    leftEye.position.set(-0.3, 0.2, 0);
    const rightEye = leftEye.clone();
    rightEye.position.set(0.3, 0.2, 0);
    head.add(leftEye, rightEye);
    bodyGroup.add(head);

    // Tail fin
    const tailGeo = new THREE.ConeGeometry(0.4, 0.8, 4);
    tailGeo.rotateX(Math.PI / 2);
    tailGeo.translate(0, 0, -0.4);
    const tailMesh = new THREE.Mesh(tailGeo, bodyMat);
    tail.add(tailMesh);
    tail.position.set(0, 0, -0.8);
    bodyGroup.add(tail);

    // Side fins mapped to arms
    const finGeo = new THREE.ConeGeometry(0.2, 0.5, 4);
    finGeo.rotateZ(Math.PI / 2);
    const leftArm = new THREE.Mesh(finGeo, bodyMat);
    leftArm.position.set(-0.4, 0, 0);
    const rightArm = new THREE.Mesh(finGeo, bodyMat);
    rightArm.position.set(0.4, 0, 0);
    bodyGroup.add(leftArm, rightArm);

    return { root, body: bodyGroup, head, tail, leftEar, rightEar, leftArm, rightArm };
  }

  private static buildGeneric(): ProceduralRig {
    return this.buildCat();
  }
}
