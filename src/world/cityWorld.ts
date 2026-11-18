import * as THREE from 'three';
import type { ProceduralTextureSet } from './textures';
import type {
  ColliderBox,
  InteractableObject,
  TimeOfDay,
  WalkablePlatform,
  WorldProgress,
} from './types';

export interface CityWorldHandle {
  group: THREE.Group;
  colliders: ColliderBox[];
  platforms: WalkablePlatform[];
  interactables: InteractableObject[];
  raycastTargets: THREE.Object3D[];
  applyTimeOfDay: (
    preset: TimeOfDay,
    scene: THREE.Scene,
    sunLight: THREE.DirectionalLight,
    hemiLight: THREE.HemisphereLight,
  ) => void;
  update: (dt: number, elapsed: number) => void;
  getProgress: () => WorldProgress;
  dispose: () => void;
}

export function createCityWorld(textures: ProceduralTextureSet): CityWorldHandle {
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const group = new THREE.Group();
  group.name = 'IndianCityParkWorld';

  const colliders: ColliderBox[] = [];
  const platforms: WalkablePlatform[] = [];
  const interactables: InteractableObject[] = [];
  const raycastTargets: THREE.Object3D[] = [];

  // Shared PBR Materials
  const asphaltMat = track(
    new THREE.MeshStandardMaterial({
      map: textures.asphaltMap,
      roughness: 0.85,
      metalness: 0.05,
    }),
  );
  const sidewalkMat = track(
    new THREE.MeshStandardMaterial({
      map: textures.sidewalkMap,
      roughness: 0.88,
      metalness: 0.02,
    }),
  );
  const parkPathMat = track(
    new THREE.MeshStandardMaterial({
      map: textures.parkPathMap,
      roughness: 0.84,
      metalness: 0.02,
    }),
  );
  const grassMat = track(
    new THREE.MeshStandardMaterial({
      map: textures.grassMap,
      roughness: 0.94,
      metalness: 0.0,
    }),
  );
  const sandstoneMat = track(
    new THREE.MeshStandardMaterial({
      color: '#c99c74',
      roughness: 0.84,
      metalness: 0.02,
    }),
  );
  const curbYellowMat = track(
    new THREE.MeshStandardMaterial({
      color: '#eab308',
      roughness: 0.72,
      metalness: 0.04,
    }),
  );
  const curbBlackMat = track(
    new THREE.MeshStandardMaterial({
      color: '#22262b',
      roughness: 0.76,
      metalness: 0.06,
    }),
  );
  const woodMat = track(
    new THREE.MeshStandardMaterial({
      map: textures.woodSlatMap,
      roughness: 0.72,
      metalness: 0.04,
    }),
  );
  const castIronMat = track(
    new THREE.MeshStandardMaterial({
      color: '#203028',
      roughness: 0.44,
      metalness: 0.72,
    }),
  );
  const darkMetalMat = track(
    new THREE.MeshStandardMaterial({
      color: '#22262c',
      roughness: 0.38,
      metalness: 0.78,
    }),
  );
  const metalCanMat = track(
    new THREE.MeshStandardMaterial({
      map: textures.metalCanMap,
      roughness: 0.36,
      metalness: 0.82,
    }),
  );
  const greenBinMat = track(
    new THREE.MeshStandardMaterial({
      color: '#1e7a4c',
      roughness: 0.45,
      metalness: 0.25,
    }),
  );
  const blueBinMat = track(
    new THREE.MeshStandardMaterial({
      color: '#1e5b9c',
      roughness: 0.45,
      metalness: 0.25,
    }),
  );
  const cardboardMat = track(
    new THREE.MeshStandardMaterial({
      map: textures.cardboardMap,
      roughness: 0.9,
      metalness: 0.0,
    }),
  );
  const cardboardInnerMat = track(
    new THREE.MeshStandardMaterial({
      color: '#9b7146',
      roughness: 0.94,
      metalness: 0.0,
    }),
  );
  const brickMat = track(
    new THREE.MeshStandardMaterial({
      map: textures.brickMap,
      roughness: 0.86,
      metalness: 0.02,
    }),
  );
  const ochreWallMat = track(
    new THREE.MeshStandardMaterial({
      color: '#e0a44b',
      roughness: 0.85,
      metalness: 0.02,
    }),
  );
  const tealWallMat = track(
    new THREE.MeshStandardMaterial({
      color: '#5b9a94',
      roughness: 0.85,
      metalness: 0.02,
    }),
  );
  const terracottaWallMat = track(
    new THREE.MeshStandardMaterial({
      color: '#c96f53',
      roughness: 0.85,
      metalness: 0.02,
    }),
  );
  const creamWallMat = track(
    new THREE.MeshStandardMaterial({
      color: '#eadcc6',
      roughness: 0.84,
      metalness: 0.02,
    }),
  );
  const shutterMat = track(
    new THREE.MeshStandardMaterial({
      map: textures.shutterMap,
      roughness: 0.46,
      metalness: 0.65,
    }),
  );
  const slateTrimMat = track(
    new THREE.MeshStandardMaterial({
      color: '#343b46',
      roughness: 0.56,
      metalness: 0.18,
    }),
  );
  const glassWindowMat = track(
    new THREE.MeshPhysicalMaterial({
      color: '#7fa3bd',
      roughness: 0.1,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    }),
  );
  const warmGlowMat = track(
    new THREE.MeshStandardMaterial({
      color: '#ffe0a6',
      emissive: '#ffb23d',
      emissiveIntensity: 0.4,
      roughness: 0.3,
    }),
  );
  const waterMat = track(
    new THREE.MeshPhysicalMaterial({
      color: '#3b8da8',
      roughness: 0.08,
      metalness: 0.1,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.84,
    }),
  );
  const shadowDecalMat = track(
    new THREE.MeshBasicMaterial({
      map: textures.contactShadowMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.38,
    }),
  );

  // =========================================================================
  // 1. CONTINUOUS INDIAN STREET, BLACK-YELLOW CURBS & MAIDAN PARK
  // =========================================================================

  const outerGround = new THREE.Mesh(
    track(new THREE.PlaneGeometry(240, 240)),
    grassMat,
  );
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.06;
  outerGround.receiveShadow = true;
  group.add(outerGround);

  const sidewalkBase = new THREE.Mesh(
    track(new THREE.BoxGeometry(68, 0.08, 68)),
    sidewalkMat,
  );
  sidewalkBase.position.set(0, -0.04, 0);
  sidewalkBase.receiveShadow = true;
  group.add(sidewalkBase);

  const streetMesh = new THREE.Mesh(
    track(new THREE.BoxGeometry(68, 0.04, 10.5)),
    asphaltMat,
  );
  streetMesh.position.set(0, -0.018, -12.5);
  streetMesh.receiveShadow = true;
  group.add(streetMesh);

  // Classic Indian black-and-yellow striped road curb segments
  const curbSegGeo = track(new THREE.BoxGeometry(2.0, 0.1, 0.36));
  for (let i = -17; i <= 16; i++) {
    const isYellow = Math.abs(i) % 2 === 0;
    const mat = isYellow ? curbYellowMat : curbBlackMat;
    const cN = new THREE.Mesh(curbSegGeo, mat);
    cN.position.set(i * 2 + 1, 0.02, -17.75);
    cN.receiveShadow = true;
    cN.castShadow = true;
    group.add(cN);

    const cS = new THREE.Mesh(curbSegGeo, mat);
    cS.position.set(i * 2 + 1, 0.02, -7.25);
    cS.receiveShadow = true;
    cS.castShadow = true;
    group.add(cS);
  }

  // Zebra Crosswalk & Center Lane Dashed Lines
  const markingMat = track(
    new THREE.MeshStandardMaterial({ color: '#f3efe6', roughness: 0.72 }),
  );
  const dashGeo = track(new THREE.BoxGeometry(2.4, 0.012, 0.22));
  for (let x = -28; x <= 28; x += 5.5) {
    if (Math.abs(x) < 4) continue;
    const dash = new THREE.Mesh(dashGeo, markingMat);
    dash.position.set(x, 0.008, -12.5);
    dash.receiveShadow = true;
    group.add(dash);
  }
  const zebraGeo = track(new THREE.BoxGeometry(0.65, 0.012, 8.2));
  for (let x = -3.2; x <= 3.2; x += 1.3) {
    const zebra = new THREE.Mesh(zebraGeo, markingMat);
    zebra.position.set(x, 0.008, -12.5);
    zebra.receiveShadow = true;
    group.add(zebra);
  }

  // Neighborhood Maidan Park Lawn
  const parkLawn = new THREE.Mesh(
    track(new THREE.BoxGeometry(27, 0.04, 27)),
    grassMat,
  );
  parkLawn.position.set(10, 0.005, 9);
  parkLawn.receiveShadow = true;
  group.add(parkLawn);

  // Sandstone Park Paths & Octagonal Chhatri Plaza
  const plazaDisc = new THREE.Mesh(
    track(new THREE.CylinderGeometry(6.3, 6.3, 0.045, 8)),
    parkPathMat,
  );
  plazaDisc.position.set(10, 0.016, 9);
  plazaDisc.receiveShadow = true;
  group.add(plazaDisc);

  const pathNS = new THREE.Mesh(
    track(new THREE.BoxGeometry(3.6, 0.04, 27)),
    parkPathMat,
  );
  pathNS.position.set(10, 0.014, 9);
  pathNS.receiveShadow = true;
  group.add(pathNS);

  const pathEW = new THREE.Mesh(
    track(new THREE.BoxGeometry(27.5, 0.04, 3.6)),
    parkPathMat,
  );
  pathEW.position.set(10, 0.014, 9);
  pathEW.receiveShadow = true;
  group.add(pathEW);

  // =========================================================================
  // 2. SANDSTONE FOUNTAIN & HERITAGE CHHATRI PAVILION CENTERPIECE
  // =========================================================================
  const fountainGroup = new THREE.Group();
  fountainGroup.position.set(10, 0, 9);
  group.add(fountainGroup);

  const fountainRim = new THREE.Mesh(
    track(new THREE.TorusGeometry(2.3, 0.24, 12, 8)),
    sandstoneMat,
  );
  fountainRim.rotation.x = Math.PI / 2;
  fountainRim.position.y = 0.24;
  fountainRim.castShadow = true;
  fountainRim.receiveShadow = true;
  fountainGroup.add(fountainRim);

  const fountainWall = new THREE.Mesh(
    track(new THREE.CylinderGeometry(2.35, 2.48, 0.44, 8, 1, true)),
    sandstoneMat,
  );
  fountainWall.position.y = 0.22;
  fountainWall.castShadow = true;
  fountainWall.receiveShadow = true;
  fountainGroup.add(fountainWall);

  const fountainWater = new THREE.Mesh(
    track(new THREE.CylinderGeometry(2.15, 2.15, 0.08, 24)),
    waterMat,
  );
  fountainWater.position.y = 0.34;
  fountainGroup.add(fountainWater);

  const fountainPedestal = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.45, 0.65, 1.35, 8)),
    sandstoneMat,
  );
  fountainPedestal.position.y = 0.68;
  fountainPedestal.castShadow = true;
  fountainGroup.add(fountainPedestal);

  const fountainBowl = new THREE.Mesh(
    track(new THREE.CylinderGeometry(1.0, 0.4, 0.32, 8)),
    sandstoneMat,
  );
  fountainBowl.position.y = 1.35;
  fountainBowl.castShadow = true;
  fountainGroup.add(fountainBowl);

  // Heritage Chhatri lotus finial spire
  const lotusSpire = new THREE.Mesh(
    track(new THREE.ConeGeometry(0.28, 0.55, 8)),
    sandstoneMat,
  );
  lotusSpire.position.y = 1.78;
  lotusSpire.castShadow = true;
  fountainGroup.add(lotusSpire);

  const dropletCount = 24;
  const dropletGeo = track(new THREE.SphereGeometry(0.055, 8, 6));
  const dropletMat = track(
    new THREE.MeshPhysicalMaterial({
      color: '#b8e8f5',
      roughness: 0.1,
      transparent: true,
      opacity: 0.78,
    }),
  );
  const droplets = new THREE.InstancedMesh(dropletGeo, dropletMat, dropletCount);
  droplets.frustumCulled = false;
  fountainGroup.add(droplets);

  colliders.push({
    minX: 7.75,
    maxX: 12.25,
    minZ: 6.75,
    maxZ: 11.25,
    maxY: 0.45,
    id: 'fountain',
  });
  platforms.push({
    id: 'fountain-rim',
    minX: 7.55,
    maxX: 12.45,
    minZ: 6.55,
    maxZ: 11.45,
    topY: 0.46,
    surfaceType: 'stone',
  });

  // =========================================================================
  // 3. INDIAN BAZAAR STOREFRONTS (Chajjas, Balconies, Shutters, Water Tanks)
  // =========================================================================
  const marigoldOrangeMat = track(
    new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.75 }),
  );
  const marigoldYellowMat = track(
    new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.75 }),
  );
  const waterTankMat = track(
    new THREE.MeshStandardMaterial({ color: '#1e242b', roughness: 0.42, metalness: 0.12 }),
  );

  const addIndianBuilding = (
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
    wallMat: THREE.Material,
    awningColor: string | null,
    signTex: THREE.CanvasTexture | null,
    facingAxis: 'x+' | 'z+',
    hasMarigoldGarland = false,
  ) => {
    const bGroup = new THREE.Group();
    bGroup.position.set(x, 0, z);
    group.add(bGroup);

    // Main stucco / painted concrete building
    const body = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), wallMat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    bGroup.add(body);

    // Rooftop parapet wall + black Sintex water tank!
    const parapet = new THREE.Mesh(
      track(new THREE.BoxGeometry(w + 0.25, 0.48, d + 0.25)),
      creamWallMat,
    );
    parapet.position.y = h + 0.22;
    parapet.castShadow = true;
    bGroup.add(parapet);

    const tank = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.62, 0.62, 1.25, 16)),
      waterTankMat,
    );
    tank.position.set(facingAxis === 'x+' ? -1.1 : 1.4, h + 0.9, -0.8);
    tank.castShadow = true;
    bGroup.add(tank);

    // Rolling shopfront metal shutter / open shop bay
    const frontOffset = facingAxis === 'x+' ? w / 2 + 0.04 : d / 2 + 0.04;
    const bayW = facingAxis === 'x+' ? 0.12 : Math.min(w * 0.62, 4.4);
    const bayD = facingAxis === 'x+' ? Math.min(d * 0.62, 4.4) : 0.12;

    const shutter = new THREE.Mesh(
      track(new THREE.BoxGeometry(bayW, 2.55, bayD)),
      shutterMat,
    );
    if (facingAxis === 'x+') shutter.position.set(frontOffset, 1.32, 0);
    else shutter.position.set(0, 1.32, frontOffset);
    bGroup.add(shutter);

    // Painted Indian Shop Signboard
    if (signTex) {
      const signMat = track(
        new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.45 }),
      );
      const signGeo = track(
        new THREE.BoxGeometry(
          facingAxis === 'x+' ? 0.14 : Math.min(w * 0.72, 5.4),
          1.15,
          facingAxis === 'x+' ? Math.min(d * 0.72, 5.4) : 0.14,
        ),
      );
      const signMesh = new THREE.Mesh(signGeo, signMat);
      if (facingAxis === 'x+') signMesh.position.set(w / 2 + 0.12, 3.65, 0);
      else signMesh.position.set(0, 3.65, d / 2 + 0.12);
      signMesh.castShadow = true;
      bGroup.add(signMesh);
    }

    // Upper floor windows with concrete chajja sunshades & iron balcony
    for (let wy = 5.4; wy < h - 1.0; wy += 3.0) {
      for (const offset of [-1.8, 1.8]) {
        const upWin = new THREE.Mesh(
          track(
            new THREE.BoxGeometry(
              facingAxis === 'x+' ? 0.08 : 1.15,
              1.4,
              facingAxis === 'x+' ? 1.15 : 0.08,
            ),
          ),
          warmGlowMat,
        );
        const chajja = new THREE.Mesh(
          track(
            new THREE.BoxGeometry(
              facingAxis === 'x+' ? 0.55 : 1.5,
              0.12,
              facingAxis === 'x+' ? 1.5 : 0.55,
            ),
          ),
          creamWallMat,
        );
        if (facingAxis === 'x+') {
          upWin.position.set(frontOffset, wy, offset);
          chajja.position.set(w / 2 + 0.25, wy + 0.78, offset);
        } else {
          upWin.position.set(offset, wy, frontOffset);
          chajja.position.set(offset, wy + 0.78, d / 2 + 0.25);
        }
        chajja.castShadow = true;
        bGroup.add(upWin, chajja);
      }

      // Balcony ledge & grill
      const balcony = new THREE.Mesh(
        track(
          new THREE.BoxGeometry(
            facingAxis === 'x+' ? 0.85 : w * 0.56,
            0.14,
            facingAxis === 'x+' ? d * 0.56 : 0.85,
          ),
        ),
        creamWallMat,
      );
      if (facingAxis === 'x+') balcony.position.set(w / 2 + 0.4, wy - 0.9, 0);
      else balcony.position.set(0, wy - 0.9, d / 2 + 0.4);
      balcony.castShadow = true;
      bGroup.add(balcony);
    }

    // Shopfront tin / fabric awning
    if (awningColor) {
      const awningMat = track(
        new THREE.MeshStandardMaterial({ color: awningColor, roughness: 0.72 }),
      );
      const awning = new THREE.Mesh(
        track(
          new THREE.BoxGeometry(
            facingAxis === 'x+' ? 1.65 : w * 0.74,
            0.14,
            facingAxis === 'x+' ? d * 0.74 : 1.65,
          ),
        ),
        awningMat,
      );
      if (facingAxis === 'x+') {
        awning.position.set(w / 2 + 0.75, 2.95, 0);
        awning.rotation.z = -0.24;
      } else {
        awning.position.set(0, 2.95, d / 2 + 0.75);
        awning.rotation.x = 0.24;
      }
      awning.castShadow = true;
      bGroup.add(awning);

      // Marigold Toran Garland along front of awning!
      if (hasMarigoldGarland) {
        const flowerGeo = track(new THREE.SphereGeometry(0.095, 8, 8));
        const span = 5.4;
        for (let i = 0; i <= 14; i++) {
          const t = i / 14;
          const posAlong = (t - 0.5) * span;
          const sag = Math.sin(t * Math.PI) * 0.24;
          const flower = new THREE.Mesh(
            flowerGeo,
            i % 2 === 0 ? marigoldOrangeMat : marigoldYellowMat,
          );
          if (facingAxis === 'x+') {
            flower.position.set(w / 2 + 1.48, 2.72 - sag, posAlong);
          } else {
            flower.position.set(posAlong, 2.72 - sag, d / 2 + 1.48);
          }
          bGroup.add(flower);
        }
      }
    }

    colliders.push({
      minX: x - w / 2 - 0.25,
      maxX: x + w / 2 + 0.25,
      minZ: z - d / 2 - 0.25,
      maxZ: z + d / 2 + 0.25,
      maxY: h,
    });
  };

  // West Bazaar Row: Chai Tapri, Kirana Store, Book Depot
  addIndianBuilding(
    -15,
    -1,
    7.5,
    9.2,
    9.5,
    ochreWallMat,
    '#d94834',
    textures.chaiSignMap,
    'x+',
    true,
  );
  addIndianBuilding(
    -15,
    9.5,
    7.5,
    11.0,
    9.5,
    tealWallMat,
    '#166534',
    textures.kiranaSignMap,
    'x+',
    true,
  );
  addIndianBuilding(
    -15,
    20,
    7.5,
    8.8,
    9.5,
    terracottaWallMat,
    '#1d4ed8',
    textures.bookSignMap,
    'x+',
    false,
  );

  // North Street Row: Apartment blocks & shops across the avenue
  addIndianBuilding(-14, -23.5, 10, 12, 8, creamWallMat, '#c2410c', null, 'z+', true);
  addIndianBuilding(-2, -23.5, 11, 14.2, 8, terracottaWallMat, '#0f766e', textures.kiranaSignMap, 'z+', false);
  addIndianBuilding(11, -23.5, 11, 11.4, 8, ochreWallMat, '#b91c1c', textures.chaiSignMap, 'z+', true);
  addIndianBuilding(24, -23.5, 10, 12.6, 8, brickMat, null, null, 'z+', false);

  // Distant Indian City Skyline Silhouettes (warm sandstone & concrete towers)
  const skylineMat = track(
    new THREE.MeshStandardMaterial({ color: '#8a7e72', roughness: 0.9 }),
  );
  const skylinePositions: [number, number, number, number, number][] = [
    [-34, -28, 12, 22, 10],
    [-34, -8, 10, 18, 14],
    [-34, 14, 12, 25, 12],
    [-22, 34, 14, 16, 10],
    [-4, 34, 12, 20, 10],
    [35, -24, 12, 24, 12],
    [36, 4, 10, 19, 14],
    [36, 24, 12, 21, 12],
  ];
  skylinePositions.forEach(([sx, sz, sw, sh, sd]) => {
    const m = new THREE.Mesh(track(new THREE.BoxGeometry(sw, sh, sd)), skylineMat);
    m.position.set(sx, sh / 2 - 0.1, sz);
    group.add(m);
  });

  // =========================================================================
  // 4. ICONIC INDIAN AUTO-RICKSHAW (TUK-TUK) & RED HERITAGE POST BOX
  // =========================================================================
  const autoGroup = new THREE.Group();
  autoGroup.position.set(5.2, 0, -9.2);
  autoGroup.rotation.y = -Math.PI * 0.52;
  group.add(autoGroup);

  const autoShadow = new THREE.Mesh(
    track(new THREE.PlaneGeometry(2.8, 1.8)),
    shadowDecalMat,
  );
  autoShadow.rotation.x = -Math.PI / 2;
  autoShadow.position.y = 0.025;
  autoGroup.add(autoShadow);

  const autoYellowMat = track(
    new THREE.MeshStandardMaterial({ color: '#f5b70a', roughness: 0.34, metalness: 0.28 }),
  );
  const autoBlackMat = track(
    new THREE.MeshStandardMaterial({ color: '#1b1e23', roughness: 0.45, metalness: 0.35 }),
  );
  const autoCanopyMat = track(
    new THREE.MeshStandardMaterial({ color: '#24292e', roughness: 0.78 }),
  );

  // Chassis base
  const autoFloor = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.18, 0.16, 2.25)),
    autoBlackMat,
  );
  autoFloor.position.set(0, 0.32, 0);
  autoFloor.castShadow = true;
  autoGroup.add(autoFloor);

  // Yellow rear passenger body + engine hood
  const autoRear = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.16, 0.72, 1.05)),
    autoYellowMat,
  );
  autoRear.position.set(0, 0.74, -0.58);
  autoRear.castShadow = true;
  autoGroup.add(autoRear);

  // Front nose cowl
  const autoNose = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.45, 0.52, 0.85, 14, 1, false, -Math.PI * 0.5, Math.PI)),
    autoBlackMat,
  );
  autoNose.position.set(0, 0.76, 0.78);
  autoNose.castShadow = true;
  autoGroup.add(autoNose);

  // Headlight
  const headlight = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.11, 12, 10)),
    warmGlowMat,
  );
  headlight.position.set(0, 0.78, 1.24);
  autoGroup.add(headlight);

  // Windshield glass
  const windshield = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.92, 0.56, 0.05)),
    glassWindowMat,
  );
  windshield.position.set(0, 1.38, 0.68);
  windshield.rotation.x = -0.18;
  autoGroup.add(windshield);

  // Canopy posts + curved black hood roof
  for (const px of [-0.52, 0.52]) {
    const postF = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 8)),
      autoBlackMat,
    );
    postF.position.set(px, 1.35, 0.62);
    autoGroup.add(postF);

    const postB = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.03, 0.03, 0.82, 8)),
      autoBlackMat,
    );
    postB.position.set(px, 1.44, -0.98);
    autoGroup.add(postB);
  }

  const canopyRoof = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.22, 0.14, 1.95)),
    autoCanopyMat,
  );
  canopyRoof.position.set(0, 1.82, -0.15);
  canopyRoof.castShadow = true;
  autoGroup.add(canopyRoof);

  // 3 Wheels (1 front, 2 rear)
  const wheelGeo = track(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 16));
  const wheelPos: [number, number, number][] = [
    [0, 0.24, 0.88],
    [-0.58, 0.24, -0.68],
    [0.58, 0.24, -0.68],
  ];
  wheelPos.forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wheelGeo, autoBlackMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, wy, wz);
    w.castShadow = true;
    autoGroup.add(w);
  });

  colliders.push({
    minX: 4.0,
    maxX: 6.4,
    minZ: -9.9,
    maxZ: -8.5,
    maxY: 1.85,
  });

  // Classic Red Indian Pillar Post Box (Sidewalk Corner)
  const postBoxGroup = new THREE.Group();
  postBoxGroup.position.set(-7.6, 0, -5.8);
  group.add(postBoxGroup);

  const postRedMat = track(
    new THREE.MeshStandardMaterial({ color: '#c42b23', roughness: 0.4, metalness: 0.28 }),
  );
  const pbBase = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.22, 0.24, 0.18, 16)),
    curbBlackMat,
  );
  pbBase.position.y = 0.09;
  postBoxGroup.add(pbBase);

  const pbBody = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.2, 0.2, 0.92, 18)),
    postRedMat,
  );
  pbBody.position.y = 0.62;
  pbBody.castShadow = true;
  postBoxGroup.add(pbBody);

  const pbDome = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.215, 16, 12)),
    postRedMat,
  );
  pbDome.position.y = 1.08;
  pbDome.castShadow = true;
  postBoxGroup.add(pbDome);

  const pbSlot = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.2, 0.05, 0.06)),
    curbBlackMat,
  );
  pbSlot.position.set(0, 0.88, 0.19);
  postBoxGroup.add(pbSlot);

  colliders.push({
    minX: -7.9,
    maxX: -7.3,
    minZ: -6.1,
    maxZ: -5.5,
    maxY: 1.3,
  });

  // =========================================================================
  // 5. NEEM & GULMOHAR (FLAME-OF-THE-FOREST) TREES + STREETLIGHTS
  // =========================================================================
  const trunkMat = track(new THREE.MeshStandardMaterial({ color: '#5c4332', roughness: 0.92 }));
  const leafGreen1 = track(new THREE.MeshStandardMaterial({ color: '#3f7636', roughness: 0.85 }));
  const leafGreen2 = track(new THREE.MeshStandardMaterial({ color: '#588c44', roughness: 0.85 }));
  const gulmoharMat = track(new THREE.MeshStandardMaterial({ color: '#e65325', roughness: 0.84 }));

  const addTree = (x: number, z: number, scale = 1, isGulmohar = false) => {
    const tGroup = new THREE.Group();
    tGroup.position.set(x, 0, z);
    tGroup.scale.setScalar(scale);
    group.add(tGroup);

    const trunk = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.18, 0.3, 2.25, 10)),
      trunkMat,
    );
    trunk.position.y = 1.12;
    trunk.castShadow = true;
    tGroup.add(trunk);

    const crown1 = new THREE.Mesh(
      track(new THREE.DodecahedronGeometry(1.38, 1)),
      isGulmohar ? gulmoharMat : leafGreen1,
    );
    crown1.position.set(0, 2.85, 0);
    crown1.castShadow = true;
    crown1.receiveShadow = true;
    tGroup.add(crown1);

    const crown2 = new THREE.Mesh(
      track(new THREE.DodecahedronGeometry(0.95, 1)),
      isGulmohar ? marigoldOrangeMat : leafGreen2,
    );
    crown2.position.set(0.65, 2.55, 0.4);
    crown2.castShadow = true;
    tGroup.add(crown2);

    const crown3 = new THREE.Mesh(
      track(new THREE.DodecahedronGeometry(0.9, 1)),
      leafGreen2,
    );
    crown3.position.set(-0.6, 2.65, -0.38);
    crown3.castShadow = true;
    tGroup.add(crown3);

    colliders.push({
      minX: x - 0.34 * scale,
      maxX: x + 0.34 * scale,
      minZ: z - 0.34 * scale,
      maxZ: z + 0.34 * scale,
      maxY: 2.25 * scale,
    });
  };

  const treeCoords: [number, number, number, boolean][] = [
    [1.5, -1.5, 1.0, true],
    [19.5, -1.5, 1.15, false],
    [20.5, 19.5, 1.12, true],
    [1.2, 19.5, 1.05, false],
    [26.5, 5.0, 1.25, false],
    [26.5, 14.5, 1.2, true],
    [25.5, -18.5, 1.05, false],
    [14.0, 25.0, 1.15, false],
    [3.5, 25.5, 1.2, true],
    [-8.5, -18.8, 0.95, false],
  ];
  treeCoords.forEach(([tx, tz, sc, gul]) => addTree(tx, tz, sc, gul));

  const addStreetlight = (x: number, z: number) => {
    const lGroup = new THREE.Group();
    lGroup.position.set(x, 0, z);
    group.add(lGroup);

    const base = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.16, 0.22, 0.55, 12)),
      darkMetalMat,
    );
    base.position.y = 0.275;
    base.castShadow = true;
    lGroup.add(base);

    const pole = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.065, 0.095, 4.1, 10)),
      darkMetalMat,
    );
    pole.position.y = 2.4;
    pole.castShadow = true;
    lGroup.add(pole);

    const lampCap = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.28, 0.14, 0.18, 12)),
      darkMetalMat,
    );
    lampCap.position.y = 4.65;
    lGroup.add(lampCap);

    const bulb = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.17, 14, 12)),
      warmGlowMat,
    );
    bulb.position.y = 4.46;
    lGroup.add(bulb);

    colliders.push({
      minX: x - 0.24,
      maxX: x + 0.24,
      minZ: z - 0.24,
      maxZ: z + 0.24,
      maxY: 4.5,
    });
  };

  addStreetlight(-9.0, -6.5);
  addStreetlight(1.5, -6.5);
  addStreetlight(16.5, -6.5);

  // =========================================================================
  // 6. INTERACTIVE PARK BENCHES (Painted Municipal Green & Teak Slats)
  // =========================================================================
  const addParkBench = (id: string, x: number, z: number, yaw: number) => {
    const bGroup = new THREE.Group();
    bGroup.position.set(x, 0, z);
    bGroup.rotation.y = yaw;
    group.add(bGroup);

    const sh = new THREE.Mesh(track(new THREE.PlaneGeometry(2.3, 1.0)), shadowDecalMat);
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = 0.025;
    bGroup.add(sh);

    for (const sideX of [-0.82, 0.82]) {
      const legFront = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.07, 0.46, 0.07)),
        castIronMat,
      );
      legFront.position.set(sideX, 0.23, 0.22);
      legFront.castShadow = true;
      bGroup.add(legFront);

      const legBack = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.07, 0.86, 0.07)),
        castIronMat,
      );
      legBack.position.set(sideX, 0.43, -0.24);
      legBack.castShadow = true;
      bGroup.add(legBack);

      const armRest = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.07, 0.06, 0.54)),
        castIronMat,
      );
      armRest.position.set(sideX, 0.62, 0.0);
      armRest.castShadow = true;
      bGroup.add(armRest);

      const armPost = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.06, 0.22, 0.06)),
        castIronMat,
      );
      armPost.position.set(sideX, 0.52, 0.22);
      bGroup.add(armPost);
    }

    for (let i = 0; i < 3; i++) {
      const slat = new THREE.Mesh(
        track(new THREE.BoxGeometry(1.96, 0.045, 0.145)),
        woodMat,
      );
      slat.position.set(0, 0.458, -0.14 + i * 0.165);
      slat.castShadow = true;
      slat.receiveShadow = true;
      bGroup.add(slat);
    }

    for (let i = 0; i < 2; i++) {
      const backSlat = new THREE.Mesh(
        track(new THREE.BoxGeometry(1.96, 0.13, 0.045)),
        woodMat,
      );
      backSlat.position.set(0, 0.66 + i * 0.17, -0.25);
      backSlat.rotation.x = -0.14;
      backSlat.castShadow = true;
      bGroup.add(backSlat);
    }

    const hitMesh = new THREE.Mesh(
      track(new THREE.BoxGeometry(2.1, 0.9, 0.7)),
      track(new THREE.MeshBasicMaterial({ visible: false })),
    );
    hitMesh.position.y = 0.45;
    hitMesh.userData.interactableId = id;
    bGroup.add(hitMesh);
    raycastTargets.push(hitMesh);

    const isZAligned = Math.abs(Math.sin(yaw)) > 0.7;
    const halfW = isZAligned ? 0.34 : 0.98;
    const halfD = isZAligned ? 0.98 : 0.34;

    platforms.push({
      id,
      minX: x - halfW,
      maxX: x + halfW,
      minZ: z - halfD,
      maxZ: z + halfD,
      topY: 0.48,
      surfaceType: 'wood',
    });

    interactables.push({
      id,
      kind: 'park-bench',
      label: 'Park Bench',
      actionPrompt: 'Hop onto park bench',
      group: bGroup,
      position: new THREE.Vector3(x, 0.48, z),
      radius: 1.65,
      used: false,
      benchOrigin: new THREE.Vector3(x, 0.48, z),
      benchYaw: yaw,
    });
  };

  addParkBench('bench-1', 5.2, 4.4, Math.PI * 0.25);
  addParkBench('bench-2', 14.8, 4.4, -Math.PI * 0.25);
  addParkBench('bench-3', 5.2, 13.6, Math.PI * 0.75);
  addParkBench('bench-4', 14.8, 13.6, -Math.PI * 0.75);

  // =========================================================================
  // 7. INTERACTIVE OBJECTS: BAZAAR CARDBOARD BOXES
  // =========================================================================
  const addOpenCardboardBox = (id: string, x: number, z: number, yaw: number, size = 0.72) => {
    const boxGroup = new THREE.Group();
    boxGroup.position.set(x, 0, z);
    boxGroup.rotation.y = yaw;
    group.add(boxGroup);

    const h = size * 0.56;
    const wallT = 0.032;

    const sh = new THREE.Mesh(
      track(new THREE.PlaneGeometry(size * 1.45, size * 1.45)),
      shadowDecalMat,
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = 0.022;
    boxGroup.add(sh);

    const bottom = new THREE.Mesh(
      track(new THREE.BoxGeometry(size, wallT, size)),
      cardboardInnerMat,
    );
    bottom.position.y = wallT / 2;
    bottom.receiveShadow = true;
    boxGroup.add(bottom);

    const wallSpecs: [number, number, number, number, number][] = [
      [0, size / 2 - wallT / 2, size, wallT, 0],
      [0, -size / 2 + wallT / 2, size, wallT, 0],
      [size / 2 - wallT / 2, 0, wallT, size - wallT * 2, 1],
      [-size / 2 + wallT / 2, 0, wallT, size - wallT * 2, 1],
    ];

    wallSpecs.forEach(([wx, wz, ww, wd, axis], idx) => {
      const wall = new THREE.Mesh(
        track(new THREE.BoxGeometry(ww, h, wd)),
        cardboardMat,
      );
      wall.position.set(wx, h / 2, wz);
      wall.castShadow = true;
      wall.receiveShadow = true;
      boxGroup.add(wall);

      const flapLen = size * 0.34;
      const flap = new THREE.Mesh(
        track(
          new THREE.BoxGeometry(
            axis === 0 ? size * 0.96 : flapLen,
            0.02,
            axis === 0 ? flapLen : size * 0.96,
          ),
        ),
        cardboardMat,
      );
      const dir = idx % 2 === 0 ? 1 : -1;
      if (axis === 0) {
        flap.position.set(0, h + 0.02, wz + dir * flapLen * 0.45);
        flap.rotation.x = dir * 0.55;
      } else {
        flap.position.set(wx + dir * flapLen * 0.45, h + 0.02, 0);
        flap.rotation.z = -dir * 0.55;
      }
      flap.castShadow = true;
      boxGroup.add(flap);
    });

    const hitMesh = new THREE.Mesh(
      track(new THREE.BoxGeometry(size + 0.2, h + 0.2, size + 0.2)),
      track(new THREE.MeshBasicMaterial({ visible: false })),
    );
    hitMesh.position.y = h / 2;
    hitMesh.userData.interactableId = id;
    boxGroup.add(hitMesh);
    raycastTargets.push(hitMesh);

    interactables.push({
      id,
      kind: 'open-box',
      label: 'Bazaar Carton',
      actionPrompt: 'Climb into cardboard box',
      group: boxGroup,
      position: new THREE.Vector3(x, 0, z),
      radius: 1.25,
      used: false,
      sitY: wallT,
      sitYaw: yaw,
    });
  };

  const addPushableBox = (id: string, x: number, z: number, yaw: number, size = 0.52) => {
    const boxGroup = new THREE.Group();
    boxGroup.position.set(x, 0, z);
    boxGroup.rotation.y = yaw;
    group.add(boxGroup);

    const sh = new THREE.Mesh(
      track(new THREE.PlaneGeometry(size * 1.5, size * 1.5)),
      shadowDecalMat,
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = 0.022;
    boxGroup.add(sh);

    const boxMesh = new THREE.Mesh(
      track(new THREE.BoxGeometry(size, size * 0.85, size)),
      cardboardMat,
    );
    boxMesh.position.y = (size * 0.85) / 2;
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    boxGroup.add(boxMesh);

    const hitMesh = new THREE.Mesh(
      track(new THREE.BoxGeometry(size + 0.2, size + 0.2, size + 0.2)),
      track(new THREE.MeshBasicMaterial({ visible: false })),
    );
    hitMesh.position.y = size / 2;
    hitMesh.userData.interactableId = id;
    boxGroup.add(hitMesh);
    raycastTargets.push(hitMesh);

    interactables.push({
      id,
      kind: 'push-box',
      label: 'Kirana Parcel Box',
      actionPrompt: 'Push / bat parcel box',
      group: boxGroup,
      position: new THREE.Vector3(x, 0, z),
      radius: 1.15,
      used: false,
      velocity: new THREE.Vector3(),
      angularVelocity: new THREE.Vector3(),
    });
  };

  addOpenCardboardBox('box-open-1', -7.8, 0.6, 0.35, 0.72);
  addOpenCardboardBox('box-open-2', -8.4, 11.2, -0.45, 0.76);
  addOpenCardboardBox('box-open-3', 2.4, 16.2, 0.2, 0.7);

  addPushableBox('box-push-1', -6.8, 1.8, 0.2, 0.5);
  addPushableBox('box-push-2', -7.4, 12.6, -0.3, 0.48);
  addPushableBox('box-push-3', -4.2, -4.6, 0.5, 0.54);

  // =========================================================================
  // 8. INTERACTIVE OBJECTS: MUNICIPAL BLUE/GREEN BINS & ALLEY DUSTBINS
  // =========================================================================
  const fishboneMat = track(new THREE.MeshStandardMaterial({ color: '#ece6da', roughness: 0.6 }));
  const paperMat = track(new THREE.MeshStandardMaterial({ color: '#e6decb', roughness: 0.9 }));

  const addTrashCan = (
    id: string,
    x: number,
    z: number,
    style: 'alley' | 'green' | 'blue',
  ) => {
    const canGroup = new THREE.Group();
    canGroup.position.set(x, 0, z);
    group.add(canGroup);

    const sh = new THREE.Mesh(track(new THREE.PlaneGeometry(1.1, 1.1)), shadowDecalMat);
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = 0.022;
    canGroup.add(sh);

    const tipGroup = new THREE.Group();
    tipGroup.name = 'CanBody';
    canGroup.add(tipGroup);

    const mat =
      style === 'alley' ? metalCanMat : style === 'green' ? greenBinMat : blueBinMat;

    const canBody = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.28, 0.23, 0.72, 20)),
      mat,
    );
    canBody.position.y = 0.36;
    canBody.castShadow = true;
    canBody.receiveShadow = true;
    tipGroup.add(canBody);

    const topRim = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.285, 0.022, 8, 22)),
      mat,
    );
    topRim.rotation.x = Math.PI / 2;
    topRim.position.y = 0.72;
    tipGroup.add(topRim);

    const liner = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.25, 0.22, 0.08, 16)),
      darkMetalMat,
    );
    liner.position.y = 0.7;
    tipGroup.add(liner);

    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.75, 0);
    canGroup.add(lidGroup);

    const lidDisk = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.3, 0.31, 0.06, 20)),
      mat,
    );
    lidDisk.castShadow = true;
    lidGroup.add(lidDisk);

    const lidHandle = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.065, 0.015, 8, 14, Math.PI)),
      mat,
    );
    lidHandle.position.y = 0.03;
    lidGroup.add(lidHandle);

    const extraItems: { mesh: THREE.Object3D; vel: THREE.Vector3; active: boolean }[] = [];

    const fishGroup = new THREE.Group();
    fishGroup.position.set(x, 0.2, z);
    fishGroup.visible = false;
    group.add(fishGroup);
    const spine = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.015, 0.012, 0.22, 6)),
      fishboneMat,
    );
    spine.rotation.z = Math.PI / 2;
    fishGroup.add(spine);
    for (let r = -0.06; r <= 0.06; r += 0.04) {
      const rib = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.008, 0.008, 0.11, 5)),
        fishboneMat,
      );
      rib.position.x = r;
      fishGroup.add(rib);
    }
    extraItems.push({ mesh: fishGroup, vel: new THREE.Vector3(), active: false });

    for (let p = 0; p < 2; p++) {
      const paper = new THREE.Mesh(
        track(new THREE.DodecahedronGeometry(0.065, 0)),
        paperMat,
      );
      paper.position.set(x, 0.2, z);
      paper.visible = false;
      paper.castShadow = true;
      group.add(paper);
      extraItems.push({ mesh: paper, vel: new THREE.Vector3(), active: false });
    }

    const hitMesh = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.42, 0.42, 0.9, 10)),
      track(new THREE.MeshBasicMaterial({ visible: false })),
    );
    hitMesh.position.y = 0.45;
    hitMesh.userData.interactableId = id;
    canGroup.add(hitMesh);
    raycastTargets.push(hitMesh);

    interactables.push({
      id,
      kind: 'trash-can',
      label: style === 'alley' ? 'Metal Dustbin' : 'Municipal Bin',
      actionPrompt: 'Swat & tip trash bin',
      group: canGroup,
      position: new THREE.Vector3(x, 0, z),
      radius: 1.25,
      used: false,
      lidMesh: lidGroup,
      lidVelocity: new THREE.Vector3(),
      lidAngularVel: new THREE.Vector3(),
      tipAngle: 0,
      tipTarget: 0,
      tipAxis: new THREE.Vector3(1, 0, 0),
      extraItems,
    });
  };

  addTrashCan('can-1', -10.2, -3.6, 'alley');
  addTrashCan('can-2', -10.4, 5.4, 'blue');
  addTrashCan('can-3', -10.2, 16.0, 'alley');
  addTrashCan('can-4', 3.2, -4.6, 'green');
  addTrashCan('can-5', 17.5, 9.0, 'blue');

  // =========================================================================
  // 9. PLAYABLE EXTRAS: CRICKET / YARN BALLS & CHAI TAPRI KULHAD CUP
  // =========================================================================
  const addYarnBall = (id: string, x: number, z: number, color: string, label: string) => {
    const yGroup = new THREE.Group();
    yGroup.position.set(x, 0, z);
    group.add(yGroup);

    const ballMat = track(
      new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.05 }),
    );
    const ball = new THREE.Mesh(track(new THREE.SphereGeometry(0.18, 18, 16)), ballMat);
    ball.position.y = 0.18;
    ball.castShadow = true;
    yGroup.add(ball);

    const seam = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.182, 0.012, 6, 20)),
      markingMat,
    );
    seam.position.y = 0.18;
    seam.rotation.set(0.6, 0.4, 0.2);
    yGroup.add(seam);

    const hitMesh = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.32, 8, 8)),
      track(new THREE.MeshBasicMaterial({ visible: false })),
    );
    hitMesh.position.y = 0.2;
    hitMesh.userData.interactableId = id;
    yGroup.add(hitMesh);
    raycastTargets.push(hitMesh);

    interactables.push({
      id,
      kind: 'yarn-ball',
      label,
      actionPrompt: `Bat ${label.toLowerCase()}`,
      group: yGroup,
      position: new THREE.Vector3(x, 0, z),
      radius: 1.0,
      used: false,
      velocity: new THREE.Vector3(),
      angularVelocity: new THREE.Vector3(),
    });
  };

  addYarnBall('yarn-1', 6.5, 7.2, '#b91c1c', 'Cricket Ball');
  addYarnBall('yarn-2', -3.4, 3.2, '#e3a63b', 'Yarn Ball');

  // Chai Tapri Wooden Table with Terracotta Kulhad Cup!
  const chaiTableGroup = new THREE.Group();
  chaiTableGroup.position.set(-9.4, 0, -1.2);
  group.add(chaiTableGroup);

  const tableBase = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.26, 0.34, 0.06, 16)),
    darkMetalMat,
  );
  tableBase.position.y = 0.03;
  chaiTableGroup.add(tableBase);
  const tableStem = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 10)),
    darkMetalMat,
  );
  tableStem.position.y = 0.36;
  chaiTableGroup.add(tableStem);
  const tableTop = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.46, 0.46, 0.04, 22)),
    woodMat,
  );
  tableTop.position.y = 0.72;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  chaiTableGroup.add(tableTop);

  platforms.push({
    id: 'cafe-table',
    minX: -9.85,
    maxX: -8.95,
    minZ: -1.65,
    maxZ: -0.75,
    topY: 0.74,
    surfaceType: 'wood',
  });

  // Terracotta Kulhad Chai Cup on the table
  const cupGroup = new THREE.Group();
  cupGroup.position.set(-9.25, 0.74, -1.1);
  group.add(cupGroup);
  const kulhadMat = track(
    new THREE.MeshStandardMaterial({ color: '#b85c38', roughness: 0.85 }),
  );
  const cupMesh = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.068, 0.045, 0.14, 14)),
    kulhadMat,
  );
  cupMesh.position.y = 0.07;
  cupMesh.castShadow = true;
  cupGroup.add(cupMesh);
  const cupHit = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.24, 8, 8)),
    track(new THREE.MeshBasicMaterial({ visible: false })),
  );
  cupHit.userData.interactableId = 'cafe-cup-1';
  cupGroup.add(cupHit);
  raycastTargets.push(cupHit);

  interactables.push({
    id: 'cafe-cup-1',
    kind: 'cafe-cup',
    label: 'Kulhad Chai Cup',
    actionPrompt: 'Knock kulhad cup off table',
    group: cupGroup,
    position: new THREE.Vector3(-9.25, 0.74, -1.1),
    radius: 1.15,
    used: false,
    velocity: new THREE.Vector3(),
    angularVelocity: new THREE.Vector3(),
  });

  // =========================================================================
  // 10. ANIMATED BUTTERFLIES IN THE PARK
  // =========================================================================
  const butterflyMat = track(
    new THREE.MeshBasicMaterial({ color: '#ffd36b', side: THREE.DoubleSide }),
  );
  const butterflies: {
    pivot: THREE.Group;
    wingL: THREE.Mesh;
    wingR: THREE.Mesh;
    centerX: number;
    centerZ: number;
    phase: number;
  }[] = [];

  for (let i = 0; i < 4; i++) {
    const pivot = new THREE.Group();
    const wingGeo = track(new THREE.PlaneGeometry(0.11, 0.08));
    const wingL = new THREE.Mesh(wingGeo, butterflyMat);
    wingL.position.x = 0.055;
    const wingR = new THREE.Mesh(wingGeo, butterflyMat);
    wingR.position.x = -0.055;
    pivot.add(wingL, wingR);
    group.add(pivot);

    butterflies.push({
      pivot,
      wingL,
      wingR,
      centerX: 8 + (i % 2) * 5,
      centerZ: 6 + Math.floor(i / 2) * 6,
      phase: i * 1.7,
    });
  }

  // =========================================================================
  // TIME OF DAY LIGHTING PRESETS (Warm Indian Sunshine, Golden Dusk, Bazaar Night)
  // =========================================================================
  const applyTimeOfDay = (
    preset: TimeOfDay,
    scene: THREE.Scene,
    sunLight: THREE.DirectionalLight,
    hemiLight: THREE.HemisphereLight,
  ) => {
    if (preset === 'morning') {
      const sky = new THREE.Color('#d7e6ee');
      scene.background = sky;
      scene.fog = new THREE.FogExp2('#d7e6ee', 0.011);
      sunLight.color.set('#fff1d0');
      sunLight.intensity = 2.5;
      sunLight.position.set(18, 28, 16);
      hemiLight.color.set('#cce3f8');
      hemiLight.groundColor.set('#685846');
      hemiLight.intensity = 0.95;
      warmGlowMat.emissiveIntensity = 0.25;
    } else if (preset === 'golden') {
      const sky = new THREE.Color('#edb882');
      scene.background = sky;
      scene.fog = new THREE.FogExp2('#edb882', 0.0125);
      sunLight.color.set('#ffb15e');
      sunLight.intensity = 2.65;
      sunLight.position.set(28, 14, -18);
      hemiLight.color.set('#ffd2a1');
      hemiLight.groundColor.set('#523d30');
      hemiLight.intensity = 0.85;
      warmGlowMat.emissiveIntensity = 0.95;
    } else {
      const sky = new THREE.Color('#232d47');
      scene.background = sky;
      scene.fog = new THREE.FogExp2('#232d47', 0.0145);
      sunLight.color.set('#9ab7e8');
      sunLight.intensity = 1.15;
      sunLight.position.set(-18, 22, 18);
      hemiLight.color.set('#5e79ad');
      hemiLight.groundColor.set('#222630');
      hemiLight.intensity = 0.72;
      warmGlowMat.emissiveIntensity = 2.0;
    }
  };

  const _dummy = new THREE.Object3D();

  const update = (dt: number, elapsed: number) => {
    const safeDt = Math.min(dt, 0.05);

    for (let i = 0; i < dropletCount; i++) {
      const phase = (elapsed * 1.15 + i / dropletCount) % 1;
      const angle = (i / dropletCount) * Math.PI * 2 + elapsed * 0.4;
      const r = 0.25 + phase * 1.35;
      const y = 1.82 + phase * 0.85 - phase * phase * 2.25;
      _dummy.position.set(Math.cos(angle) * r, Math.max(0.38, y), Math.sin(angle) * r);
      _dummy.scale.setScalar(0.85 + Math.sin(phase * Math.PI) * 0.5);
      _dummy.updateMatrix();
      droplets.setMatrixAt(i, _dummy.matrix);
    }
    droplets.instanceMatrix.needsUpdate = true;

    fountainWater.position.y = 0.34 + Math.sin(elapsed * 2.6) * 0.008;

    for (const b of butterflies) {
      const t = elapsed * 0.85 + b.phase;
      b.pivot.position.set(
        b.centerX + Math.sin(t) * 1.8,
        0.95 + Math.sin(t * 2.3) * 0.25,
        b.centerZ + Math.cos(t * 0.8) * 1.8,
      );
      b.pivot.rotation.y = Math.atan2(Math.cos(t) * 1.8, -Math.sin(t * 0.8) * 1.6);
      const flap = Math.sin(elapsed * 16 + b.phase) * 0.75;
      b.wingL.rotation.z = flap;
      b.wingR.rotation.z = -flap;
    }

    for (const item of interactables) {
      if (item.kind === 'push-box' || item.kind === 'yarn-ball') {
        if (item.velocity && item.velocity.lengthSq() > 0.0001) {
          item.position.addScaledVector(item.velocity, safeDt);
          item.position.x = THREE.MathUtils.clamp(item.position.x, -10.5, 22.5);
          item.position.z = THREE.MathUtils.clamp(item.position.z, -6.5, 22.5);
          item.group.position.x = item.position.x;
          item.group.position.z = item.position.z;

          if (item.kind === 'yarn-ball') {
            const speed = item.velocity.length();
            item.group.children[1].rotation.x += speed * safeDt * 2.4;
            item.group.children[1].rotation.z -= speed * safeDt * 1.8;
          } else {
            item.group.rotation.y += (item.angularVelocity?.y ?? 0) * safeDt;
          }

          const drag = item.kind === 'yarn-ball' ? 2.2 : 5.5;
          item.velocity.multiplyScalar(Math.exp(-drag * safeDt));
          if (item.angularVelocity) {
            item.angularVelocity.multiplyScalar(Math.exp(-5.5 * safeDt));
          }
        }
      } else if (item.kind === 'trash-can') {
        const tipBody = item.group.getObjectByName('CanBody');
        if (tipBody && item.tipAngle !== undefined && item.tipTarget !== undefined) {
          item.tipAngle = THREE.MathUtils.damp(item.tipAngle, item.tipTarget, 10, safeDt);
          if (item.tipAxis) {
            tipBody.setRotationFromAxisAngle(item.tipAxis, item.tipAngle);
            tipBody.position.y = Math.sin(Math.abs(item.tipAngle)) * 0.25;
          }
        }
        if (item.lidMesh && item.lidVelocity && item.lidAngularVel) {
          if (item.used && (item.lidMesh.position.y > 0.05 || item.lidVelocity.lengthSq() > 0.001)) {
            item.lidVelocity.y -= 14.5 * safeDt;
            item.lidMesh.position.addScaledVector(item.lidVelocity, safeDt);
            item.lidMesh.rotation.x += item.lidAngularVel.x * safeDt;
            item.lidMesh.rotation.z += item.lidAngularVel.z * safeDt;
            if (item.lidMesh.position.y <= 0.04) {
              item.lidMesh.position.y = 0.04;
              item.lidVelocity.y = Math.abs(item.lidVelocity.y) * 0.28;
              if (item.lidVelocity.y < 0.35) item.lidVelocity.y = 0;
              item.lidVelocity.x *= 0.68;
              item.lidVelocity.z *= 0.68;
              item.lidAngularVel.multiplyScalar(0.5);
            }
          }
        }
        if (item.extraItems) {
          for (const extra of item.extraItems) {
            if (!extra.active) continue;
            if (extra.mesh.position.y > 0.05 || extra.vel.lengthSq() > 0.001) {
              extra.vel.y -= 13.5 * safeDt;
              extra.mesh.position.addScaledVector(extra.vel, safeDt);
              extra.mesh.rotation.y += safeDt * 3.5;
              if (extra.mesh.position.y <= 0.045) {
                extra.mesh.position.y = 0.045;
                extra.vel.y = 0;
                extra.vel.x *= 0.62;
                extra.vel.z *= 0.62;
              }
            }
          }
        }
      } else if (item.kind === 'cafe-cup') {
        if (item.used && item.velocity) {
          if (item.position.y > 0.06 || item.velocity.lengthSq() > 0.001) {
            item.velocity.y -= 14.5 * safeDt;
            item.position.addScaledVector(item.velocity, safeDt);
            item.group.position.copy(item.position);
            item.group.rotation.x += safeDt * 5.2;
            item.group.rotation.z += safeDt * 3.4;
            if (item.position.y <= 0.055) {
              item.position.y = 0.055;
              item.group.position.y = 0.055;
              item.velocity.y = 0;
              item.velocity.x *= 0.6;
              item.velocity.z *= 0.6;
            }
          }
        }
      }
    }
  };

  const getProgress = (): WorldProgress => {
    const boxes = interactables.filter(
      (i) => i.kind === 'open-box' || i.kind === 'push-box',
    );
    const cans = interactables.filter((i) => i.kind === 'trash-can');
    const benches = interactables.filter((i) => i.kind === 'park-bench');
    const toys = interactables.filter(
      (i) => i.kind === 'yarn-ball' || i.kind === 'cafe-cup',
    );
    return {
      boxesExplored: boxes.filter((b) => b.used).length,
      totalBoxes: boxes.length,
      cansTipped: cans.filter((c) => c.used).length,
      totalCans: cans.length,
      benchesVisited: benches.filter((b) => b.used).length,
      totalBenches: benches.length,
      toysBatted: toys.filter((t) => t.used).length,
      totalToys: toys.length,
    };
  };

  return {
    group,
    colliders,
    platforms,
    interactables,
    raycastTargets,
    applyTimeOfDay,
    update,
    getProgress,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
