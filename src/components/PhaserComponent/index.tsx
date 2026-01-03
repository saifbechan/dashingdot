import { Game } from 'phaser';
import { useEffect, useRef, type JSX } from 'react';
import config from '../../lib/config';

const PhaserComponent = (): JSX.Element => {
  const phaserRef = useRef<Game>(undefined);
  const canvasRef = useRef<HTMLElement>(null);

  useEffect(() => {
    phaserRef.current = new Game({
      ...config.game,
      scale: {
        ...config.game.scale,
        parent: canvasRef.current ?? undefined,
      },
    });
    phaserRef.current.canvas.setAttribute('role', 'world');

    return () => {
      phaserRef.current?.destroy(true);
      phaserRef.current = undefined;
    };
  }, []);

  return <main ref={canvasRef} />;
};

export default PhaserComponent;
