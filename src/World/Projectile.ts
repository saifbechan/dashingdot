import type { ProjectileNames } from '@/lib/constants';
import Phaser from 'phaser';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  public shooterId = '';

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    name: ProjectileNames,
    shooterId: string,
  ) {
    super(scene, x, y, name);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.initProjectile(x, y, name, shooterId);
  }

  public initProjectile(
    x: number,
    y: number,
    name: ProjectileNames,
    shooterId: string,
  ): void {
    this.shooterId = shooterId;
    this.setTexture(name);
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    if (this.body) {
      this.body.enable = true;
      (this.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      this.setVelocityX(1000); // Fast bullet
    }

    // Projectiles are static images (300x50), not animated spritesheets
    // Set origin to left side so bullet starts at spawn position
    this.setOrigin(0, 0.5);
    this.setScale(0.35); // Scale down the full image
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (this.x > this.scene.scale.width + 50) {
      this.deactivate();
    }
  }

  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      this.body.enable = false;
    }
  }
}
