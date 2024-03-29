import { PlaySceneType } from '../Play';
import Phaser from 'phaser';
import config from '../../lib/config';

export default class PlatformManager {
  private scene: Phaser.Scene;
  private rnd: Phaser.Math.RandomDataGenerator;

  private readonly group: Phaser.GameObjects.Group;
  private readonly pool: Phaser.GameObjects.Group;

  private nextPlatformDistance = 0;
  private platformSpeed = 0;

  private step = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.rnd = new Phaser.Math.RandomDataGenerator(config.game.seed);

    this.platformSpeed = config.platformStartSpeed * -1;

    this.group = scene.add.group({
      removeCallback: (child) => {
        const platform = child as Phaser.Physics.Arcade.Sprite;
        const scene = platform.scene as PlaySceneType;
        scene.platformManager.addToPool(platform);
      },
    });

    this.pool = scene.add.group({
      removeCallback: (child) => {
        const platform = child as Phaser.Physics.Arcade.Sprite;
        const scene = platform.scene as PlaySceneType;
        scene.platformManager.addToGroup(platform);
      },
    });

    this.addPlatform(scene.scale.width, scene.scale.width / 2);
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
    this.step += 1;

    let minDistance = this.scene.scale.width;
    this.group.getChildren().forEach((child) => {
      const platform = child as Phaser.Physics.Arcade.Sprite;
      const platformDistance =
        this.scene.scale.width - platform.x - platform.displayWidth / 2;

      minDistance = Math.min(minDistance, platformDistance);

      if (platform.x < -platform.displayWidth / 2) {
        this.group.killAndHide(platform);
        this.group.remove(platform);
        return;
      }

      if (this.step % config.platformSpeedThreshold === 0) {
        this.platformSpeed -= this.step / config.platformSpeedThreshold;
        platform.setVelocityX(this.platformSpeed);
      }
    }, this);

    if (minDistance > this.nextPlatformDistance) {
      const nextPlatformWidth = this.rnd.between(
        config.platformSizeRange[0],
        config.platformSizeRange[1]
      );
      this.addPlatform(
        nextPlatformWidth,
        this.scene.scale.width + nextPlatformWidth / 2
      );
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
      platform.setVelocityX(this.platformSpeed);
      this.group.add(platform);
    }
    platform.displayWidth = platformWidth;
    this.nextPlatformDistance = this.rnd.between(
      config.spawnRange[0],
      config.spawnRange[1]
    );
  };

  getGroup = (): Phaser.GameObjects.Group => this.group;
}
