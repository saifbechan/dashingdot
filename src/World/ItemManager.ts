import type { ItemNames } from '@/lib/constants';
import Item from './Item';

export default class ItemManager extends Phaser.GameObjects.Group {
  private pool: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene) {
    super(scene);
    this.pool = scene.add.group();
    scene.add.existing(this);
  }

  spawnItem(x: number, y: number, name: ItemNames): Item {
    let item: Item;

    if (this.pool.getLength() > 0) {
      item = this.pool.getFirst() as Item;
      this.pool.remove(item);
      this.add(item);
      item.reset(x, y, name);
    } else {
      item = new Item(this.scene, x, y, name, this);
      this.add(item);
    }

    return item;
  }

  returnToPool(item: Item): void {
    this.remove(item);
    item.setActive(false);
    item.setVisible(false);
    if (item.body) {
      item.body.enable = false;
    }
    this.pool.add(item);
  }

  setVelocityX(velocity: number): void {
    this.getChildren().forEach((child) => {
      const item = child as Phaser.Physics.Arcade.Sprite;
      item.setVelocityX(velocity);
    });
  }

  update = (): void => {
    // Collectives move with the platforms
  };
}
