import config from '@/lib/config';
import { type PlayerNames, type ProjectileNames } from '@/lib/constants';
import { raycast } from '@/lib/Raycaster';
import Phaser from 'phaser';
import { v4 as uuidv4 } from 'uuid';
import { type Genome } from '../AI/NEAT';
import { type PlaySceneType } from '../Scenes/Play';

// Vision system constants
const RAY_ANGLES = [-45, -30, -15, 0, 15, 30, 45] as const;
const STATIC_INPUTS = 3; // y position, velocity, ammo
const INPUTS_PER_FRAME = STATIC_INPUTS + RAY_ANGLES.length * 2; // 17
const HISTORY_FRAMES = 3;
const TOTAL_HISTORY_SIZE = INPUTS_PER_FRAME * HISTORY_FRAMES; // 51

// Entity type encoding for neural network
const ENTITY_TYPE = {
  NOTHING: 0,
  PLATFORM: 0.33,
  MOB: 0.66,
  ITEM: 1.0,
} as const;

// Fixed timestep for AI updates (20 Hz)
const AI_TICK_MS = 50;

// Entity name prefixes for type detection
const MOB_PREFIX = 'mob-';
const ITEM_NAMES = ['powerup', 'coin', 'gem'];

export interface EvolveableType {
  genome: Genome;
  speciesId: number;
  fitness: number;
}

class Player extends Phaser.Physics.Arcade.Sprite {
  public readonly id: string;
  private readonly genome: Genome;
  public readonly speciesId: number;

  private timeAlive = 0;
  private totalSteps = 0;

  private ammo = 0;
  private projectileType: ProjectileNames;
  private lastShootTime = 0;
  private shootDelay = 250; // ms

  private debugGraphics?: Phaser.GameObjects.Graphics;

  // Ring buffer for O(1) history updates - zero allocation after init
  private historyBuffer: Float32Array = new Float32Array(TOTAL_HISTORY_SIZE);
  private historyFrameIndex = 0;

  // Pre-allocated arrays to avoid GC pressure
  private currentInputs: Float32Array = new Float32Array(INPUTS_PER_FRAME);
  private orderedHistory: Float32Array = new Float32Array(TOTAL_HISTORY_SIZE);

  private aiAccumulator = 0;
  private cachedPrediction: number[] | Uint8Array | Int32Array | Float32Array =
    [0, 0];

  // Lightweight raycaster - angles in radians for direct use
  private readonly rayAnglesRad: number[] = RAY_ANGLES.map((deg) =>
    Phaser.Math.DegToRad(deg),
  );
  private rayLength = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    genome: Genome,
    speciesId: number,
    name: PlayerNames,
    projectileType: ProjectileNames,
  ) {
    super(scene, x, y, name);

    this.id = uuidv4();
    this.setName(name);
    this.projectileType = projectileType;

    const { gravity } = config;

    this.genome = genome;
    this.speciesId = speciesId;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const charConfig = config.playerConfig.find(
      (c) => c.id === (name as string),
    );
    if (!charConfig) {
      console.warn(`Player config not found for ${name}`);
      return;
    }

    this.setScale(0.5);
    const bodySize = 85;
    this.setSize(bodySize, bodySize);
    this.setGravityY(gravity);

    // Center the body horizontally and align to bottom vertically with a slight adjustment
    const offsetX = (charConfig.frameWidth - bodySize) / 2;

    // Use configurable offset from player config
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const correction = (charConfig as any).offsetYCorrection ?? 20;

    const offsetY = charConfig.frameHeight - bodySize - correction;
    this.setOffset(offsetX, offsetY);

    const { walk, fly } = charConfig.animations;
    const cols = charConfig.cols;

    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers(name, {
        start: walk.row * cols,
        end: walk.row * cols + walk.frames - 1,
      }),
      frameRate: 16,
      repeat: -1,
    });

    this.anims.create({
      key: 'fly',
      frames: this.anims.generateFrameNumbers(name, {
        start: fly.row * cols,
        end: fly.row * cols + fly.frames - 1,
      }),
      frameRate: 16,
      repeat: -1,
    });

    // Initialize ray length based on screen width
    this.rayLength = this.scene.scale.width * 0.5;
  }

  preUpdate = (time: number, delta: number): void => {
    super.preUpdate(time, delta);

    if (!this.body) {
      throw new Error('Empty body');
    }

    this.timeAlive += 1;
    this.x = config.playerStartPosition;

    // Fixed timestep AI updates for frame-rate independence
    this.aiAccumulator += delta;
    if (this.aiAccumulator >= AI_TICK_MS) {
      this.aiAccumulator -= AI_TICK_MS;
      const scene = this.scene as PlaySceneType;
      const inputs = this.getInputs(scene);
      this.cachedPrediction = this.genome.activate(inputs);
    }

    const shouldJump = this.cachedPrediction[0] > 0.5;
    const shouldShoot = this.cachedPrediction[1] > 0.5;

    if (this.body.touching.down) {
      this.anims.play('walk', true);
      this.totalSteps += 1;

      // Detect new landing
      if (!this.wasTouchingDown) {
        this.platformJumps++;
      }

      if (shouldJump) {
        this.setVelocityY(config.jumpForce * -1);
      }
    } else {
      this.anims.play('fly', true);
    }

    this.wasTouchingDown = this.body.touching.down;

    if (shouldShoot && time > this.lastShootTime + this.shootDelay) {
      this.shoot(time);
    }
  };

  private shoot(time: number): void {
    if (this.ammo <= 0) return;

    this.ammo -= 1;
    this.lastShootTime = time;

    const scene = this.scene as PlaySceneType;
    const isTopPlayer = scene.playerManager.isTopPlayer(this.id);
    const bulletAlpha = isTopPlayer ? 1 : 0.25;

    scene.projectileManager.spawnProjectile(
      this.x + 20,
      this.y,
      this.projectileType,
      this.id,
      bulletAlpha,
    );
  }

  public addAmmo(amount: number): void {
    this.ammo += amount;
  }

  private getInputs = (scene: PlaySceneType): Float32Array => {
    if (!this.body) throw new Error('Empty body');

    // Static inputs
    this.currentInputs[0] = this.y / scene.scale.height;
    this.currentInputs[1] = this.body.velocity.y / 1000;
    this.currentInputs[2] = this.ammo / 10;

    // Debug graphics (only for visible player)
    if (config.showGuides && this.alpha === 1) {
      this.debugGraphics ??= scene.add.graphics();
      this.debugGraphics.clear();
      this.debugGraphics.lineStyle(1, 0x00ff00, 0.5);
    } else if (this.debugGraphics) {
      this.debugGraphics.destroy();
      this.debugGraphics = undefined;
    }

    // Cast rays using lightweight raycaster
    const originX = this.x + 20;
    const originY = this.y;
    let inputIndex = STATIC_INPUTS;

    for (const angleRad of this.rayAnglesRad) {
      // Cast ray against scene targets
      const hit = raycast(
        originX,
        originY,
        angleRad,
        this.rayLength,
        scene.raycastTargets,
      );

      if (hit) {
        this.currentInputs[inputIndex] = hit.distance / this.rayLength;
        this.currentInputs[inputIndex + 1] = this.getEntityType(hit.object);

        // Draw debug ray to hit point
        if (this.debugGraphics) {
          this.debugGraphics.lineBetween(
            originX,
            originY,
            hit.point.x,
            hit.point.y,
          );
        }
      } else {
        // No hit - max distance, nothing detected
        this.currentInputs[inputIndex] = 1.0;
        this.currentInputs[inputIndex + 1] = ENTITY_TYPE.NOTHING;

        // Draw full-length debug ray
        if (this.debugGraphics) {
          this.debugGraphics.lineBetween(
            originX,
            originY,
            originX + Math.cos(angleRad) * this.rayLength,
            originY + Math.sin(angleRad) * this.rayLength,
          );
        }
      }
      inputIndex += 2;
    }

    // Ring buffer update: O(1) with zero allocation
    const frameOffset = this.historyFrameIndex * INPUTS_PER_FRAME;
    this.historyBuffer.set(this.currentInputs, frameOffset);
    this.historyFrameIndex = (this.historyFrameIndex + 1) % HISTORY_FRAMES;

    // Build ordered output from ring buffer (oldest to newest)
    return this.buildOrderedHistory();
  };

  private getEntityType(object: Phaser.GameObjects.GameObject): number {
    const name = object.name || '';

    // Check if it's a mob (name contains mob prefix or is in mob config)
    if (name.startsWith(MOB_PREFIX) || name.includes('-fly')) {
      return ENTITY_TYPE.MOB;
    }

    // Check if it's an item
    if (ITEM_NAMES.some((itemName) => name.includes(itemName))) {
      return ENTITY_TYPE.ITEM;
    }

    // Default to platform
    return ENTITY_TYPE.PLATFORM;
  }

  private buildOrderedHistory(): Float32Array {
    // Read frames in order: oldest first
    // The next frame to be written is the oldest (it will be overwritten next)
    let outputIndex = 0;
    for (let frame = 0; frame < HISTORY_FRAMES; frame++) {
      const frameIndex = (this.historyFrameIndex + frame) % HISTORY_FRAMES;
      const frameOffset = frameIndex * INPUTS_PER_FRAME;
      for (let i = 0; i < INPUTS_PER_FRAME; i++) {
        this.orderedHistory[outputIndex++] =
          this.historyBuffer[frameOffset + i];
      }
    }
    return this.orderedHistory;
  }

  // Fitness tracking stats
  private mobsKilled = 0;
  private itemsCollected = 0;
  private platformJumps = 0;
  private fellOff = false;
  private wasTouchingDown = false;

  public recordMobKill(): void {
    this.mobsKilled++;
    this.addAmmo(2); // Bonus ammo for kills
  }

  public recordItemCollection(): void {
    this.itemsCollected++;
  }

  public markFellOff(): void {
    this.fellOff = true;
  }

  private calculateFitness(): number {
    // Multi-objective fitness function
    // 1. Survival is the baseline (timeAlive + distance/steps)
    // 2. Actions (killing, collecting) are multipliers or large bonuses

    let score = this.timeAlive + this.totalSteps;

    // bonuses
    score += this.mobsKilled * 100; // High reward for combat
    score += this.itemsCollected * 50; // Medium reward for looting
    score += this.platformJumps * 10; // Reward for successful landings

    // Penalties
    if (this.fellOff && this.timeAlive < 100) {
      score *= 0.5; // Penalty for early death by falling
    }

    return Math.max(0, score);
  }

  getPlayersData = (): EvolveableType =>
    ({
      genome: this.genome,
      speciesId: this.speciesId,
      fitness: this.calculateFitness(),
    }) as EvolveableType;

  setTransparency = (alpha: number): void => {
    this.alpha = alpha;
  };

  destroy(fromScene?: boolean): void {
    if (this.debugGraphics) {
      this.debugGraphics.destroy();
      this.debugGraphics = undefined;
    }

    super.destroy(fromScene);
  }
}

export default Player;
