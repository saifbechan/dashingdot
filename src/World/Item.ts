import config from '@/lib/config';
import type { ItemNames } from '@/lib/constants';
import Phaser from 'phaser';
import type ItemManager from './ItemManager';
import type Player from './Player';

interface ItemConfig {
  id: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  scale?: number;
  assetPath: string;
}

class Item extends Phaser.Physics.Arcade.Sprite {
  public collectors = new Set<string>();
  private floatingTween?: Phaser.Tweens.Tween;
  private manager: ItemManager;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    name: ItemNames,
    manager: ItemManager,
  ) {
    super(scene, x, y, name);
    this.manager = manager;
    this.initItem(x, y, name);
  }

  private initItem(x: number, y: number, name: ItemNames): void {
    this.setTexture(name);
    this.setName(name);
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.alpha = 1;
    this.collectors.clear();

    if (!this.scene.sys.displayList.exists(this)) {
      this.scene.add.existing(this);
    }
    if (
      !this.scene.physics.world.bodies.contains(
        this.body as Phaser.Physics.Arcade.Body,
      )
    ) {
      this.scene.physics.add.existing(this);
    }

    if (this.body) {
      this.body.enable = true;
      (this.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      const bodyWidth = 40;
      const bodyHeight = 40;
      this.setSize(bodyWidth, bodyHeight);
      this.setOffset(
        (this.width - bodyWidth) / 2,
        (this.height - bodyHeight) / 2,
      );
      // Sync body position to current sprite position
      (this.body as Phaser.Physics.Arcade.Body).reset(this.x, this.y);
    }

    const itemConf = config.itemConfig.find(
      (i) => i.id === (name as string),
    ) as ItemConfig | undefined;
    if (itemConf) {
      this.setScale(itemConf.scale ?? 0.75);
      const animKey = `${name}-anim`;
      if (!this.scene.anims.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: this.scene.anims.generateFrameNumbers(name, {
            start: 0,
            end: itemConf.frames - 1,
          }),
          frameRate: 10,
          repeat: -1,
        });
      }
      this.anims.play(animKey);
    }

    if (this.floatingTween) {
      this.floatingTween.remove();
    }

    this.floatingTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 15,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  public reset(x: number, y: number, name: ItemNames): void {
    this.initItem(x, y, name);
  }

  public collect(player: Player, activePlayers: Player[]): void {
    if (this.collectors.has(player.id)) return;
    this.collectors.add(player.id);
    this.updateTransparency(activePlayers);
  }

  public updateTransparency(activePlayers: Player[]): void {
    if (activePlayers.length === 0) {
      this.deactivate();
      return;
    }

    const activeIds = activePlayers.map((p) => p.id);
    const stillToCollect = activeIds.filter((id) => !this.collectors.has(id));

    if (stillToCollect.length === 0) {
      this.deactivate();
      return;
    }

    this.alpha = stillToCollect.length / activePlayers.length;
  }

  private deactivate(): void {
    if (this.floatingTween) {
      this.floatingTween.remove();
      this.floatingTween = undefined;
    }

    this.manager.returnToPool(this);
  }

  preUpdate = (time: number, delta: number): void => {
    super.preUpdate(time, delta);
    if (this.x < -this.width) {
      this.deactivate();
    }
  };
}

export default Item;
