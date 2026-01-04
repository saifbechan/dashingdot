/**
 * Lightweight Raycaster for Arcade Physics
 *
 * A simple, high-performance raycaster optimized for rectangular body detection.
 * Uses Phaser's built-in Geom.Intersects for line-rectangle intersection testing.
 *
 * This is faster than the phaser-raycaster plugin for simple AABB (axis-aligned
 * bounding box) collision detection because it:
 * - Skips polygon/complex geometry handling
 * - Avoids object mapping overhead
 * - Works directly with arcade body bounds
 */

import Phaser from 'phaser';

export interface RaycastHit {
  /** The hit point coordinates */
  point: Phaser.Math.Vector2;
  /** Distance from ray origin to hit point */
  distance: number;
  /** The game object that was hit */
  object: Phaser.GameObjects.GameObject;
}

export interface RaycastTarget {
  /** The game object to test against */
  gameObject: Phaser.GameObjects.GameObject;
  /** The body bounds rectangle (cached for performance) */
  bounds: Phaser.Geom.Rectangle;
}

// Pre-allocated objects for zero-allocation raycasting
const reusableRay = new Phaser.Geom.Line(0, 0, 0, 0);
const reusableHitPoint = new Phaser.Math.Vector2();
const intersectionPoints: Phaser.Geom.Point[] = [];

// Pre-allocated hit result to avoid object creation in hot path
const reusableHit: RaycastHit = {
  point: reusableHitPoint,
  distance: 0,
  object: null as unknown as Phaser.GameObjects.GameObject,
};

/**
 * Cast a ray and find the closest intersection with any target.
 *
 * @param originX - Ray origin X coordinate
 * @param originY - Ray origin Y coordinate
 * @param angle - Ray angle in radians
 * @param length - Maximum ray length
 * @param targets - Array of targets to test against
 * @returns The closest hit, or null if no intersection
 */
export function raycast(
  originX: number,
  originY: number,
  angle: number,
  length: number,
  targets: RaycastTarget[],
): RaycastHit | null {
  // Calculate ray endpoint and reuse line object
  reusableRay.x1 = originX;
  reusableRay.y1 = originY;
  reusableRay.x2 = originX + Math.cos(angle) * length;
  reusableRay.y2 = originY + Math.sin(angle) * length;

  let closestHit: RaycastHit | null = null;
  let closestDistance = length;

  for (const target of targets) {
    // Skip inactive objects
    if (!target.gameObject.active) continue;

    // Clear previous intersection points
    intersectionPoints.length = 0;

    // Get all intersection points between ray and rectangle
    Phaser.Geom.Intersects.GetLineToRectangle(
      reusableRay,
      target.bounds,
      intersectionPoints,
    );

    // Find the closest intersection point for this target
    for (const point of intersectionPoints) {
      const dx = point.x - originX;
      const dy = point.y - originY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closestDistance = distance;
        // Reuse pre-allocated hit object instead of creating new one
        reusableHitPoint.set(point.x, point.y);
        reusableHit.distance = distance;
        reusableHit.object = target.gameObject;
        closestHit = reusableHit;
      }
    }
  }

  return closestHit;
}

/**
 * Build raycast targets from an array of game objects.
 * This extracts the body bounds for efficient intersection testing.
 *
 * @param gameObjects - Array of game objects with arcade bodies
 * @returns Array of raycast targets with cached bounds
 */
export function buildRaycastTargets(
  gameObjects: Phaser.GameObjects.GameObject[],
): RaycastTarget[] {
  const targets: RaycastTarget[] = [];

  for (const obj of gameObjects) {
    if (!obj.active) continue;

    // Get the arcade body
    const body = (obj as Phaser.Physics.Arcade.Sprite).body;
    if (!body) continue;

    // Create bounds rectangle from body position and size
    const bounds = new Phaser.Geom.Rectangle(
      body.x,
      body.y,
      body.width,
      body.height,
    );

    targets.push({
      gameObject: obj,
      bounds,
    });
  }

  return targets;
}

/**
 * Update existing raycast targets with current body positions.
 * More efficient than rebuilding when the object set is stable.
 *
 * @param targets - Existing targets to update
 */
export function updateRaycastTargets(targets: RaycastTarget[]): void {
  for (const target of targets) {
    if (!target.gameObject.active) continue;

    const body = (target.gameObject as Phaser.Physics.Arcade.Sprite).body;
    if (!body) continue;

    // Update bounds in-place
    target.bounds.x = body.x;
    target.bounds.y = body.y;
    target.bounds.width = body.width;
    target.bounds.height = body.height;
  }
}
