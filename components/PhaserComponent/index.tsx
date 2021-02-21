import React, { useEffect, useRef } from 'react';

import { Game } from 'phaser';

import config from '../../phaser/config';

const PhaserComponent = (): JSX.Element => {
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
  }, []);

  return <main data-testid="phaser" ref={canvasRef} />;
};

export default PhaserComponent;
