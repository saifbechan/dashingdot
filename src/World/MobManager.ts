import { MobNames } from '@/lib/constants';
import Mob from './Mob';

export default class MobManager extends Phaser.GameObjects.Group {
  private nextSpawnTime = 0;
  private rnd: Phaser.Math.RandomDataGenerator;
  private timer = 0;

  constructor(scene: Phaser.Scene, seed: string[]) {
    super(scene);
    this.rnd = new Phaser.Math.RandomDataGenerator(seed);
  }

  update = (_time: number, delta: number, platformSpeed: number): void => {
    this.timer += delta;
    // Spawn logic
    if (this.timer > this.nextSpawnTime) {
      this.spawnMob(platformSpeed);
      // Random interval between 1s and 3s
      this.nextSpawnTime = this.timer + this.rnd.between(1000, 3000);
    }

    // Update children
    this.getChildren().forEach((child) => {
      const mob = child as Mob;
      mob.update(_time, delta);

      // Ensure mobs move faster than platforms by maintaining their speed multiplier
      mob.setVelocityX(platformSpeed * mob.speedMultiplier);
    });
  };

  private spawnMob(platformSpeed: number) {
    const scene = this.scene;
    const { width, height } = scene.scale;

    // Random Y position (top to bottom minus some margin)
    const y = this.rnd.between(50, height * 0.8);
    const x = width + 100; // Right side off-screen

    // Random Mob Skin
    const mobNames = Object.values(MobNames);
    const randomSkin = mobNames[
      this.rnd.between(0, mobNames.length - 1)
    ] as MobNames;

    const mob = new Mob(scene, x, y, randomSkin);

    // Faster than current platforms (e.g. 1.2x to 1.8x speed)
    mob.speedMultiplier = this.rnd.realInRange(1.2, 1.8);

    this.add(mob);

    mob.setVelocityX(platformSpeed * mob.speedMultiplier);
  }
}
