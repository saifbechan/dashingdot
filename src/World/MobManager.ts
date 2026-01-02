import { MobNames } from '@/lib/constants';
import Mob from './Mob';

export default class MobManager extends Phaser.GameObjects.Group {
  private nextSpawnTime = 0;

  update = (time: number, delta: number): void => {
    // Spawn logic
    if (time > this.nextSpawnTime) {
      this.spawnMob();
      // Random interval between 1s and 3s
      this.nextSpawnTime = time + Phaser.Math.Between(1000, 3000);
    }

    // Update children
    this.getChildren().forEach((child) => {
      child.update(time, delta);
    });
  };

  private spawnMob() {
    const scene = this.scene;
    const { width, height } = scene.scale;

    // Random Y position (top to bottom minus some margin)
    const y = Phaser.Math.Between(50, height * 0.8);
    const x = width + 100; // Right side off-screen

    // Random Mob Skin
    const mobNames = Object.values(MobNames);
    const randomSkin = mobNames[
      Phaser.Math.Between(0, mobNames.length - 1)
    ] as MobNames;

    // Random Velocity (-200 to -500)
    const velocityX = Phaser.Math.Between(-500, -200);

    const mob = new Mob(scene, x, y, randomSkin);
    this.add(mob);

    mob.setVelocityX(velocityX);
  }
}
