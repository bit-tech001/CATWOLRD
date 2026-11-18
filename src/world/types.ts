import * as THREE from 'three';

export type CatState =
  | 'idle'
  | 'sit'
  | 'walk'
  | 'run'
  | 'jump'
  | 'stretch'
  | 'swat'
  | 'inBox';

export type TimeOfDay = 'morning' | 'golden' | 'twilight';

export type InteractableKind =
  | 'open-box'
  | 'push-box'
  | 'trash-can'
  | 'park-bench'
  | 'yarn-ball'
  | 'cafe-cup';

export interface ColliderBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  maxY: number;
  id?: string;
}

export interface WalkablePlatform {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  topY: number;
  surfaceType: 'wood' | 'stone' | 'cardboard';
}

export interface InteractableObject {
  id: string;
  kind: InteractableKind;
  label: string;
  actionPrompt: string;
  group: THREE.Group;
  position: THREE.Vector3;
  radius: number;
  used: boolean;
  // Optional sub-parts and physics state
  velocity?: THREE.Vector3;
  angularVelocity?: THREE.Vector3;
  lidMesh?: THREE.Object3D;
  lidVelocity?: THREE.Vector3;
  lidAngularVel?: THREE.Vector3;
  tipAngle?: number;
  tipTarget?: number;
  tipAxis?: THREE.Vector3;
  sitY?: number;
  sitYaw?: number;
  benchOrigin?: THREE.Vector3;
  benchYaw?: number;
  extraItems?: {
    mesh: THREE.Object3D;
    vel: THREE.Vector3;
    active: boolean;
  }[];
}

export interface WorldProgress {
  boxesExplored: number;
  totalBoxes: number;
  cansTipped: number;
  totalCans: number;
  benchesVisited: number;
  totalBenches: number;
  toysBatted: number;
  totalToys: number;
}

export interface HudSnapshot {
  catState: CatState;
  speed: number;
  isGrounded: boolean;
  nearbyPrompt: string | null;
  nearbyKind: InteractableKind | null;
  statusMessage: string | null;
  progress: WorldProgress;
}
