import config from '@/lib/config';
import { AnimationsNames, type MobNames } from '@/lib/constants';
import type Player from './Player';

interface MobConfig {
  id: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  assetPath: string;
}

class Mob extends Phaser.Physics.Arcade.Sprite {
  public speedMultiplier = 1;
  public hitPlayers = new Set<string>();
  public shotPlayers = new Set<string>();

  constructor(scene: Phaser.Scene, x: number, y: number, name: MobNames) {
    super(scene, x, y, name);

    this.setName(name);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Mobs fly, so no gravity
    this.setGravityY(0);
    (this.body as Phaser.Physics.Arcade.Body).allowGravity = false;

    const mobConf = (config.mobConfig as MobConfig[]).find(
      (m) => m.id === (name as string),
    );
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

    // Create animation if it doesn't exist
    const animKey = `${name}-${AnimationsNames.FLY}`;
    if (!this.scene.anims.exists(animKey)) {
      this.scene.anims.create({
        key: animKey,
        frames: this.scene.anims.generateFrameNumbers(animKey, {
          start: 0,
          end: mobConf.frames - 1,
        }),
        frameRate: 16,
        repeat: -1,
      });
    }

    this.anims.play(animKey);
  }

  public hit(player: Player, activePlayers: Player[]): void {
    if (this.hitPlayers.has(player.id) || this.shotPlayers.has(player.id))
      return;
    this.hitPlayers.add(player.id);

    this.updateTransparency(activePlayers);
  }

  public shoot(playerId: string, activePlayers: Player[]): void {
    if (this.hitPlayers.has(playerId) || this.shotPlayers.has(playerId)) return;
    this.shotPlayers.add(playerId);

    this.updateTransparency(activePlayers);
  }

  public updateTransparency(activePlayers: Player[]): void {
    if (activePlayers.length === 0) {
      this.destroy();
      return;
    }

    const activeIds = activePlayers.map((p) => p.id);
    const stillAlive = activeIds.filter(
      (id) => !this.hitPlayers.has(id) && !this.shotPlayers.has(id),
    );

    if (stillAlive.length === 0) {
      this.destroy();
      return;
    }

    this.alpha = stillAlive.length / activePlayers.length;
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

    this.anims.play(`${this.name}-${AnimationsNames.FLY}`, true);
  };
}

export default Mob;
