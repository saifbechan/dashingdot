import config from '@/lib/config';
import { AnimationsNames, type MobNames } from '@/lib/constants';

class Mob extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, name: MobNames) {
    super(scene, x, y, name);

    this.setName(name);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Mobs fly, so no gravity
    this.setGravityY(0);
    (this.body as Phaser.Physics.Arcade.Body).allowGravity = false;

    const mobConf = config.mobConfig.find((m) => m.id === (name as string));
    if (!mobConf) {
      console.warn(`Mob config not found for ${name}`);
      return;
    }

    this.setScale(0.5);
    const bodySize = 85;
    this.setSize(bodySize, bodySize);

    // Center the body
    const offsetX = bodySize / 2;
    const offsetY = (mobConf.frameHeight - bodySize) / 2;
    this.setOffset(offsetX, offsetY);

    this.anims.create({
      key: AnimationsNames.FLY,
      frames: this.anims.generateFrameNumbers(
        `${name}-${AnimationsNames.FLY}`,
        {
          start: 0,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          end: ((mobConf as any).frames as number) - 1,
        },
      ),
      frameRate: 16,
      repeat: -1,
    });
  }

  preUpdate = (time: number, delta: number): void => {
    super.preUpdate(time, delta);

    if (!this.body) {
      throw new Error('Empty body');
    }

    if (this.x < -this.width) {
      this.destroy();
      return;
    }

    this.anims.play(AnimationsNames.FLY, true);
  };
}

export default Mob;
