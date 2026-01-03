import config from '@/lib/config';
import {
  AnimationsNames,
  EffectNames,
  ItemNames,
  PlatformNames,
} from '@/lib/constants';
import effectConfig from '@/lib/sprite-configs/effect-config.json';
import projectileConfig from '@/lib/sprite-configs/projectile-config.json';
import { memory } from '@tensorflow/tfjs';
import Phaser from 'phaser';
import { v4 as uuidv4 } from 'uuid';
import EffectManager from './World/EffectManager';
import type Item from './World/Item';
import ItemManager from './World/ItemManager';
import type Mob from './World/Mob';
import MobManager from './World/MobManager';
import PlatformManager from './World/PlatformManager';
import type Player from './World/Player';
import type { EvolveableType } from './World/Player';
import PlayerManager from './World/PlayerManager';
import type Projectile from './World/Projectile';
import ProjectileManager from './World/ProjectileManager';

export interface PlayDataType {
  generation: number;
  playersData: EvolveableType[];
  seed: string[];
}

export type PlaySceneType = Phaser.Scene & {
  platformManager: PlatformManager;
  projectileManager: ProjectileManager;
  getArea: () => number[];
};

class Play extends Phaser.Scene {
  private generation!: number;
  private seed!: string[];

  private platformManager!: PlatformManager;
  private playerManager!: PlayerManager;
  private mobManager!: MobManager;
  private itemManager!: ItemManager;
  private effectManager!: EffectManager;
  public projectileManager!: ProjectileManager;

  private playerCountText!: Phaser.GameObjects.Text;

  private backgroundLayers: {
    sprite: Phaser.GameObjects.TileSprite;
    scrollFactor: number;
  }[] = [];

  private area: number[] = [];

  constructor() {
    super('Play');
  }

  init = ({
    generation = 1,
    seed = [uuidv4()],
  }: Partial<PlayDataType> = {}): void => {
    this.generation = generation;
    this.seed = seed;

    console.table({
      generation,
      seed: seed[0],
      tensors: (memory() as unknown as { numTensors: number }).numTensors,
    });
  };

  create = ({ playersData = [] }: Partial<PlayDataType> = {}) => {
    const width = this.scale.width;
    const height = this.scale.height;

    // Create Background Layers
    const bgConfig = config.selectedBackground;
    bgConfig.layers.forEach((layer) => {
      const bg = this.add
        .tileSprite(0, 0, width, height, `${bgConfig.id}-${layer.image}`)
        .setOrigin(0, 0)
        .setScrollFactor(0);

      this.backgroundLayers.push({
        sprite: bg,
        scrollFactor: layer.scrollFactor,
      });
    });

    this.effectManager = new EffectManager(this);
    this.mobManager = new MobManager(this, this.seed);
    this.itemManager = new ItemManager(this);
    this.projectileManager = new ProjectileManager(this);

    this.platformManager = new PlatformManager(
      this,
      this.seed,
      this.itemManager,
    );
    this.playerManager = new PlayerManager(
      this,
      playersData,
      this.effectManager,
    );

    this.physics.add.collider(
      this.platformManager.getGroup(),
      this.playerManager,
    );

    this.physics.add.overlap(
      this.playerManager,
      this.itemManager,
      (playerObj, itemObj) => {
        const player = playerObj as Player;
        const item = itemObj as Item;

        const activePlayers = this.playerManager.getChildren() as Player[];
        item.collect(player, activePlayers);

        if (item.name === (ItemNames.POWERUP as string)) {
          player.addAmmo(5);
        }

        // One sparkle per pickup
        this.effectManager.playEffect(item.x, item.y, EffectNames.SPARKLE, 0.5);
      },
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.playerManager,
      this.mobManager,
      (playerObj, mobObj) => {
        const player = playerObj as Player;
        const mob = mobObj as Mob;

        if (mob.hitPlayers.has(player.id) || mob.shotPlayers.has(player.id))
          return;

        const activePlayers = this.playerManager.getChildren() as Player[];
        mob.hit(player, activePlayers);

        this.playerManager.killPlayer(player, EffectNames.BURN);
      },
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.projectileManager,
      this.mobManager,
      (projObj, mobObj) => {
        const projectile = projObj as Projectile;
        const mob = mobObj as Mob;

        if (
          mob.hitPlayers.has(projectile.shooterId) ||
          mob.shotPlayers.has(projectile.shooterId)
        )
          return;

        const activePlayers = this.playerManager.getChildren() as Player[];
        mob.shoot(projectile.shooterId, activePlayers);

        projectile.deactivate();

        this.effectManager.playEffect(mob.x, mob.y, EffectNames.BURN);
      },
      undefined,
      this,
    );

    this.scene.launch('Pause');
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-P', () => {
        this.scene.pause('Play');
        this.scene.resume('Pause');
      });
    }

    if (config.showGuides) {
      config.guides.forEach((guide: number[]) => {
        if (guide.length === 3) {
          this.add
            .rectangle(
              guide[0],
              this.scale.height * 0.8,
              guide[1],
              guide[2],
              0x6666ff,
            )
            .setOrigin(0);
        }
      });
    }

    this.playerCountText = this.add.text(
      10,
      10,
      `Active players: ${String(this.playerManager.getChildren().length)}`,
    );

    this.createAnimations();
  };

  createAnimations = (): void => {
    effectConfig.forEach((effect) => {
      if (!this.anims.exists(effect.id)) {
        this.anims.create({
          key: effect.id as EffectNames,
          frames: this.anims.generateFrameNumbers(effect.id, {
            start: 0,
            end: effect.frames - 1,
          }),
          frameRate: 20,
          hideOnComplete: true,
        });
      }
    });
  };

  update = (): void => {
    this.area = [];
    const context = this.game.canvas.getContext('2d');
    if (context !== null) {
      config.guides.forEach((guide) =>
        this.area.push(
          ...Array.from(
            context.getImageData(
              guide[0] || 0,
              this.scale.height * 0.8,
              guide[1] || 0,
              guide[2] || 0,
            ).data,
          ),
        ),
      );
    }

    this.platformManager.update();
    const currentSpeed = this.platformManager.getCurrentSpeed();
    this.mobManager.update(this.time.now, this.game.loop.delta, currentSpeed);
    this.itemManager.update();

    // Only update transparency when necessary
    const playerCount = this.playerManager.countActive();
    if (
      this.playerCountText.text !== `Active players: ${String(playerCount)}`
    ) {
      const activePlayers = this.playerManager.getChildren() as Player[];
      this.itemManager.getChildren().forEach((item) => {
        (item as Item).updateTransparency(activePlayers);
      });
      this.mobManager.getChildren().forEach((mob) => {
        (mob as Mob).updateTransparency(activePlayers);
      });
      this.playerCountText.setText(`Active players: ${String(playerCount)}`);
    }

    this.playerManager.update();

    // Update Background Parallax
    const speed = this.platformManager.getCurrentSpeed();
    this.backgroundLayers.forEach((bg) => {
      bg.sprite.tilePositionX -=
        speed * bg.scrollFactor * (this.game.loop.delta / 1000);
    });

    if (playerCount === 0) {
      this.scene.start('Play', {
        ...this.playerManager.getPlayersData(),
        generation: this.generation + 1,
        seed: this.seed,
      } as PlayDataType);
    }
  };

  preload = (): void => {
    Object.values(PlatformNames).forEach((platform) => {
      this.load.image(platform, `images/platforms/${platform}.png`);
    });

    config.itemConfig.forEach((itemConf) => {
      this.load.spritesheet(itemConf.id, itemConf.assetPath, {
        frameWidth: itemConf.frameWidth,
        frameHeight: itemConf.frameHeight,
      });
    });

    // Load selected background layers
    const bgConfig = config.selectedBackground;
    bgConfig.layers.forEach((layer) => {
      this.load.image(`${bgConfig.id}-${layer.image}`, layer.path);
    });

    // Load selected player
    const charConfig = config.playerConfig.find(
      (c) => c.id === (config.selectedPlayer as string),
    );
    if (charConfig) {
      this.load.spritesheet(charConfig.id, charConfig.assetPath, {
        frameWidth: charConfig.frameWidth,
        frameHeight: charConfig.frameHeight,
      });
    }

    // Load all mobs
    config.mobConfig.forEach((mobConf) => {
      this.load.spritesheet(
        `${mobConf.id}-${AnimationsNames.FLY}`,
        mobConf.assetPath,
        {
          frameWidth: mobConf.frameWidth,
          frameHeight: mobConf.frameHeight,
        },
      );
    });

    // Load effects
    effectConfig.forEach((effect) => {
      this.load.spritesheet(effect.id, effect.assetPath, {
        frameWidth: effect.frameWidth,
        frameHeight: effect.frameHeight,
      });
    });

    // Load projectiles
    projectileConfig.forEach((projConf) => {
      this.load.spritesheet(projConf.id, projConf.assetPath, {
        frameWidth: projConf.frameWidth,
        frameHeight: projConf.frameHeight,
      });
    });
  };

  public getArea = (): number[] => this.area;
}

export default Play;
