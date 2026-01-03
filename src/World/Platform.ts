import { ItemNames, PlatformNames } from '@/lib/constants';
import Phaser from 'phaser';
import type ItemManager from './ItemManager';

export default class Platform extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: PlatformNames,
    width: number,
    speed: number,
    itemManager?: ItemManager,
  ) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.5);
    this.displayWidth = width;
    this.refreshBody();

    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).reset(this.x, this.y);
    }

    this.setImmovable(true);
    this.setVelocityX(speed);

    if (itemManager) {
      const itemY = this.y - this.displayHeight / 2 - 30;
      if (texture === PlatformNames.GOLD) {
        const coin = itemManager.spawnItem(this.x, itemY, ItemNames.COIN);
        coin.setVelocityX(speed);
      } else if (texture === PlatformNames.BLUE) {
        const powerup = itemManager.spawnItem(this.x, itemY, ItemNames.POWERUP);
        powerup.setVelocityX(speed);
      }
    }
  }

  // Method to reuse/reset the platform (for pooling)
  reset(
    x: number,
    texture: PlatformNames,
    width: number,
    speed: number,
    itemManager?: ItemManager,
  ): void {
    this.setTexture(texture);
    this.x = x;
    this.active = true;
    this.visible = true;
    this.displayWidth = width;

    if (this.body) {
      this.body.enable = true;
      this.refreshBody();
      (this.body as Phaser.Physics.Arcade.Body).reset(this.x, this.y);
    }

    this.setVelocityX(speed);

    if (itemManager) {
      const itemY = this.y - this.displayHeight / 2 - 30;
      if (texture === PlatformNames.GOLD) {
        const coin = itemManager.spawnItem(this.x, itemY, ItemNames.COIN);
        coin.setVelocityX(speed);
      } else if (texture === PlatformNames.BLUE) {
        const powerup = itemManager.spawnItem(this.x, itemY, ItemNames.POWERUP);
        powerup.setVelocityX(speed);
      }
    }
  }
}
