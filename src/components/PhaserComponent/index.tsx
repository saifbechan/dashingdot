import { setBackend } from '@tensorflow/tfjs';
import { Game } from 'phaser';
import { useEffect, useRef, type JSX } from 'react';
import config from '../../lib/config';

const PhaserComponent = (): JSX.Element => {
  const phaserRef = useRef<Game>(undefined);
  const canvasRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let isMounted = true;

    setBackend('cpu')
      .then(() => {
        if (!isMounted) return;

        phaserRef.current?.destroy(true);
        phaserRef.current = new Game({
          ...config.game,
          scale: {
            ...config.game.scale,
            parent: canvasRef.current ?? undefined,
          },
        });
        phaserRef.current.canvas.setAttribute('role', 'world');
      })
      .catch(console.error);

    return () => {
      isMounted = false;
      phaserRef.current?.destroy(true);
      phaserRef.current = undefined;
    };
  }, []);

  return <main ref={canvasRef} />;
};

export default PhaserComponent;
