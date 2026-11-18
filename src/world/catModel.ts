import * as THREE from 'three';
import type { CatState } from './types';
import type { ProceduralTextureSet } from './textures';

export interface CatAnimationInput {
  state: CatState;
  speed: number;
  verticalVelocity: number;
  isGrounded: boolean;
  headYawOffset: number;
  headPitchOffset: number;
  swatTimer: number;
  stretchTimer: number;
  isPurring: boolean;
}

export interface CatRig {
  group: THREE.Group;
  contactShadow: THREE.Mesh;
  update: (dt: number, elapsed: number, input: CatAnimationInput) => void;
  triggerBlink: () => void;
  dispose: () => void;
}

interface LegJoints {
  hip: THREE.Group;
  knee: THREE.Group;
  paw: THREE.Group;
}

export function createRealisticTabbyCat(textures: ProceduralTextureSet): CatRig {
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  // Materials calibrated for plush realistic tabby fur & glossy eyes
  const furBodyMat = track(
    new THREE.MeshPhysicalMaterial({
      map: textures.tabbyBodyMap,
      roughness: 0.88,
      metalness: 0.0,
      sheen: 0.55,
      sheenRoughness: 0.72,
      sheenColor: new THREE.Color('#d8d2c7'),
    }),
  );

  const furHeadMat = track(
    new THREE.MeshPhysicalMaterial({
      map: textures.tabbyHeadMap,
      roughness: 0.86,
      metalness: 0.0,
      sheen: 0.5,
      sheenRoughness: 0.7,
      sheenColor: new THREE.Color('#dbd4c9'),
    }),
  );

  const furCreamMat = track(
    new THREE.MeshPhysicalMaterial({
      color: '#e8e1d6',
      roughness: 0.9,
      metalness: 0.0,
      sheen: 0.45,
      sheenColor: new THREE.Color('#ffffff'),
    }),
  );

  const furDarkStripeMat = track(
    new THREE.MeshStandardMaterial({
      color: '#464340',
      roughness: 0.88,
      metalness: 0.0,
    }),
  );

  const furGreyMat = track(
    new THREE.MeshPhysicalMaterial({
      color: '#8a857e',
      roughness: 0.86,
      metalness: 0.0,
      sheen: 0.45,
      sheenColor: new THREE.Color('#d4cec3'),
    }),
  );

  const innerEarMat = track(
    new THREE.MeshStandardMaterial({
      color: '#cfa097',
      roughness: 0.78,
      metalness: 0.0,
    }),
  );

  const noseMat = track(
    new THREE.MeshPhysicalMaterial({
      color: '#915b4b',
      roughness: 0.35,
      metalness: 0.0,
      clearcoat: 0.4,
      clearcoatRoughness: 0.25,
    }),
  );

  const eyeMat = track(
    new THREE.MeshPhysicalMaterial({
      map: textures.catEyeMap,
      roughness: 0.08,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    }),
  );

  const collarStrapMat = track(
    new THREE.MeshStandardMaterial({
      color: '#f0cfa0',
      roughness: 0.52,
      metalness: 0.04,
    }),
  );

  const collarClaspMat = track(
    new THREE.MeshStandardMaterial({
      color: '#d95338',
      roughness: 0.36,
      metalness: 0.08,
    }),
  );

  const whiskerMat = track(
    new THREE.LineBasicMaterial({
      color: '#f5f2eb',
      transparent: true,
      opacity: 0.82,
    }),
  );

  const pawPadMat = track(
    new THREE.MeshStandardMaterial({
      color: '#5b4e4c',
      roughness: 0.7,
    }),
  );

  // Root cat group (bottom-center pivot at y = 0)
  const group = new THREE.Group();
  group.name = 'TabbyCat';

  // Soft contact shadow directly under paws
  const shadowGeo = track(new THREE.PlaneGeometry(0.62, 0.78));
  const shadowMat = track(
    new THREE.MeshBasicMaterial({
      map: textures.contactShadowMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.46,
    }),
  );
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.012;
  group.add(contactShadow);

  // Pelvis / body root pivot at standing hip height (~0.21m)
  const bodyPivot = new THREE.Group();
  bodyPivot.position.set(0, 0.21, 0);
  group.add(bodyPivot);

  // Main torso (plush rounded cat body)
  const torsoGeo = track(new THREE.CapsuleGeometry(0.112, 0.27, 14, 24));
  const torsoMesh = new THREE.Mesh(torsoGeo, furBodyMat);
  torsoMesh.rotation.x = Math.PI / 2;
  torsoMesh.scale.set(1.06, 1.0, 0.96);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  bodyPivot.add(torsoMesh);

  // Soft cream underbelly / chest tuft
  const bellyGeo = track(new THREE.CapsuleGeometry(0.082, 0.22, 10, 16));
  const bellyMesh = new THREE.Mesh(bellyGeo, furCreamMat);
  bellyMesh.rotation.x = Math.PI / 2;
  bellyMesh.position.set(0, -0.042, 0.02);
  bellyMesh.castShadow = true;
  bodyPivot.add(bellyMesh);

  // Chest group (pivots around center for spine arch, sit-up posture, breathing)
  const chestGroup = new THREE.Group();
  chestGroup.position.set(0, 0.015, 0.14);
  bodyPivot.add(chestGroup);

  const chestGeo = track(new THREE.SphereGeometry(0.108, 22, 18));
  const chestMesh = new THREE.Mesh(chestGeo, furBodyMat);
  chestMesh.scale.set(1.04, 1.02, 1.08);
  chestMesh.castShadow = true;
  chestMesh.receiveShadow = true;
  chestGroup.add(chestMesh);

  // Plush cream chest bib (clearly visible when sitting upright!)
  const bibGeo = track(new THREE.SphereGeometry(0.086, 18, 16));
  const bibMesh = new THREE.Mesh(bibGeo, furCreamMat);
  bibMesh.position.set(0, -0.015, 0.046);
  bibMesh.scale.set(0.95, 1.08, 0.85);
  chestGroup.add(bibMesh);

  // Neck + Signature Cream & Coral-Buckle Collar
  const neckGroup = new THREE.Group();
  neckGroup.position.set(0, 0.07, 0.065);
  chestGroup.add(neckGroup);

  const neckGeo = track(new THREE.CylinderGeometry(0.072, 0.086, 0.09, 18));
  const neckMesh = new THREE.Mesh(neckGeo, furGreyMat);
  neckMesh.rotation.x = 0.22;
  neckMesh.castShadow = true;
  neckGroup.add(neckMesh);

  // Collar strap (cream/peach) tilted nicely around neck
  const collarGroup = new THREE.Group();
  collarGroup.position.set(0, 0.008, 0.006);
  collarGroup.rotation.x = 0.28;
  neckGroup.add(collarGroup);

  const collarTorusGeo = track(new THREE.TorusGeometry(0.084, 0.014, 10, 28));
  const collarStrap = new THREE.Mesh(collarTorusGeo, collarStrapMat);
  collarStrap.rotation.x = Math.PI / 2;
  collarStrap.scale.set(1.02, 1.08, 0.9);
  collarStrap.castShadow = true;
  collarGroup.add(collarStrap);

  // Coral-orange rectangular clasp & round stud (front of collar matching photo)
  const claspGeo = track(new THREE.BoxGeometry(0.032, 0.026, 0.02));
  const claspMesh = new THREE.Mesh(claspGeo, collarClaspMat);
  claspMesh.position.set(0.014, -0.002, 0.088);
  claspMesh.rotation.y = 0.15;
  collarGroup.add(claspMesh);

  const studGeo = track(new THREE.SphereGeometry(0.0065, 10, 10));
  const studMesh = new THREE.Mesh(studGeo, collarClaspMat);
  studMesh.position.set(-0.006, -0.002, 0.096);
  collarGroup.add(studMesh);

  // Head Group (articulated for looking, tilting, curiosity)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.08, 0.032);
  neckGroup.add(headGroup);

  // Round British Shorthair skull
  const skullGeo = track(new THREE.SphereGeometry(0.106, 26, 22));
  const skullMesh = new THREE.Mesh(skullGeo, furHeadMat);
  skullMesh.scale.set(1.08, 0.96, 1.0);
  // Rotate so tabby "M" texture sits on forehead facing +Z
  skullMesh.rotation.y = -Math.PI / 2;
  skullMesh.castShadow = true;
  skullMesh.receiveShadow = true;
  headGroup.add(skullMesh);

  // Plump cheeks (left & right)
  const cheekGeo = track(new THREE.SphereGeometry(0.056, 16, 14));
  const cheekL = new THREE.Mesh(cheekGeo, furGreyMat);
  cheekL.position.set(0.056, -0.026, 0.048);
  cheekL.scale.set(1.05, 0.92, 0.9);
  headGroup.add(cheekL);

  const cheekR = new THREE.Mesh(cheekGeo, furGreyMat);
  cheekR.position.set(-0.056, -0.026, 0.048);
  cheekR.scale.set(1.05, 0.92, 0.9);
  headGroup.add(cheekR);

  // Creamy whisker pads & chin
  const muzzlePadGeo = track(new THREE.SphereGeometry(0.032, 16, 14));
  const muzzleL = new THREE.Mesh(muzzlePadGeo, furCreamMat);
  muzzleL.position.set(0.023, -0.034, 0.088);
  muzzleL.scale.set(1.0, 0.85, 0.92);
  headGroup.add(muzzleL);

  const muzzleR = new THREE.Mesh(muzzlePadGeo, furCreamMat);
  muzzleR.position.set(-0.023, -0.034, 0.088);
  muzzleR.scale.set(1.0, 0.85, 0.92);
  headGroup.add(muzzleR);

  const chinGeo = track(new THREE.SphereGeometry(0.028, 14, 12));
  const chinMesh = new THREE.Mesh(chinGeo, furCreamMat);
  chinMesh.position.set(0, -0.054, 0.075);
  chinMesh.scale.set(1.15, 0.72, 0.9);
  headGroup.add(chinMesh);

  // Cute nose leather
  const noseGeo = track(new THREE.ConeGeometry(0.015, 0.016, 3));
  const noseMesh = new THREE.Mesh(noseGeo, noseMat);
  noseMesh.position.set(0, -0.018, 0.106);
  noseMesh.rotation.x = Math.PI / 2;
  noseMesh.rotation.z = Math.PI;
  noseMesh.scale.set(1.15, 0.8, 0.9);
  headGroup.add(noseMesh);

  // Big round expressive amber-copper eyes
  const eyeGeo = track(new THREE.SphereGeometry(0.024, 18, 16));
  const buildEye = (xOffset: number): { eye: THREE.Mesh; lid: THREE.Mesh } => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(xOffset, 0.012, 0.088);
    // Align UV center of sphere texture toward +Z
    eye.rotation.y = -Math.PI / 2;
    eye.scale.set(0.75, 1.0, 1.0);
    headGroup.add(eye);

    const lidGeo = track(
      new THREE.SphereGeometry(0.0255, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    );
    const lid = new THREE.Mesh(lidGeo, furGreyMat);
    lid.position.copy(eye.position);
    lid.scale.set(1.02, 0.15, 0.8);
    lid.rotation.x = -0.3;
    headGroup.add(lid);

    return { eye, lid };
  };

  const leftEye = buildEye(0.044);
  const rightEye = buildEye(-0.044);

  // Delicate white whiskers (4 per side)
  const whiskerPoints: number[] = [];
  for (let side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const yOff = -0.028 - i * 0.0055;
      const spreadY = (i - 1.5) * 0.012;
      const len = 0.088 + (i % 2) * 0.016;
      whiskerPoints.push(
        side * 0.036,
        yOff,
        0.094,
        side * (0.036 + len),
        yOff + spreadY,
        0.072 - i * 0.005,
      );
    }
  }
  const whiskerGeo = track(new THREE.BufferGeometry());
  whiskerGeo.setAttribute('position', new THREE.Float32BufferAttribute(whiskerPoints, 3));
  const whiskers = new THREE.LineSegments(whiskerGeo, whiskerMat);
  headGroup.add(whiskers);

  // Articulated Ears (left & right)
  const buildEar = (side: 1 | -1): THREE.Group => {
    const earPivot = new THREE.Group();
    earPivot.position.set(side * 0.068, 0.078, 0.008);
    earPivot.rotation.z = -side * 0.24;
    earPivot.rotation.x = 0.14;

    const outerGeo = track(new THREE.ConeGeometry(0.042, 0.088, 12));
    const outerMesh = new THREE.Mesh(outerGeo, furGreyMat);
    outerMesh.position.y = 0.038;
    outerMesh.scale.set(0.95, 1.0, 0.62);
    outerMesh.castShadow = true;
    earPivot.add(outerMesh);

    const innerGeo = track(new THREE.ConeGeometry(0.026, 0.064, 10));
    const innerMesh = new THREE.Mesh(innerGeo, innerEarMat);
    innerMesh.position.set(0, 0.032, 0.011);
    innerMesh.scale.set(0.88, 1.0, 0.45);
    earPivot.add(innerMesh);

    headGroup.add(earPivot);
    return earPivot;
  };

  const earL = buildEar(1);
  const earR = buildEar(-1);

  // Multi-jointed Legs (FL, FR, BL, BR)
  const buildLeg = (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    isBack: boolean,
  ): LegJoints => {
    const hip = new THREE.Group();
    hip.position.set(x, y, z);
    parent.add(hip);

    const upperRadius = isBack ? 0.044 : 0.036;
    const upperLen = isBack ? 0.105 : 0.095;
    const upperGeo = track(new THREE.CapsuleGeometry(upperRadius, upperLen, 8, 14));
    const upperMesh = new THREE.Mesh(upperGeo, furBodyMat);
    upperMesh.position.y = -upperLen * 0.48;
    upperMesh.castShadow = true;
    hip.add(upperMesh);

    // Subtle tabby leg stripe band
    const bandGeo = track(
      new THREE.TorusGeometry(upperRadius * 0.94, 0.007, 6, 14),
    );
    const bandMesh = new THREE.Mesh(bandGeo, furDarkStripeMat);
    bandMesh.rotation.x = Math.PI / 2;
    bandMesh.position.y = -upperLen * 0.55;
    hip.add(bandMesh);

    const knee = new THREE.Group();
    knee.position.set(0, -upperLen * 0.95, 0);
    hip.add(knee);

    const lowerLen = isBack ? 0.092 : 0.088;
    const lowerGeo = track(new THREE.CapsuleGeometry(0.025, lowerLen, 8, 12));
    const lowerMesh = new THREE.Mesh(lowerGeo, furGreyMat);
    lowerMesh.position.y = -lowerLen * 0.48;
    lowerMesh.castShadow = true;
    knee.add(lowerMesh);

    const paw = new THREE.Group();
    paw.position.set(0, -lowerLen * 0.95, 0.012);
    knee.add(paw);

    const pawGeo = track(new THREE.SphereGeometry(0.028, 14, 12));
    const pawMesh = new THREE.Mesh(pawGeo, furGreyMat);
    pawMesh.scale.set(0.95, 0.62, 1.25);
    pawMesh.castShadow = true;
    paw.add(pawMesh);

    // Little toe nubs & pad
    const padGeo = track(new THREE.SphereGeometry(0.016, 10, 8));
    const padMesh = new THREE.Mesh(padGeo, pawPadMat);
    padMesh.position.set(0, -0.008, 0.005);
    padMesh.scale.set(1.0, 0.4, 1.1);
    paw.add(padMesh);

    return { hip, knee, paw };
  };

  // Front legs attached to chestGroup
  const legFL = buildLeg(chestGroup, 0.068, -0.035, 0.018, false);
  const legFR = buildLeg(chestGroup, -0.068, -0.035, 0.018, false);

  // Back legs attached to bodyPivot
  const legBL = buildLeg(bodyPivot, 0.072, -0.01, -0.145, true);
  const legBR = buildLeg(bodyPivot, -0.072, -0.01, -0.145, true);

  // 5-Segment Articulated Ringed Tabby Tail
  const tailSegments: THREE.Group[] = [];
  let tailParent: THREE.Object3D = bodyPivot;
  for (let i = 0; i < 5; i++) {
    const segGroup = new THREE.Group();
    if (i === 0) {
      segGroup.position.set(0, 0.045, -0.185);
    } else {
      segGroup.position.set(0, 0.068, 0);
    }
    tailParent.add(segGroup);

    const radius = 0.027 - i * 0.003;
    const segGeo = track(new THREE.CapsuleGeometry(radius, 0.056, 8, 12));
    const segMat = i % 2 === 1 || i === 4 ? furDarkStripeMat : furGreyMat;
    const segMesh = new THREE.Mesh(segGeo, segMat);
    segMesh.position.y = 0.034;
    segMesh.castShadow = true;
    segGroup.add(segMesh);

    tailSegments.push(segGroup);
    tailParent = segGroup;
  }

  // Internal procedural animation state
  let gaitPhase = 0;
  let blinkTimer = 2.4;
  let blinkAmount = 0;
  let earTwitchTimer = 3.1;
  let earTwitchSide = 1;
  let earTwitchAmount = 0;

  let curBodyY = 0.21;
  let curBodyPitch = 0;
  let curChestPitch = 0;
  let curChestY = 0.015;
  let curHeadYaw = 0;
  let curHeadPitch = 0;
  let curHeadRoll = 0;
  let curSwatWeight = 0;
  let curSitWeight = 0;
  let curStretchWeight = 0;

  const triggerBlink = () => {
    blinkTimer = 0.01;
  };

  const update = (dt: number, elapsed: number, input: CatAnimationInput) => {
    const safeDt = Math.min(dt, 0.05);

    // Blink logic
    blinkTimer -= safeDt;
    if (blinkTimer <= 0) {
      blinkAmount = 1;
      blinkTimer = 2.2 + Math.random() * 3.5;
    }
    blinkAmount = THREE.MathUtils.damp(blinkAmount, 0, 14, safeDt);
    const lidScaleY = 0.14 + blinkAmount * 0.92;
    leftEye.lid.scale.y = lidScaleY;
    rightEye.lid.scale.y = lidScaleY;

    // Ear twitch logic
    earTwitchTimer -= safeDt;
    if (earTwitchTimer <= 0) {
      earTwitchAmount = 1;
      earTwitchSide = Math.random() > 0.5 ? 1 : -1;
      earTwitchTimer = 2.0 + Math.random() * 4.0;
    }
    earTwitchAmount = THREE.MathUtils.damp(earTwitchAmount, 0, 12, safeDt);

    // State weights
    const isSitting = input.state === 'sit' || input.state === 'inBox';
    const isStretching = input.state === 'stretch';
    const isSwatting = input.swatTimer > 0;
    const isRunning = input.state === 'run';
    const isMoving = input.state === 'walk' || input.state === 'run';

    curSitWeight = THREE.MathUtils.damp(curSitWeight, isSitting ? 1 : 0, 9, safeDt);
    curStretchWeight = THREE.MathUtils.damp(curStretchWeight, isStretching ? 1 : 0, 7, safeDt);
    curSwatWeight = THREE.MathUtils.damp(curSwatWeight, isSwatting ? 1 : 0, 16, safeDt);

    // Advance gait cycle proportional to movement speed
    if (isMoving && input.isGrounded) {
      const cycleRate = isRunning ? 3.2 : 3.8;
      gaitPhase += safeDt * Math.max(2.0, input.speed * cycleRate);
    } else if (input.isGrounded) {
      // Smoothly return phase toward neutral
      gaitPhase += safeDt * 0.5;
    }

    const moveFactor = input.isGrounded ? Math.min(1, input.speed / 2.2) : 0;
    const gallopBlend = isRunning ? Math.min(1, (input.speed - 2.6) / 2.2) : 0;

    // Breathing + purring micro-vibration
    const breath = Math.sin(elapsed * 2.4) * 0.018;
    const purrJitter = input.isPurring ? Math.sin(elapsed * 42) * 0.0025 : 0;
    chestMesh.scale.set(1.04 + breath, 1.02 + breath * 0.8, 1.08);

    // Body height & pitch targets
    let targetBodyY = 0.21;
    let targetBodyPitch = 0;
    let targetChestPitch = 0;
    let targetChestY = 0.015;

    if (!input.isGrounded) {
      // Airborne jump arc
      const airPitch = THREE.MathUtils.clamp(-input.verticalVelocity * 0.1, -0.45, 0.42);
      targetBodyPitch = airPitch;
      targetBodyY = 0.23;
    } else if (curSitWeight > 0.05) {
      // Upright adorable British Shorthair sitting pose matching reference photo!
      targetBodyY = THREE.MathUtils.lerp(0.21, 0.145, curSitWeight);
      targetBodyPitch = THREE.MathUtils.lerp(0, -0.58, curSitWeight);
      targetChestPitch = THREE.MathUtils.lerp(0, 0.32, curSitWeight);
      targetChestY = THREE.MathUtils.lerp(0.015, 0.055, curSitWeight);
    } else if (curStretchWeight > 0.05) {
      // Front-paws-out cat yoga bow stretch!
      targetBodyY = THREE.MathUtils.lerp(0.21, 0.175, curStretchWeight);
      targetBodyPitch = THREE.MathUtils.lerp(0, 0.34, curStretchWeight);
      targetChestY = THREE.MathUtils.lerp(0.015, -0.035, curStretchWeight);
    } else if (isMoving) {
      const bob =
        gallopBlend > 0.2
          ? Math.sin(gaitPhase) * 0.024
          : Math.abs(Math.sin(gaitPhase)) * 0.012 * moveFactor;
      targetBodyY = 0.21 + bob;
      targetBodyPitch = gallopBlend * Math.cos(gaitPhase) * 0.18;
      targetChestPitch = gallopBlend * -Math.cos(gaitPhase) * 0.14;
    }

    curBodyY = THREE.MathUtils.damp(curBodyY, targetBodyY + purrJitter, 14, safeDt);
    curBodyPitch = THREE.MathUtils.damp(curBodyPitch, targetBodyPitch, 12, safeDt);
    curChestPitch = THREE.MathUtils.damp(curChestPitch, targetChestPitch, 12, safeDt);
    curChestY = THREE.MathUtils.damp(curChestY, targetChestY, 12, safeDt);

    bodyPivot.position.y = curBodyY;
    bodyPivot.rotation.x = curBodyPitch;
    chestGroup.position.y = curChestY;
    chestGroup.rotation.x = curChestPitch;

    // Head look & curious tilt
    const targetHeadYaw = THREE.MathUtils.clamp(input.headYawOffset, -0.75, 0.75);
    const targetHeadPitch =
      -curBodyPitch * 0.55 -
      curChestPitch * 0.5 +
      THREE.MathUtils.clamp(input.headPitchOffset, -0.45, 0.45) +
      (isSitting ? -0.08 : 0);
    const targetHeadRoll =
      input.headYawOffset * 0.16 + (isSitting ? Math.sin(elapsed * 0.9) * 0.05 : 0);

    curHeadYaw = THREE.MathUtils.damp(curHeadYaw, targetHeadYaw, 10, safeDt);
    curHeadPitch = THREE.MathUtils.damp(curHeadPitch, targetHeadPitch, 10, safeDt);
    curHeadRoll = THREE.MathUtils.damp(curHeadRoll, targetHeadRoll, 8, safeDt);

    headGroup.rotation.set(curHeadPitch, curHeadYaw, curHeadRoll);

    // Ear angles (back slightly while running, perked while sitting, twitching occasionally)
    const runEarBack = gallopBlend * 0.35;
    earL.rotation.x = 0.14 - runEarBack + (earTwitchSide > 0 ? earTwitchAmount * 0.32 : 0);
    earR.rotation.x = 0.14 - runEarBack + (earTwitchSide < 0 ? earTwitchAmount * 0.32 : 0);
    earL.rotation.z = -0.24 - runEarBack * 0.4;
    earR.rotation.z = 0.24 + runEarBack * 0.4;

    // Legs animation
    if (!input.isGrounded) {
      // Dynamic jump reach & tuck
      const stretch = input.verticalVelocity > 0 ? 0.55 : -0.45;
      legFL.hip.rotation.x = -0.65 + stretch * 0.2;
      legFR.hip.rotation.x = -0.58 + stretch * 0.2;
      legFL.knee.rotation.x = 0.55;
      legFR.knee.rotation.x = 0.5;

      legBL.hip.rotation.x = 0.72 - stretch * 0.25;
      legBR.hip.rotation.x = 0.68 - stretch * 0.25;
      legBL.knee.rotation.x = -0.45;
      legBR.knee.rotation.x = -0.45;
    } else if (curSitWeight > 0.5) {
      // Sitting: front paws neatly planted forward, hind legs tucked cleanly under haunches
      legFL.hip.rotation.x = 0.26 * curSitWeight;
      legFR.hip.rotation.x = 0.26 * curSitWeight;
      legFL.knee.rotation.x = -0.08 * curSitWeight;
      legFR.knee.rotation.x = -0.08 * curSitWeight;

      legBL.hip.rotation.x = -0.78 * curSitWeight;
      legBR.hip.rotation.x = -0.78 * curSitWeight;
      legBL.knee.rotation.x = 1.48 * curSitWeight;
      legBR.knee.rotation.x = 1.48 * curSitWeight;
    } else if (curStretchWeight > 0.3) {
      // Yoga bow stretch: front legs extended forward, back legs upright
      legFL.hip.rotation.x = -0.85 * curStretchWeight;
      legFR.hip.rotation.x = -0.85 * curStretchWeight;
      legFL.knee.rotation.x = 0.15 * curStretchWeight;
      legFR.knee.rotation.x = 0.15 * curStretchWeight;

      legBL.hip.rotation.x = -0.35 * curStretchWeight;
      legBR.hip.rotation.x = -0.35 * curStretchWeight;
      legBL.knee.rotation.x = 0.25 * curStretchWeight;
      legBR.knee.rotation.x = 0.25 * curStretchWeight;
    } else {
      // Walk / Trot / Gallop blended cycle
      const strideAmp = (0.48 + gallopBlend * 0.36) * moveFactor;

      const phaseFL = gaitPhase;
      const phaseFR = gallopBlend > 0.4 ? gaitPhase + 0.35 : gaitPhase + Math.PI;
      const phaseBL = gallopBlend > 0.4 ? gaitPhase + Math.PI : gaitPhase + Math.PI * 0.85;
      const phaseBR = gallopBlend > 0.4 ? gaitPhase + Math.PI + 0.35 : gaitPhase + Math.PI * 1.85;

      const applyStride = (leg: LegJoints, ph: number, isBack: boolean) => {
        const swing = Math.sin(ph) * strideAmp;
        const lift = Math.max(0, Math.cos(ph)) * strideAmp * 0.9;
        leg.hip.rotation.x = swing;
        leg.knee.rotation.x = isBack ? -lift * 0.85 : lift * 0.95;
        leg.paw.rotation.x = -swing * 0.35;
      };

      applyStride(legFL, phaseFL, false);
      applyStride(legFR, phaseFR, false);
      applyStride(legBL, phaseBL, true);
      applyStride(legBR, phaseBR, true);
    }

    // Swat / Bat overlay on right front paw!
    if (curSwatWeight > 0.02) {
      const swatSwipe = Math.sin(input.swatTimer * 18);
      legFR.hip.rotation.x = THREE.MathUtils.lerp(
        legFR.hip.rotation.x,
        -1.05 + swatSwipe * 0.38,
        curSwatWeight,
      );
      legFR.hip.rotation.z = THREE.MathUtils.lerp(0, 0.22 * swatSwipe, curSwatWeight);
      legFR.knee.rotation.x = THREE.MathUtils.lerp(legFR.knee.rotation.x, 0.2, curSwatWeight);
    } else {
      legFR.hip.rotation.z = THREE.MathUtils.damp(legFR.hip.rotation.z, 0, 12, safeDt);
    }

    // Tail wave kinematics (happy question-mark curve in walk/idle, flowing behind in run, curled when sitting)
    for (let i = 0; i < tailSegments.length; i++) {
      const seg = tailSegments[i];
      const wave = Math.sin(elapsed * (isMoving ? 4.8 : 2.1) - i * 0.65);
      if (i === 0) {
        const basePitch = isRunning
          ? -1.25
          : isSitting
            ? -1.32
            : isMoving
              ? -0.45
              : -0.62;
        seg.rotation.x = THREE.MathUtils.damp(seg.rotation.x, basePitch, 8, safeDt);
        seg.rotation.z = wave * (isRunning ? 0.08 : 0.16);
      } else {
        const curveX = isRunning
          ? 0.08 + wave * 0.04
          : isSitting
            ? 0.24
            : 0.16 + Math.cos(elapsed * 1.9 - i * 0.5) * 0.08;
        const curveZ = isSitting
          ? 0.28
          : wave * (0.14 + i * 0.04);
        seg.rotation.x = THREE.MathUtils.damp(seg.rotation.x, curveX, 8, safeDt);
        seg.rotation.z = THREE.MathUtils.damp(seg.rotation.z, curveZ, 8, safeDt);
      }
    }
  };

  return {
    group,
    contactShadow,
    update,
    triggerBlink,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
