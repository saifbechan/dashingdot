import config from '@/lib/config';
import { EffectNames, PlayerNames, ProjectileNames } from '@/lib/constants';
import { gameStateBridge } from '@/store/bridge';
import { type NEATConfig } from '../AI/NEAT';
import { getNEATController } from '../AI/NEAT/instance';
import { type PlayDataType } from '../Scenes/Play';
import type EffectManager from './EffectManager';
import Player, { type EvolveableType } from './Player';

// Get all player skins for species mapping
const PLAYER_SKINS = Object.values(PlayerNames);

export default class PlayerManager extends Phaser.GameObjects.Group {
  private readonly playersData: EvolveableType[] = [];
  private effectManager: EffectManager;
  private neatController: ReturnType<typeof getNEATController>;

  constructor(
    scene: Phaser.Scene,
    playersData: EvolveableType[],
    effectManager: EffectManager,
  ) {
    super(scene);
    this.effectManager = effectManager;

    // Create NEAT configuration
    const neatConfig: NEATConfig = {
      populationSize: 160,
      inputCount: config.model.inputs,
      outputCount: config.model.outputs,
      maxHiddenNodes: 20,
      targetSpecies: 8,

      // Species config
      compatibilityThreshold: 2.0, // Higher threshold = more genetic diversity within species
      compatibilityModifier: 0.2, // Slower adjustment
      excessCoefficient: 1.0, // Balance structure vs weights
      disjointCoefficient: 1.0,
      weightDifferenceCoefficient: 0.5, // Less sensitive to weight differences
      stagnationLimit: 10, // Faster removal of stagnant species

      // Evolution rates - increased diversity
      survivalRate: 0.3, // Keep more parents for genetic diversity
      interspeciesCrossoverRate: 0.05, // 5% chance to breed across species
      mutationRates: {
        weight: 0.8,
        node: 0.05, // Slightly lower to let weights optimize first
        connection: 0.08,
        perturbWeight: 0.85, // More chance of complete weight reset
      },
    };

    // Get persistent controller instance
    this.neatController = getNEATController(neatConfig);

    // If we have previous generation data, run evolution
    if (playersData.length > 0) {
      // Update fitness directly on genome objects using the reference
      playersData.forEach((p) => {
        p.genome.fitness = p.fitness;
      });

      this.neatController.epoch();
    }

    // Create players from genomes
    this.createPlayersFromPopulation(scene);
  }

  /**
   * Create Player instances from the NEAT population
   */
  private createPlayersFromPopulation(scene: Phaser.Scene): void {
    const population = this.neatController.getPopulation();

    for (const { genome, speciesId } of population) {
      const projectileNames = Object.values(ProjectileNames);
      const randomProjectile =
        projectileNames[Math.floor(Math.random() * projectileNames.length)];

      // Map species to player skin (8 species = 8 skins)
      const playerSkin = this.getSkinForSpecies(speciesId);

      this.add(
        new Player(
          scene,
          50,
          scene.scale.height / 2,
          genome,
          speciesId,
          playerSkin,
          randomProjectile,
        ),
      );
    }
  }

  /**
   * Map species ID to player skin
   */
  private getSkinForSpecies(speciesId: number): PlayerNames {
    return PLAYER_SKINS[speciesId % PLAYER_SKINS.length];
  }

  public getPlayerById(id: string): Player | undefined {
    return this.getChildren().find((p) => (p as Player).id === id) as
      | Player
      | undefined;
  }

  public isTopPlayer(id: string): boolean {
    const children = this.getChildren();
    if (children.length === 0) return false;
    return (children[0] as Player).id === id;
  }

  public killPlayer(player: Player, effectName: EffectNames): void {
    // Play requested effect using EffectManager
    if (effectName === EffectNames.CLOUD) {
      player.markFellOff(); // Mark as fell off if it's the cloud death (falling)
      this.effectManager.playEffect(player.x, player.y + 30, effectName);
    } else {
      this.effectManager.playEffect(player.x, player.y, effectName);
    }

    this.playersData.push(player.getPlayersData());

    this.killAndHide(player);
    this.remove(player, true, true);
  }

  update = (): void => {
    const children = this.getChildren();
    const playersAlive = children.length;

    // Update dashboard with players alive
    gameStateBridge.updatePlayersAlive(playersAlive);

    children.forEach((child: Phaser.GameObjects.GameObject, index: number) => {
      const player = child as Player;

      player.setTransparency(index > 0 ? 0.3 : 1);

      if (player.y >= this.scene.scale.height - 50) {
        this.killPlayer(player, EffectNames.CLOUD);
      }
    });

    // Update top player stats for dashboard
    if (children.length > 0) {
      const topPlayer = children[0] as Player;
      const stats = topPlayer.getPlayersData();
      const skinName = PLAYER_SKINS[stats.speciesId % PLAYER_SKINS.length];

      gameStateBridge.updateTopPlayerStats({
        id: topPlayer.id,
        speciesName: skinName,
        fitness: stats.fitness,
        timeAlive: topPlayer.getTimeAlive(),
        mobsKilled: topPlayer.getMobsKilled(),
        itemsCollected: topPlayer.getItemsCollected(),
        ammo: topPlayer.getAmmo(),
      });
    } else {
      gameStateBridge.updateTopPlayerStats(null);
    }
  };

  getPlayersData = (): PlayDataType =>
    ({
      playersData: this.playersData,
    }) as PlayDataType;
}
