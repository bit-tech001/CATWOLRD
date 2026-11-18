import * as THREE from 'three';
import type {
  ColliderBox,
  InteractableObject,
  WalkablePlatform,
} from './types';

const CAT_RADIUS = 0.24;

export const WORLD_BOUNDS = {
  minX: -10.9,
  maxX: 23.5,
  minZ: -17.2,
  maxZ: 23.5,
};

export function resolveGroundHeight(
  x: number,
  z: number,
  currentY: number,
  platforms: WalkablePlatform[],
): { groundY: number; surfaceType: 'ground' | 'wood' | 'stone' | 'cardboard'; platformId: string | null } {
  let highest = 0;
  let surfaceType: 'ground' | 'wood' | 'stone' | 'cardboard' = 'ground';
  let platformId: string | null = null;

  for (const p of platforms) {
    if (
      x >= p.minX - 0.08 &&
      x <= p.maxX + 0.08 &&
      z >= p.minZ - 0.08 &&
      z <= p.maxZ + 0.08
    ) {
      // Allow landing on top if cat is near or above platform height
      if (currentY >= p.topY - 0.16 && p.topY > highest) {
        highest = p.topY;
        surfaceType = p.surfaceType;
        platformId = p.id;
      }
    }
  }

  return { groundY: highest, surfaceType, platformId };
}

export function resolveHorizontalCollisions(
  pos: THREE.Vector3,
  colliders: ColliderBox[],
  interactables: InteractableObject[],
): void {
  // Clamp playable neighborhood perimeter
  pos.x = THREE.MathUtils.clamp(pos.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
  pos.z = THREE.MathUtils.clamp(pos.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);

  // Resolve static colliders (buildings, tree trunks, fountain center, streetlights)
  for (const box of colliders) {
    if (pos.y >= box.maxY - 0.05) continue;

    const closestX = THREE.MathUtils.clamp(pos.x, box.minX, box.maxX);
    const closestZ = THREE.MathUtils.clamp(pos.z, box.minZ, box.maxZ);
    const dx = pos.x - closestX;
    const dz = pos.z - closestZ;
    const distSq = dx * dx + dz * dz;

    if (distSq < CAT_RADIUS * CAT_RADIUS) {
      if (distSq > 1e-6) {
        const dist = Math.sqrt(distSq);
        const overlap = CAT_RADIUS - dist;
        pos.x += (dx / dist) * overlap;
        pos.z += (dz / dist) * overlap;
      } else {
        // Inside box center fallback: push out along shallowest axis
        const dLeft = Math.abs(pos.x - box.minX);
        const dRight = Math.abs(box.maxX - pos.x);
        const dFront = Math.abs(pos.z - box.minZ);
        const dBack = Math.abs(box.maxZ - pos.z);
        const minD = Math.min(dLeft, dRight, dFront, dBack);
        if (minD === dLeft) pos.x = box.minX - CAT_RADIUS;
        else if (minD === dRight) pos.x = box.maxX + CAT_RADIUS;
        else if (minD === dFront) pos.z = box.minZ - CAT_RADIUS;
        else pos.z = box.maxZ + CAT_RADIUS;
      }
    }
  }

  // Softly push dynamic boxes / yarn balls when the cat bumps into them
  for (const item of interactables) {
    if (item.kind === 'push-box' || item.kind === 'yarn-ball') {
      const dx = item.position.x - pos.x;
      const dz = item.position.z - pos.z;
      const minSep = item.kind === 'yarn-ball' ? 0.38 : 0.48;
      const distSq = dx * dx + dz * dz;
      if (distSq < minSep * minSep && pos.y < 0.45) {
        const dist = Math.max(0.01, Math.sqrt(distSq));
        const nx = dx / dist;
        const nz = dz / dist;
        if (item.velocity) {
          const impulse = item.kind === 'yarn-ball' ? 3.2 : 1.75;
          item.velocity.x += nx * impulse;
          item.velocity.z += nz * impulse;
          if (item.angularVelocity) {
            item.angularVelocity.y += (Math.random() - 0.5) * 2.5;
          }
        }
        item.used = true;
      }
    } else if (item.kind === 'trash-can' && !item.used && pos.y < 0.65) {
      // Standing trash can solid cylinder collision until tipped
      const dx = pos.x - item.position.x;
      const dz = pos.z - item.position.z;
      const minSep = 0.48;
      const distSq = dx * dx + dz * dz;
      if (distSq < minSep * minSep && distSq > 1e-6) {
        const dist = Math.sqrt(distSq);
        const push = minSep - dist;
        pos.x += (dx / dist) * push;
        pos.z += (dz / dist) * push;
      }
    }
  }
}

export function findNearestInteractable(
  catPos: THREE.Vector3,
  interactables: InteractableObject[],
): InteractableObject | null {
  let best: InteractableObject | null = null;
  let bestDist = Infinity;

  for (const item of interactables) {
    const dx = item.position.x - catPos.x;
    const dz = item.position.z - catPos.z;
    const dist = Math.hypot(dx, dz);
    if (dist <= item.radius && dist < bestDist) {
      bestDist = dist;
      best = item;
    }
  }

  return best;
}
