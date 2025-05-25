import { Game } from 'phaser';
import { setBackend } from '@tensorflow/tfjs';
import React, { useEffect, useRef, type JSX } from 'react';
import config from '../../lib/config';

const PhaserComponent = (): JSX.Element => {
  setBackend('cpu').then();

  const phaserRef = useRef<Game>(undefined);
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
      phaserRef.current.canvas.setAttribute('role', 'world');
    }

    return () => {
      window.location.reload();
    };
  }, []);

  return <main ref={canvasRef} />;
};

export default PhaserComponent;
