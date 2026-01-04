import config from '@/lib/config';
import {
  AnimationsNames,
  EffectNames,
  ItemNames,
  PlatformNames,
} from '@/lib/constants';
import {
  buildRaycastTargets,
  updateRaycastTargets,
  type RaycastTarget,
} from '@/lib/Raycaster';
import effectConfig from '@/lib/sprite-configs/effect-config.json';
import projectileConfig from '@/lib/sprite-configs/projectile-config.json';

import Phaser from 'phaser';
import { v4 as uuidv4 } from 'uuid';
import EffectManager from '../World/EffectManager';
import type Item from '../World/Item';
import ItemManager from '../World/ItemManager';
import type Mob from '../World/Mob';
import MobManager from '../World/MobManager';
import PlatformManager from '../World/PlatformManager';
import type Player from '../World/Player';
import type { EvolveableType } from '../World/Player';
import PlayerManager from '../World/PlayerManager';
import type Projectile from '../World/Projectile';
import ProjectileManager from '../World/ProjectileManager';

export interface PlayDataType {
  generation: number;
  playersData: EvolveableType[];
  seed: string[];
}

export type PlaySceneType = Phaser.Scene & {
  platformManager: PlatformManager;
  projectileManager: ProjectileManager;
  playerManager: PlayerManager;
  mobManager: MobManager;
  itemManager: ItemManager;
  raycastTargets: RaycastTarget[];
};

class Play extends Phaser.Scene {
  private generation!: number;
  private seed!: string[];

  private platformManager!: PlatformManager;
  public mobManager!: MobManager;
  public itemManager!: ItemManager;
  public playerManager!: PlayerManager;
  private effectManager!: EffectManager;
  public projectileManager!: ProjectileManager;

  private playerCountText?: Phaser.GameObjects.Text;
  private backgroundLayers: {
    sprite: Phaser.GameObjects.TileSprite;
    scrollFactor: number;
    bgId: string;
  }[] = [];

  // Background transition state
  private currentBackgroundIndex = 0;
  private lastBackgroundChangePlatform = 0;
  private isTransitioning = false;
  private readonly PLATFORMS_PER_BACKGROUND = 10;
  private readonly TRANSITION_DURATION = 1500; // ms

  // Lightweight raycaster targets - cached and updated in-place when possible
  public raycastTargets: RaycastTarget[] = [];
  private lastRaycastTargetCount = 0;

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
    });
  };

  create = ({ playersData = [] }: Partial<PlayDataType> = {}) => {
    const width = this.scale.width;
    const height = this.scale.height;

    // Create Background Layers for ALL backgrounds (for smooth transitions)
    // Each background's layers are created but only the first background is visible initially
    config.backgroundConfig.forEach((bgConfig, bgIndex) => {
      bgConfig.layers.forEach((layer) => {
        const bg = this.add
          .tileSprite(0, 0, width, height, `${bgConfig.id}-${layer.image}`)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setAlpha(bgIndex === 0 ? 1 : 0); // Only first background visible

        this.backgroundLayers.push({
          sprite: bg,
          scrollFactor: layer.scrollFactor,
          bgId: bgConfig.id,
        });
      });
    });
    this.currentBackgroundIndex = 0;

    this.effectManager = new EffectManager(this);
    this.mobManager = new MobManager(this, this.seed);
    this.itemManager = new ItemManager(this);
    this.projectileManager = new ProjectileManager(this);

    // Initialize lightweight raycast targets (will be populated in update)

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

        player.recordItemCollection();

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

        // Credit the shooter
        const shooter = this.playerManager.getPlayerById(projectile.shooterId);
        if (shooter) {
          shooter.recordMobKill();
        }

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
    this.platformManager.update();
    const currentSpeed = this.platformManager.getCurrentSpeed();
    this.mobManager.update(this.time.now, this.game.loop.delta, currentSpeed);
    this.itemManager.update();

    // Build raycast targets from all active entities (lightweight raycaster)
    // Only rebuild when entity count changes, otherwise update positions in-place
    const activePlatforms = this.platformManager
      .getGroup()
      .getChildren()
      .filter((obj) => obj.active);
    const activeMobs = this.mobManager
      .getChildren()
      .filter((obj) => obj.active);
    const activeItems = this.itemManager
      .getChildren()
      .filter((obj) => obj.active);

    const totalTargetCount =
      activePlatforms.length + activeMobs.length + activeItems.length;

    if (totalTargetCount !== this.lastRaycastTargetCount) {
      // Entity count changed - full rebuild
      const allTargets = [...activePlatforms, ...activeMobs, ...activeItems];
      this.raycastTargets = buildRaycastTargets(allTargets);
      this.lastRaycastTargetCount = totalTargetCount;
    } else {
      // Same count - just update positions in-place (no allocation)
      updateRaycastTargets(this.raycastTargets);
    }

    // Only update transparency when necessary
    const playerCount = this.playerManager.countActive();
    if (
      this.playerCountText &&
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

    // Check for background transition every 10 platforms
    const platformsSpawned = this.platformManager.getPlatformsSpawned();
    if (
      !this.isTransitioning &&
      platformsSpawned - this.lastBackgroundChangePlatform >=
        this.PLATFORMS_PER_BACKGROUND
    ) {
      this.transitionToNextBackground();
    }

    if (playerCount === 0) {
      this.scene.start('Play', {
        ...this.playerManager.getPlayersData(),
        generation: this.generation + 1,
        seed: this.seed,
      } as PlayDataType);
    }
  };

  /**
   * Smoothly transitions to the next background theme
   * Uses crossfade: current fades out while next fades in
   */
  private transitionToNextBackground = (): void => {
    if (this.isTransitioning) return;

    const bgConfigs = config.backgroundConfig;
    const currentBgId = bgConfigs[this.currentBackgroundIndex].id;
    const nextBackgroundIndex =
      (this.currentBackgroundIndex + 1) % bgConfigs.length;
    const nextBgId = bgConfigs[nextBackgroundIndex].id;

    this.isTransitioning = true;

    // Get layers for current and next backgrounds
    const currentLayers = this.backgroundLayers.filter(
      (bg) => bg.bgId === currentBgId,
    );
    const nextLayers = this.backgroundLayers.filter(
      (bg) => bg.bgId === nextBgId,
    );

    // Fade out current background layers
    currentLayers.forEach((bg) => {
      this.tweens.add({
        targets: bg.sprite,
        alpha: 0,
        duration: this.TRANSITION_DURATION,
        ease: 'Sine.easeInOut',
      });
    });

    // Fade in next background layers
    nextLayers.forEach((bg) => {
      this.tweens.add({
        targets: bg.sprite,
        alpha: 1,
        duration: this.TRANSITION_DURATION,
        ease: 'Sine.easeInOut',
      });
    });

    // Update state after transition completes
    this.time.delayedCall(this.TRANSITION_DURATION, () => {
      this.currentBackgroundIndex = nextBackgroundIndex;
      this.lastBackgroundChangePlatform =
        this.platformManager.getPlatformsSpawned();
      this.isTransitioning = false;
    });
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

    // Load ALL background layers for smooth transitions
    config.backgroundConfig.forEach((bgConfig) => {
      bgConfig.layers.forEach((layer) => {
        this.load.image(`${bgConfig.id}-${layer.image}`, layer.path);
      });
    });

    // Load ALL player skins (for species-based visual speciation)
    config.playerConfig.forEach((charConfig) => {
      this.load.spritesheet(charConfig.id, charConfig.assetPath, {
        frameWidth: charConfig.frameWidth,
        frameHeight: charConfig.frameHeight,
      });
    });

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

    // Load projectiles as full images (not spritesheets)
    projectileConfig.forEach((projConf) => {
      this.load.image(projConf.id, projConf.assetPath);
    });
  };
}

export default Play;
