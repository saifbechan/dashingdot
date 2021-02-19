import Phaser from 'phaser';

import { PlayGameSceneType } from '../Helpers/Types';
import config from '../config';

export default class PlatformManager {
  private scene: Phaser.Scene;

  private readonly group: Phaser.GameObjects.Group;
  private readonly pool: Phaser.GameObjects.Group;

  private nextPlatformDistance = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.group = scene.add.group({
      removeCallback: (child) => {
        const platform = child as Phaser.Physics.Arcade.Sprite;
        const scene = platform.scene as PlayGameSceneType;
        scene.platformManager.addToPool(platform);
      },
    });

    this.pool = scene.add.group({
      removeCallback: (child) => {
        const platform = child as Phaser.Physics.Arcade.Sprite;
        const scene = platform.scene as PlayGameSceneType;
        scene.platformManager.addToGroup(platform);
      },
    });

    this.addPlatform(scene.scale.width, scene.scale.height / 2);
  }

  addToPool = (platform: Phaser.GameObjects.GameObject): void => {
    this.pool.add(platform);
  };

  addToGroup = (platform: Phaser.GameObjects.GameObject): void => {
    this.group.add(platform);
  };

  getNthPlatformBounds = (nth: number): number[] => {
    const platform = this.group.getFirstNth(nth, true);
    return platform
      ? [
          platform.getTopLeft().x / this.scene.scale.width,
          platform.getTopLeft().y / this.scene.scale.height,
          platform.getTopRight().x / this.scene.scale.width,
          platform.getTopRight().y / this.scene.scale.height,
        ]
      : [0, 0, 0, 0];
  };

  update = (): void => {
    let minDistance = this.scene.scale.width;
    this.group.getChildren().forEach((child) => {
      const platform = child as Phaser.Physics.Arcade.Sprite;
      const platformDistance = this.scene.scale.width - platform.x - platform.displayWidth / 2;
      minDistance = Math.min(minDistance, platformDistance);
      if (platform.x < -platform.displayWidth / 2) {
        this.group.killAndHide(platform);
        this.group.remove(platform);
      }
    }, this);

    if (minDistance > this.nextPlatformDistance) {
      const nextPlatformWidth = Phaser.Math.Between(
        config.platformSizeRange[0],
        config.platformSizeRange[1]
      );
      this.addPlatform(nextPlatformWidth, this.scene.scale.width + nextPlatformWidth / 2);
    }
  };

  private addPlatform = (platformWidth: number, posX: number): void => {
    let platform;
    if (this.pool.getLength()) {
      platform = this.pool.getFirst();
      platform.x = posX;
      platform.active = true;
      platform.visible = true;
      this.pool.remove(platform);
    } else {
      platform = this.scene.physics.add
        .sprite(posX, this.scene.scale.height * 0.8, 'platform')
        .setScale(0.5)
        .refreshBody();
      platform.setImmovable(true);
      platform.setVelocityX(config.platformStartSpeed * -1);
      this.group.add(platform);
    }
    platform.displayWidth = platformWidth;
    this.nextPlatformDistance = Phaser.Math.Between(config.spawnRange[0], config.spawnRange[1]);
  };

  getGroup = (): Phaser.GameObjects.Group => this.group;
}
