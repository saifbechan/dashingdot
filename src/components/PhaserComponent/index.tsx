'use client';

import { useSetAtom } from 'jotai';
import { Game } from 'phaser';
import { useEffect, useRef, type JSX } from 'react';
import config from '../../lib/config';
import { gameStateBridge } from '../../store/bridge';
import {
  generationHistoryAtom,
  generationStatsAtom,
  isGamePausedAtom,
  playersAliveAtom,
  sessionStatsAtom,
  topPlayerStatsAtom,
} from '../../store/gameState';

const PhaserComponent = (): JSX.Element => {
  const phaserRef = useRef<Game>(undefined);
  const canvasRef = useRef<HTMLElement>(null);

  // Register Jotai setters with the bridge
  const setGenerationStats = useSetAtom(generationStatsAtom);
  const setSessionStats = useSetAtom(sessionStatsAtom);
  const setTopPlayerStats = useSetAtom(topPlayerStatsAtom);
  const setGenerationHistory = useSetAtom(generationHistoryAtom);
  const setPlayersAlive = useSetAtom(playersAliveAtom);
  const setIsGamePaused = useSetAtom(isGamePausedAtom);

  useEffect(() => {
    // Register setters with bridge so Phaser can update React state
    gameStateBridge.registerSetters({
      setGenerationStats,
      setSessionStats,
      setTopPlayerStats,
      setGenerationHistory,
      setPlayersAlive,
      setIsGamePaused,
    });

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
  }, [
    setGenerationStats,
    setSessionStats,
    setTopPlayerStats,
    setGenerationHistory,
    setPlayersAlive,
    setIsGamePaused,
  ]);

  return <main ref={canvasRef} className="flex-shrink-0" />;
};

export default PhaserComponent;
