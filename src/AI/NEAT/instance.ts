/**
 * Global NEAT Controller Instance
 *
 * Maintains a single instance of the NEAT controller across scene restarts.
 * This is crucial because Phaser re-instantiates PlayerManager on scene restart,
 * and we don't want to lose our evolutionary progress.
 */

import { NEATController, type NEATConfig } from './index';

let instance: NEATController | null = null;

export const getNEATController = (config: NEATConfig): NEATController => {
  instance ??= new NEATController(config);
  return instance;
};

export const resetNEATController = (): void => {
  instance = null;
};
