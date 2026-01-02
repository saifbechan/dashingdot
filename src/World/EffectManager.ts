import { type EffectNames } from '@/lib/constants';
import Phaser from 'phaser';

export default class EffectManager extends Phaser.GameObjects.Group {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
  }

  playEffect(x: number, y: number, name: EffectNames, scale = 1): void {
    let effect: Phaser.GameObjects.Sprite;

    const deadEffect = this.getFirstDead(
      false,
    ) as Phaser.GameObjects.Sprite | null;
    if (deadEffect) {
      effect = deadEffect;
      effect.setActive(true);
      effect.setVisible(true);
      effect.setPosition(x, y);
    } else {
      effect = this.scene.add.sprite(x, y, name);
      this.add(effect);
    }

    effect.setScale(scale);
    effect.play(name);
    effect.once('animationcomplete', () => {
      effect.setActive(false);
      effect.setVisible(false);
    });
  }
}
