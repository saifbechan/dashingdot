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
  // Calculate ray endpoint
  const endX = originX + Math.cos(angle) * length;
  const endY = originY + Math.sin(angle) * length;

  // Create line for intersection testing
  const ray = new Phaser.Geom.Line(originX, originY, endX, endY);

  let closestHit: RaycastHit | null = null;
  let closestDistance = length;

  // Pre-allocate intersection points array (reused per target)
  const intersectionPoints: Phaser.Geom.Point[] = [];

  for (const target of targets) {
    // Skip inactive objects
    if (!target.gameObject.active) continue;

    // Clear previous intersection points
    intersectionPoints.length = 0;

    // Get all intersection points between ray and rectangle
    Phaser.Geom.Intersects.GetLineToRectangle(
      ray,
      target.bounds,
      intersectionPoints,
    );

    // Find the closest intersection point for this target
    for (const point of intersectionPoints) {
      const distance = Phaser.Math.Distance.Between(
        originX,
        originY,
        point.x,
        point.y,
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestHit = {
          point: new Phaser.Math.Vector2(point.x, point.y),
          distance,
          object: target.gameObject,
        };
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
