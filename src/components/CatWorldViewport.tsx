import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createRealisticTabbyCat } from '../world/catModel';
import { createCityWorld } from '../world/cityWorld';
import {
  findNearestInteractable,
  resolveGroundHeight,
  resolveHorizontalCollisions,
} from '../world/physics';
import { CatSoundEngine } from '../world/sound';
import { createProceduralTextures } from '../world/textures';
import type {
  CatState,
  HudSnapshot,
  InteractableObject,
  TimeOfDay,
} from '../world/types';

export interface CatWorldActions {
  jump: () => void;
  interact: () => void;
  meow: () => void;
  toggleSit: () => void;
  triggerStretch: () => void;
  resetCat: () => void;
  setMoveInput: (x: number, y: number, sprint?: boolean) => void;
  focusCloseUp: () => void;
}

interface CatWorldViewportProps {
  timeOfDay: TimeOfDay;
  soundEnabled: boolean;
  onHudUpdate: (snapshot: HudSnapshot) => void;
}

// Pre-allocated math helpers outside render loop (zero per-frame GC)
const _camForward = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _moveDir = new THREE.Vector3();
const _desiredCamTarget = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _toItem = new THREE.Vector3();
const _catForward = new THREE.Vector3();
const _pointer = new THREE.Vector2();
const _raycaster = new THREE.Raycaster();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const CatWorldViewport = forwardRef<CatWorldActions, CatWorldViewportProps>(
  function CatWorldViewport({ timeOfDay, soundEnabled, onHudUpdate }, ref) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [contextLost, setContextLost] = useState(false);

    const onHudUpdateRef = useRef(onHudUpdate);
    onHudUpdateRef.current = onHudUpdate;

    const soundRef = useRef<CatSoundEngine | null>(null);
    const timeOfDayRef = useRef<TimeOfDay>(timeOfDay);
    timeOfDayRef.current = timeOfDay;

    const sceneRefs = useRef<{
      scene: THREE.Scene;
      sunLight: THREE.DirectionalLight;
      hemiLight: THREE.HemisphereLight;
      applyTimeOfDay: (
        preset: TimeOfDay,
        scene: THREE.Scene,
        sun: THREE.DirectionalLight,
        hemi: THREE.HemisphereLight,
      ) => void;
      actions: CatWorldActions;
    } | null>(null);

    useEffect(() => {
      if (soundRef.current) {
        soundRef.current.setEnabled(soundEnabled);
      }
    }, [soundEnabled]);

    useEffect(() => {
      if (sceneRefs.current) {
        const { scene, sunLight, hemiLight, applyTimeOfDay } = sceneRefs.current;
        applyTimeOfDay(timeOfDay, scene, sunLight, hemiLight);
      }
    }, [timeOfDay]);

    useImperativeHandle(
      ref,
      () => ({
        jump: () => sceneRefs.current?.actions.jump(),
        interact: () => sceneRefs.current?.actions.interact(),
        meow: () => sceneRefs.current?.actions.meow(),
        toggleSit: () => sceneRefs.current?.actions.toggleSit(),
        triggerStretch: () => sceneRefs.current?.actions.triggerStretch(),
        resetCat: () => sceneRefs.current?.actions.resetCat(),
        setMoveInput: (x, y, sprint) =>
          sceneRefs.current?.actions.setMoveInput(x, y, sprint),
        focusCloseUp: () => sceneRefs.current?.actions.focusCloseUp(),
      }),
      [],
    );

    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      const isSoftwareGl = detectSoftwareWebGL();
      const sound = new CatSoundEngine();
      sound.setEnabled(soundEnabled);
      soundRef.current = sound;

      // Renderer configuration
      const renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.setPixelRatio(
        isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
      );
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.touchAction = 'none';
      container.appendChild(renderer.domElement);

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        setContextLost(true);
      };
      const handleContextRestored = () => {
        setContextLost(false);
      };
      renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.addEventListener(
        'webglcontextrestored',
        handleContextRestored,
      );

      // Scene & Studio Environment Map (PMREM RoomEnvironment)
      const scene = new THREE.Scene();
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      pmremGenerator.dispose();

      // Camera
      const camera = new THREE.PerspectiveCamera(
        50,
        Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
        0.1,
        180,
      );

      // Three-point outdoor sunlight rig (<= 3 shadow casters: 1 directional sun)
      const hemiLight = new THREE.HemisphereLight('#b8dbff', '#5a5448', 0.95);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight('#fff5e0', 2.4);
      sunLight.position.set(18, 28, 16);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 2;
      sunLight.shadow.camera.far = 85;
      const d = 26;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.025;
      scene.add(sunLight);
      scene.add(sunLight.target);

      const rimLight = new THREE.DirectionalLight('#cfe2ff', 0.55);
      rimLight.position.set(-16, 10, -14);
      scene.add(rimLight);

      // Procedural Textures, World & Hero Cat
      const textures = createProceduralTextures(renderer);
      const world = createCityWorld(textures);
      scene.add(world.group);

      world.applyTimeOfDay(timeOfDayRef.current, scene, sunLight, hemiLight);

      const cat = createRealisticTabbyCat(textures);
      scene.add(cat.group);

      // Initial cat placement: cozy sidewalk edge facing diagonally toward plaza & camera
      const catPos = new THREE.Vector3(-4.2, 0, 1.4);
      let catYaw = 0.72;
      let catVelY = 0;
      let catSpeed = 0;
      let isGrounded = true;
      let currentPlatformId: string | null = null;

      // Posture & interaction state
      let poseOverride: 'none' | 'sit' | 'stretch' | 'inBox' = 'none';
      let activeBox: InteractableObject | null = null;
      let idleSeconds = 0;
      let swatTimer = 0;
      let stretchTimer = 0;
      let purrTimer = 0;
      let statusMessage: string | null = null;
      let statusMessageTimer = 0;

      // Camera orbit state (spherical offsets around cat)
      let camYaw = 2.65;
      let camPitch = 0.28;
      let camDist = 3.15;
      let targetCamDist = 3.15;
      const camPosCurrent = new THREE.Vector3(-1.8, 1.45, 3.8);
      const camTargetCurrent = new THREE.Vector3(-4.2, 0.35, 1.4);
      camera.position.copy(camPosCurrent);
      camera.lookAt(camTargetCurrent);

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      // Keyboard & pointer controls
      const keys: Record<string, boolean> = {};
      let virtualMoveX = 0;
      let virtualMoveY = 0;
      let virtualSprint = false;

      let isDragging = false;
      let dragMoved = false;
      let lastPointerX = 0;
      let lastPointerY = 0;

      const showBanner = (msg: string, duration = 2.6) => {
        statusMessage = msg;
        statusMessageTimer = duration;
      };

      const performJump = () => {
        sound.unlock();
        if (poseOverride === 'inBox' && activeBox) {
          // Hop cleanly out of box
          poseOverride = 'none';
          catPos.x = activeBox.position.x + Math.sin(catYaw) * 0.75;
          catPos.z = activeBox.position.z + Math.cos(catYaw) * 0.75;
          activeBox = null;
          catVelY = 4.6;
          isGrounded = false;
          sound.playJump();
          return;
        }
        poseOverride = 'none';
        if (isGrounded) {
          catVelY = 5.4;
          isGrounded = false;
          sound.playJump();
        }
      };

      const performInteractWith = (item: InteractableObject | null) => {
        sound.unlock();
        if (!item) {
          // Friendly air swat
          swatTimer = 0.38;
          sound.playMeow('chirp');
          return;
        }

        // Face the object smoothly
        const dx = item.position.x - catPos.x;
        const dz = item.position.z - catPos.z;
        if (dx * dx + dz * dz > 0.001) {
          catYaw = Math.atan2(dx, dz);
        }

        if (item.kind === 'open-box') {
          if (poseOverride === 'inBox' && activeBox?.id === item.id) {
            performJump();
            return;
          }
          poseOverride = 'inBox';
          activeBox = item;
          catPos.set(item.position.x, item.sitY ?? 0.04, item.position.z);
          catVelY = 0;
          isGrounded = true;
          item.used = true;
          purrTimer = 2.5;
          sound.playCardboardThud();
          sound.playPurrBurst();
          showBanner('Curled up inside the cardboard box!');
        } else if (item.kind === 'push-box') {
          poseOverride = 'none';
          swatTimer = 0.35;
          const pushDirX = dx || Math.sin(catYaw);
          const pushDirZ = dz || Math.cos(catYaw);
          const len = Math.max(0.01, Math.hypot(pushDirX, pushDirZ));
          if (item.velocity) {
            item.velocity.set((pushDirX / len) * 3.4, 0, (pushDirZ / len) * 3.4);
          }
          if (item.angularVelocity) {
            item.angularVelocity.y = (Math.random() - 0.5) * 4.5;
          }
          item.used = true;
          sound.playCardboardThud();
          showBanner('Shoved the delivery box across the sidewalk!');
        } else if (item.kind === 'trash-can') {
          poseOverride = 'none';
          swatTimer = 0.42;
          if (!item.used) {
            item.used = true;
            const len = Math.max(0.01, Math.hypot(dx, dz));
            const dirX = dx / len;
            const dirZ = dz / len;
            // Tip axis perpendicular to push direction on XZ plane
            item.tipAxis?.set(-dirZ, 0, dirX).normalize();
            item.tipTarget = Math.PI * 0.48;
            if (item.lidVelocity && item.lidAngularVel) {
              item.lidVelocity.set(dirX * 2.4, 3.6, dirZ * 2.4);
              item.lidAngularVel.set(3.5, 1.5, -2.5);
            }
            if (item.extraItems) {
              item.extraItems.forEach((extra, idx) => {
                extra.active = true;
                extra.mesh.visible = true;
                extra.mesh.position.set(
                  item.position.x + dirX * 0.25,
                  0.45,
                  item.position.z + dirZ * 0.25,
                );
                const spread = (idx - 1) * 0.55;
                extra.vel.set(
                  dirX * (2.1 + idx * 0.4) - dirZ * spread,
                  2.4 + idx * 0.35,
                  dirZ * (2.1 + idx * 0.4) + dirX * spread,
                );
              });
            }
            sound.playTrashClatter();
            showBanner('Knocked over the trash can — fishbone treasure!');
          } else {
            // Upright the trash can again
            item.used = false;
            item.tipTarget = 0;
            if (item.lidMesh && item.lidVelocity && item.lidAngularVel) {
              item.lidMesh.position.set(0, 0.75, 0);
              item.lidMesh.rotation.set(0, 0, 0);
              item.lidVelocity.set(0, 0, 0);
              item.lidAngularVel.set(0, 0, 0);
            }
            sound.playTrashClatter();
            showBanner('Stood the trash can back upright');
          }
        } else if (item.kind === 'park-bench') {
          poseOverride = 'none';
          if (currentPlatformId === item.id) {
            // Already on bench -> sit & purr or stretch!
            poseOverride = 'sit';
            purrTimer = 2.0;
            sound.playPurrBurst();
            showBanner('Lounging on the sunny park bench');
          } else if (item.benchOrigin) {
            // Leap cleanly onto the park bench seat!
            const seatSpotX = THREE.MathUtils.lerp(catPos.x, item.benchOrigin.x, 0.78);
            const seatSpotZ = THREE.MathUtils.lerp(catPos.z, item.benchOrigin.z, 0.78);
            catPos.set(seatSpotX, 0.52, seatSpotZ);
            catVelY = 2.4;
            isGrounded = false;
            item.used = true;
            sound.playJump();
            sound.playMeow('happy');
            showBanner('Leapt onto the park bench!');
          }
        } else if (item.kind === 'yarn-ball') {
          poseOverride = 'none';
          swatTimer = 0.35;
          const len = Math.max(0.01, Math.hypot(dx, dz));
          if (item.velocity) {
            item.velocity.set((dx / len) * 5.2, 0, (dz / len) * 5.2);
          }
          item.used = true;
          sound.playMeow('chirp');
          showBanner(`Batted the ${item.label.toLowerCase()}!`);
        } else if (item.kind === 'cafe-cup') {
          poseOverride = 'none';
          swatTimer = 0.4;
          if (!item.used && item.velocity) {
            item.used = true;
            item.velocity.set(1.8, 1.4, -0.9);
            sound.playCardboardThud();
            sound.playMeow('chirp');
            showBanner('Classic cat move: knocked the kulhad chai cup off the table!');
          }
        }
      };

      const actions: CatWorldActions = {
        jump: performJump,
        interact: () => {
          const nearest = findNearestInteractable(catPos, world.interactables);
          performInteractWith(nearest);
        },
        meow: () => {
          sound.unlock();
          sound.playMeow(Math.random() > 0.5 ? 'hello' : 'happy');
          cat.triggerBlink();
          showBanner('Meow!');
        },
        toggleSit: () => {
          sound.unlock();
          if (poseOverride === 'inBox') {
            performJump();
            return;
          }
          poseOverride = poseOverride === 'sit' ? 'none' : 'sit';
          if (poseOverride === 'sit') {
            purrTimer = 1.6;
            sound.playPurrBurst();
          }
        },
        triggerStretch: () => {
          sound.unlock();
          if (poseOverride === 'inBox') return;
          poseOverride = 'stretch';
          stretchTimer = 1.5;
          sound.playMeow('chirp');
        },
        resetCat: () => {
          poseOverride = 'none';
          activeBox = null;
          catPos.set(-4.2, 0, 1.4);
          catVelY = 0;
          catSpeed = 0;
          catYaw = 0.72;
          isGrounded = true;
          targetCamDist = 3.15;
          camYaw = 2.65;
          camPitch = 0.28;
          showBanner('Returned to bazaar square');
        },
        setMoveInput: (x, y, sprint = false) => {
          virtualMoveX = x;
          virtualMoveY = y;
          virtualSprint = sprint;
        },
        focusCloseUp: () => {
          // Frame the cat nicely at close-up portrait distance
          targetCamDist = targetCamDist < 1.8 ? 3.2 : 1.35;
          camPitch = targetCamDist < 1.8 ? 0.14 : 0.28;
          camYaw = catYaw + 0.25;
        },
      };

      sceneRefs.current = {
        scene,
        sunLight,
        hemiLight,
        applyTimeOfDay: world.applyTimeOfDay,
        actions,
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (
          ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
            e.code,
          )
        ) {
          e.preventDefault();
        }
        keys[e.code] = true;
        sound.unlock();

        if (e.repeat) return;
        if (e.code === 'Space') actions.jump();
        else if (e.code === 'KeyE') actions.interact();
        else if (e.code === 'KeyF' || e.code === 'KeyM') actions.meow();
        else if (e.code === 'KeyC') actions.toggleSit();
        else if (e.code === 'KeyX') actions.triggerStretch();
        else if (e.code === 'KeyR') actions.resetCat();
      };

      const onKeyUp = (e: KeyboardEvent) => {
        keys[e.code] = false;
      };

      const onPointerDown = (e: PointerEvent) => {
        sound.unlock();
        isDragging = true;
        dragMoved = false;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;

        camYaw -= dx * 0.0065;
        camPitch = THREE.MathUtils.clamp(camPitch + dy * 0.0055, 0.05, 1.18);
      };

      const onPointerUp = (e: PointerEvent) => {
        if (isDragging && !dragMoved) {
          // Click raycast on interactive objects!
          const rect = renderer.domElement.getBoundingClientRect();
          _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          _raycaster.setFromCamera(_pointer, camera);
          const hits = _raycaster.intersectObjects(world.raycastTargets, false);
          if (hits.length > 0) {
            const hitId = hits[0].object.userData.interactableId as string | undefined;
            const targetItem = world.interactables.find((it) => it.id === hitId) ?? null;
            if (targetItem) {
              const dist = Math.hypot(
                targetItem.position.x - catPos.x,
                targetItem.position.z - catPos.z,
              );
              if (dist <= targetItem.radius + 1.4) {
                performInteractWith(targetItem);
              } else {
                showBanner(`Walk closer to ${targetItem.label} to interact!`);
              }
            }
          }
        }
        isDragging = false;
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        targetCamDist = THREE.MathUtils.clamp(
          targetCamDist + e.deltaY * 0.0025,
          1.15,
          9.5,
        );
      };

      const onResize = () => {
        if (!container) return;
        const w = Math.max(1, container.clientWidth);
        const h = Math.max(1, container.clientHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('resize', onResize);
      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

      // Animation loop with Software WebGL pacing
      const clock = new THREE.Clock();
      let frameId = 0;
      let disposed = false;
      let hudAccumulator = 0;

      function afterDraw(cb: () => void) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      }

      const tick = () => {
        if (disposed) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.elapsedTime;

        // Read directional input relative to current camera yaw
        const inputForward =
          (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) -
          (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0) +
          virtualMoveY;
        const inputRight =
          (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) -
          (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0) +
          virtualMoveX;
        const isSprinting =
          Boolean(keys['ShiftLeft'] || keys['ShiftRight']) || virtualSprint;

        const hasMoveInput =
          Math.abs(inputForward) > 0.05 || Math.abs(inputRight) > 0.05;

        if (hasMoveInput) {
          if (poseOverride === 'inBox' && activeBox) {
            // Moving exits the box cleanly
            poseOverride = 'none';
            catPos.x = activeBox.position.x + Math.sin(catYaw) * 0.68;
            catPos.z = activeBox.position.z + Math.cos(catYaw) * 0.68;
            activeBox = null;
          } else if (poseOverride === 'sit' || poseOverride === 'stretch') {
            poseOverride = 'none';
          }
          idleSeconds = 0;

          // Compute camera-relative ground movement direction
          _camForward.set(-Math.sin(camYaw), 0, -Math.cos(camYaw)).normalize();
          _camRight.set(Math.cos(camYaw), 0, -Math.sin(camYaw)).normalize();
          _moveDir
            .set(0, 0, 0)
            .addScaledVector(_camForward, inputForward)
            .addScaledVector(_camRight, inputRight);
          if (_moveDir.lengthSq() > 1e-4) {
            _moveDir.normalize();
          }

          const targetSpeed = isSprinting ? 5.6 : 2.35;
          catSpeed = THREE.MathUtils.damp(catSpeed, targetSpeed, 10, dt);

          // Smoothly steer cat yaw toward movement direction
          const desiredYaw = Math.atan2(_moveDir.x, _moveDir.z);
          let deltaYaw = desiredYaw - catYaw;
          while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
          while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
          catYaw += deltaYaw * (1 - Math.exp(-12 * dt));

          catPos.x += _moveDir.x * catSpeed * dt;
          catPos.z += _moveDir.z * catSpeed * dt;

          if (isGrounded) {
            sound.playStep(isSprinting);
          }
        } else {
          catSpeed = THREE.MathUtils.damp(catSpeed, 0, 12, dt);
          if (isGrounded && poseOverride === 'none') {
            idleSeconds += dt;
          }
        }

        // Gravity & platform elevation resolution
        const groundInfo = resolveGroundHeight(
          catPos.x,
          catPos.z,
          catPos.y,
          world.platforms,
        );
        currentPlatformId = groundInfo.platformId;

        if (!isGrounded || catPos.y > groundInfo.groundY + 0.01) {
          catVelY -= 15.5 * dt;
          catPos.y += catVelY * dt;
          if (catPos.y <= groundInfo.groundY) {
            catPos.y = groundInfo.groundY;
            catVelY = 0;
            isGrounded = true;
          }
        } else {
          catPos.y = groundInfo.groundY;
          catVelY = 0;
          isGrounded = true;
        }

        // Resolve collisions (when not curled inside a box)
        if (poseOverride !== 'inBox') {
          resolveHorizontalCollisions(
            catPos,
            world.colliders,
            world.interactables,
          );
        }

        // Mark bench visited automatically when walking/jumping onto a bench
        if (currentPlatformId && currentPlatformId.startsWith('bench-')) {
          const benchItem = world.interactables.find(
            (i) => i.id === currentPlatformId,
          );
          if (benchItem && !benchItem.used) {
            benchItem.used = true;
          }
        }

        // Timers
        if (swatTimer > 0) swatTimer = Math.max(0, swatTimer - dt);
        if (purrTimer > 0) purrTimer = Math.max(0, purrTimer - dt);
        if (stretchTimer > 0) {
          stretchTimer = Math.max(0, stretchTimer - dt);
          if (stretchTimer === 0 && poseOverride === 'stretch') {
            poseOverride = 'none';
          }
        }
        if (statusMessageTimer > 0) {
          statusMessageTimer = Math.max(0, statusMessageTimer - dt);
          if (statusMessageTimer === 0) statusMessage = null;
        }

        // Determine cat animation state
        let catState: CatState = 'idle';
        if (!isGrounded) catState = 'jump';
        else if (poseOverride === 'inBox') catState = 'inBox';
        else if (poseOverride === 'stretch') catState = 'stretch';
        else if (poseOverride === 'sit' || idleSeconds > 5.5) catState = 'sit';
        else if (catSpeed > 3.2) catState = 'run';
        else if (catSpeed > 0.18) catState = 'walk';
        else if (swatTimer > 0) catState = 'swat';

        // Nearest interactable & subtle curious head tracking
        const nearest = findNearestInteractable(catPos, world.interactables);
        let headYawOffset = 0;
        let headPitchOffset = 0;

        if (nearest && catSpeed < 0.8) {
          _toItem.set(
            nearest.position.x - catPos.x,
            0,
            nearest.position.z - catPos.z,
          );
          if (_toItem.lengthSq() > 0.04) {
            _toItem.normalize();
            _catForward.set(Math.sin(catYaw), 0, Math.cos(catYaw));
            const crossY =
              _catForward.z * _toItem.x - _catForward.x * _toItem.z;
            const dot = _catForward.dot(_toItem);
            if (dot > -0.25) {
              headYawOffset = THREE.MathUtils.clamp(crossY * 0.9, -0.65, 0.65);
            }
            headPitchOffset = nearest.position.y > catPos.y + 0.25 ? -0.22 : 0.12;
          }
        } else if (catState === 'idle' || catState === 'sit') {
          headYawOffset = Math.sin(elapsed * 0.65) * 0.24;
        }

        // Apply transforms to cat rig
        cat.group.position.copy(catPos);
        cat.group.rotation.y = catYaw;

        // Ground contact shadow height & opacity scales gently when jumping
        const heightAboveGround = Math.max(0, catPos.y - groundInfo.groundY);
        cat.contactShadow.position.y = 0.012 - heightAboveGround;
        const shadowScale = Math.max(0.45, 1 - heightAboveGround * 0.45);
        cat.contactShadow.scale.setScalar(shadowScale);
        (cat.contactShadow.material as THREE.MeshBasicMaterial).opacity =
          0.46 * shadowScale;

        cat.update(dt, elapsed, {
          state: catState,
          speed: catSpeed,
          verticalVelocity: catVelY,
          isGrounded,
          headYawOffset,
          headPitchOffset,
          swatTimer,
          stretchTimer,
          isPurring: purrTimer > 0 || poseOverride === 'inBox',
        });

        // Update animated world props & physics
        world.update(dt, elapsed);

        // Smooth camera follow + dynamic FOV cue when sprinting
        const targetFov = catState === 'run' ? 56 : 50;
        if (Math.abs(camera.fov - targetFov) > 0.05) {
          camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 7, dt);
          camera.updateProjectionMatrix();
        }

        camDist = THREE.MathUtils.damp(camDist, targetCamDist, 9, dt);
        _desiredCamTarget.set(catPos.x, catPos.y + 0.34, catPos.z);
        camTargetCurrent.x = THREE.MathUtils.damp(
          camTargetCurrent.x,
          _desiredCamTarget.x,
          10,
          dt,
        );
        camTargetCurrent.y = THREE.MathUtils.damp(
          camTargetCurrent.y,
          _desiredCamTarget.y,
          10,
          dt,
        );
        camTargetCurrent.z = THREE.MathUtils.damp(
          camTargetCurrent.z,
          _desiredCamTarget.z,
          10,
          dt,
        );

        const horizDist = Math.cos(camPitch) * camDist;
        const vertDist = Math.sin(camPitch) * camDist;
        _desiredCamPos.set(
          camTargetCurrent.x + Math.sin(camYaw) * horizDist,
          Math.max(0.28, camTargetCurrent.y + vertDist),
          camTargetCurrent.z + Math.cos(camYaw) * horizDist,
        );

        camPosCurrent.x = THREE.MathUtils.damp(camPosCurrent.x, _desiredCamPos.x, 10, dt);
        camPosCurrent.y = THREE.MathUtils.damp(camPosCurrent.y, _desiredCamPos.y, 10, dt);
        camPosCurrent.z = THREE.MathUtils.damp(camPosCurrent.z, _desiredCamPos.z, 10, dt);

        camera.position.copy(camPosCurrent);
        camera.lookAt(camTargetCurrent);

        // Keep directional shadow frustum centered near cat for crisp local shadows
        sunLight.target.position.set(catPos.x, 0, catPos.z);

        renderer.render(scene, camera);

        // Throttled HUD snapshot push (~10Hz so React state never churns at 60fps)
        hudAccumulator += dt;
        if (hudAccumulator >= 0.1) {
          hudAccumulator = 0;
          let nearbyPrompt: string | null = null;
          if (poseOverride === 'inBox' && activeBox) {
            nearbyPrompt = '[Space / E] Hop out of cardboard box';
          } else if (nearest) {
            if (nearest.kind === 'trash-can' && nearest.used) {
              nearbyPrompt = '[E] Upright trash can';
            } else if (
              nearest.kind === 'park-bench' &&
              currentPlatformId === nearest.id
            ) {
              nearbyPrompt = '[E] Lounge on park bench';
            } else {
              nearbyPrompt = `[E] ${nearest.actionPrompt}`;
            }
          }

          onHudUpdateRef.current({
            catState,
            speed: catSpeed,
            isGrounded,
            nearbyPrompt,
            nearbyKind: nearest?.kind ?? null,
            statusMessage,
            progress: world.getProgress(),
          });
        }

        if (isSoftwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
      };

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('wheel', onWheel);
        renderer.domElement.removeEventListener(
          'webglcontextlost',
          handleContextLost,
        );
        renderer.domElement.removeEventListener(
          'webglcontextrestored',
          handleContextRestored,
        );

        cat.dispose();
        world.dispose();
        textures.dispose();
        envRT.dispose();
        sound.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      };
    }, []);

    return (
      <div className="relative w-full h-full">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        {contextLost && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 text-slate-100 p-6">
            <div className="max-w-sm text-center space-y-2">
              <p className="text-base font-semibold">3D Graphics Context Paused</p>
              <p className="text-sm text-slate-400">
                WebGL is restoring the city scene. Reload if the viewport remains paused.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  },
);
