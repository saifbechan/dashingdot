import React, { useEffect, useRef } from 'react';

import { Game } from 'phaser';

import Scene from '../../phaser/scene';

const PhaserComponent = () => {
  const phaserRef = useRef<Game>();
  const canvasRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (phaserRef !== null) {
      phaserRef.current?.destroy(true);
      phaserRef.current = new Game({
        backgroundColor: '#ccc',
        type: Phaser.AUTO,
        parent: canvasRef.current || undefined,
        width: window.innerWidth,
        height: window.innerHeight,
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 300 },
            debug: true,
          },
        },
        scene: Scene,
      });
    }
  }, []);

  return <main data-testid="phaser" ref={canvasRef} />;
};

export default PhaserComponent;
