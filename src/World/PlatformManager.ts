import config from '@/lib/config';
import { PlatformNames } from '@/lib/constants';
import Phaser from 'phaser';
import type ItemManager from './ItemManager';
import Platform from './Platform';

export default class PlatformManager {
  private scene: Phaser.Scene;
  private rnd: Phaser.Math.RandomDataGenerator;

  private readonly group: Phaser.GameObjects.Group;
  private readonly pool: Phaser.GameObjects.Group;

  private nextPlatformDistance = 0;
  private platformSpeed = 0;

  private step = 0;
  private platformBag: PlatformNames[] = [];
  private platformsSpawned = 0;
  private itemManager: ItemManager | undefined;

  constructor(scene: Phaser.Scene, seed: string[], itemManager?: ItemManager) {
    this.scene = scene;
    this.itemManager = itemManager;

    this.rnd = new Phaser.Math.RandomDataGenerator(seed);

    this.platformSpeed = config.platformStartSpeed * -1;

    this.group = scene.add.group();
    this.pool = scene.add.group();

    this.addPlatform(scene.scale.width, scene.scale.width / 2);
  }

  addToPool = (platform: Phaser.GameObjects.GameObject): void => {
    this.pool.add(platform);
  };

  addToGroup = (platform: Phaser.GameObjects.GameObject): void => {
    this.group.add(platform);
  };

  getNthPlatformBounds = (nth: number): number[] => {
    const platform = this.group.getFirstNth(nth, true) as Platform;
    return [
      platform.getTopLeft().x / this.scene.scale.width,
      platform.getTopLeft().y / this.scene.scale.height,
      platform.getTopRight().x / this.scene.scale.width,
      platform.getTopRight().y / this.scene.scale.height,
    ];
  };

  update = (): void => {
    this.step += 1;

    // Update speed once per frame
    if (this.step % config.platformSpeedThreshold === 0) {
      this.platformSpeed -= this.step / config.platformSpeedThreshold;
      this.itemManager?.setVelocityX(this.platformSpeed);
    }

    let minDistance = this.scene.scale.width;
    const children = this.group.getChildren();

    for (let i = children.length - 1; i >= 0; i -= 1) {
      const platform = children[i] as Platform;
      const platformDistance =
        this.scene.scale.width - platform.x - platform.displayWidth / 2;

      minDistance = Math.min(minDistance, platformDistance);

      if (platform.x < -platform.displayWidth / 2) {
        this.group.remove(platform);
        platform.setActive(false);
        platform.setVisible(false);
        this.pool.add(platform);
        continue;
      }

      if (this.step % config.platformSpeedThreshold === 0) {
        platform.setVelocityX(this.platformSpeed);
      }
    }

    if (minDistance > this.nextPlatformDistance) {
      const nextPlatformWidth = this.rnd.between(
        config.platformSizeRange[0] ?? 50,
        config.platformSizeRange[1] ?? 100,
      );
      this.addPlatform(
        nextPlatformWidth,
        this.scene.scale.width + nextPlatformWidth / 2,
      );
    }
  };

  private refillBag = (): void => {
    const platformNames = Object.values(PlatformNames);
    const minEach = 2;
    const totalSize = 10;

    platformNames.forEach((name) => {
      for (let i = 0; i < minEach; i += 1) {
        this.platformBag.push(name);
      }
    });

    while (this.platformBag.length < totalSize) {
      const randomColor =
        platformNames[this.rnd.between(0, platformNames.length - 1)];
      this.platformBag.push(randomColor);
    }

    this.rnd.shuffle(this.platformBag);
  };

  private addPlatform = (platformWidth: number, posX: number): void => {
    if (this.platformBag.length === 0) {
      this.refillBag();
    }
    const platformName = this.platformBag.shift();
    if (!platformName) return;

    let platform: Platform;
    if (this.pool.getLength() > 0) {
      platform = this.pool.getFirst() as Platform;
      this.pool.remove(platform);
      this.group.add(platform);
      platform.reset(
        posX,
        platformName,
        platformWidth,
        this.platformSpeed,
        this.itemManager,
      );
    } else {
      platform = new Platform(
        this.scene,
        posX,
        this.scene.scale.height * 0.8,
        platformName,
        platformWidth,
        this.platformSpeed,
        this.itemManager,
      );
      this.group.add(platform);
    }

    this.platformsSpawned += 1;

    this.nextPlatformDistance = this.rnd.between(
      config.spawnRange[0] ?? 100,
      config.spawnRange[1] ?? 200,
    );
  };

  getGroup = (): Phaser.GameObjects.Group => this.group;

  getCurrentSpeed = (): number => this.platformSpeed;

  getPlatformsSpawned = (): number => this.platformsSpawned;
}
