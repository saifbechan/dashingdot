import Mob from './Mob';

export default class MobManager extends Phaser.GameObjects.Group {
  constructor(scene: Phaser.Scene) {
    super(scene);

    this.add(new Mob(scene, 200, scene.scale.height / 2));
  }
}
