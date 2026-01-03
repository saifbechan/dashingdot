import config from '@/lib/config';
import type { ProjectileNames } from '@/lib/constants';
import Phaser from 'phaser';

interface ProjectileConfig {
  id: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  assetPath: string;
}

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

    const projConf = (config.projectileConfig as ProjectileConfig[]).find(
      (p) => p.id === (name as string),
    );

    if (projConf) {
      this.setScale(0.5);
      const animKey = `${name}-anim`;
      if (!this.scene.anims.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: this.scene.anims.generateFrameNumbers(name, {
            start: 0,
            end: projConf.frames - 1,
          }),
          frameRate: 15,
          repeat: -1,
        });
      }
      this.anims.play(animKey);
    }
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
