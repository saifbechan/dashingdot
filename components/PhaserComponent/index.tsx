import React, { useEffect, useRef } from 'react';

import * as tf from '@tensorflow/tfjs';
import { Game } from 'phaser';

import config from '../../World/config';

const PhaserComponent = (): JSX.Element => {
  tf.setBackend('cpu').then();

  const phaserRef = useRef<Game>();
  const canvasRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (phaserRef !== null) {
      phaserRef.current?.destroy(true);
      phaserRef.current = new Game({
        ...config.game,
        scale: {
          ...config.game.scale,
          parent: canvasRef.current || undefined,
        },
      });
    }

    return () => {
      window.location.reload();
    };
  }, []);

  return <main data-testid="phaser" ref={canvasRef} />;
};

export default PhaserComponent;
