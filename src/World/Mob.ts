import config from '@/lib/config';
import { AnimationsNames, MobNames } from '@/lib/constants';

class Mob extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    name: MobNames = MobNames.CRUSHER,
  ) {
    super(scene, x, y, name);

    this.setName(name);

    const {
      mobs: { animations, offset },
    } = config;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.5);
    this.setSize(85, 85);
    this.setOffset(offset[name]);

    (Object.keys(animations) as (keyof typeof animations)[]).forEach((key) => {
      this.anims.create({
        key: key as string,
        frames: this.anims.generateFrameNumbers(`${name}-${key}`, {
          frames: animations[key],
        }),
        frameRate: 16,
        repeat: -1,
      });
    });
  }

  preUpdate = (time: number, delta: number): void => {
    super.preUpdate(time, delta);

    if (!this.body) {
      throw new Error('Empty body');
    }

    this.anims.play(AnimationsNames.FLY, true);
  };
}

export default Mob;
