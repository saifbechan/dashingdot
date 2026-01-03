'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { gameStateBridge } from '@/store/bridge';
import {
  allTimeChampionsAtom,
  generationHistoryAtom,
  generationStatsAtom,
  isGamePausedAtom,
  playersAliveAtom,
  sessionStatsAtom,
  topPlayerStatsAtom,
} from '@/store/gameState';
import { useAtom } from 'jotai';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Brain,
  Cpu,
  Fingerprint,
  History,
  Layers,
  Layout,
  LineChart,
  Microwave,
  Orbit,
  Pause,
  Play,
  Radiation,
  Share2,
  Shell,
  Trophy,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${String(hours)}h ${String(minutes % 60)}m`;
  if (minutes > 0) return `${String(minutes)}m ${String(seconds % 60)}s`;
  return `${String(seconds)}s`;
};

/**
 * Custom Tooltip Component
 */
const Tooltip = ({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="group relative flex">
      {children}
      <div className="bg-popover text-popover-foreground pointer-events-none absolute -top-10 left-1/2 z-[100] -translate-x-1/2 rounded border border-white/10 px-2 py-1 text-[10px] font-medium opacity-0 shadow-xl transition-all group-hover:opacity-100">
        {text}
        <div className="bg-popover absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b border-white/10" />
      </div>
    </div>
  );
};

/**
 * Circular Progress Component
 */
const CircularProgress = ({
  value,
  size = 60,
  strokeWidth = 6,
  color = 'var(--color-viz-cyan)',
  label,
  tooltip,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  tooltip?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <Tooltip text={tooltip ?? label ?? ''}>
      <div className="flex flex-col items-center gap-2">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90 transform">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-white/5"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              style={{
                strokeDashoffset: offset,
                transition: 'stroke-dashoffset 0.8s ease-in-out',
                filter: `drop-shadow(0 0 4px ${color})`,
              }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold tabular-nums">
              {Math.round(value)}%
            </span>
          </div>
        </div>
        {label ? (
          <span className="text-muted-foreground text-[9px] font-semibold tracking-tighter uppercase">
            {label}
          </span>
        ) : null}
      </div>
    </Tooltip>
  );
};

/**
 * Modern High-Graph Bar
 */
const HighGraph = ({
  data,
  color = 'var(--color-viz-pink)',
  label,
  height = 16,
}: {
  data: number[];
  color?: string;
  label: string;
  height?: number;
}) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-wider text-white/40 uppercase">
          {label}
        </span>
        <ArrowUpRight className="h-3 w-3 text-white/20" />
      </div>
      <div
        className="flex items-end gap-[1px] px-1"
        style={{ height: height * 4 }}
      >
        {data.slice(-50).map((v, i) => (
          <div
            key={i}
            className="group relative flex-1 rounded-sm"
            style={{
              height: `${String((v / max) * 100)}%`,
              backgroundColor: color,
              opacity: 0.2 + (i / Math.min(data.length, 50)) * 0.8,
              boxShadow:
                i === Math.min(data.length, 50) - 1
                  ? `0 0 10px ${color}80`
                  : 'none',
            }}
          >
            <div className="bg-popover absolute -top-10 left-1/2 z-50 -translate-x-1/2 rounded border border-white/10 px-2 py-1 text-[8px] whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
              Val: {Math.floor(v)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Wave Display
 */
const ActivityWave = ({ active }: { active: boolean }) => {
  return (
    <div className="flex h-4 items-center gap-[2px]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={`bg-primary w-[2px] rounded-full transition-all duration-300 ${active ? 'animate-pulse' : 'opacity-20'}`}
          style={{
            height: active ? `${String(30 + (i % 5) * 15)}%` : '20%',
            animationDelay: `${String(i * 0.1)}s`,
          }}
        />
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [generationStats, setGenerationStats] = useAtom(generationStatsAtom);
  const [sessionStats, setSessionStats] = useAtom(sessionStatsAtom);
  const [topPlayer, setTopPlayerStats] = useAtom(topPlayerStatsAtom);
  const [history, setGenerationHistory] = useAtom(generationHistoryAtom);
  const [playersAlive, setPlayersAlive] = useAtom(playersAliveAtom);
  const [isPaused, setIsPaused] = useAtom(isGamePausedAtom);
  const [allTimeChampions, setAllTimeChampions] = useAtom(allTimeChampionsAtom);

  const [selectedSpeciesId, setSelectedSpeciesId] = useState<number | null>(
    null,
  );

  // Register bridge setters
  useEffect(() => {
    gameStateBridge.registerSetters({
      setGenerationStats,
      setSessionStats,
      setTopPlayerStats,
      setGenerationHistory,
      setPlayersAlive,
      setIsGamePaused: setIsPaused,
      setAllTimeChampions,
    });
  }, [
    setAllTimeChampions,
    setGenerationHistory,
    setGenerationStats,
    setIsPaused,
    setPlayersAlive,
    setSessionStats,
    setTopPlayerStats,
  ]);

  // Derived Stats
  const efficiency = useMemo(() => {
    if (generationStats.population === 0) return 0;
    return (playersAlive / generationStats.population) * 100;
  }, [playersAlive, generationStats.population]);

  const complexity = useMemo(() => {
    const base = 100;
    const max = 300;
    const val = ((generationStats.avgComplexity - base) / (max - base)) * 100;
    return Math.min(100, Math.max(0, val || 0));
  }, [generationStats.avgComplexity]);

  const stability = useMemo(() => {
    if (generationStats.species.length === 0) return 100;
    const avgStagnation =
      generationStats.species.reduce((a, b) => a + b.stagnation, 0) /
      generationStats.species.length;
    return Math.max(0, 100 - avgStagnation * 5);
  }, [generationStats.species]);

  const elapsedTime = sessionStats.totalGenerations * 5000;

  const getRankIcon = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${String(rank + 1)}`;
  };

  return (
    <div className="dot-grid text-foreground flex h-full flex-col overflow-hidden bg-[#01040a]">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#0d1117]/50 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="from-viz-pink to-viz-purple shadow-viz-pink/20 rounded-xl bg-gradient-to-br p-2 shadow-lg">
            <Orbit className="animate-spin-slow h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tighter text-white/90 uppercase">
              Neural Topology Engine
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-viz-cyan font-mono text-[9px] leading-none tracking-widest uppercase">
                {isPaused ? 'Optimization Halted' : 'Active Optimization'}
              </span>
              <ActivityWave active={playersAlive > 0 && !isPaused} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const newPaused = !isPaused;
              setIsPaused(newPaused);
              gameStateBridge.setGamePaused(newPaused);
            }}
            className="rounded-full p-2 transition-colors hover:bg-white/10"
          >
            {isPaused ? (
              <Play className="fill-viz-cyan text-viz-cyan h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4 fill-white text-white" />
            )}
          </button>
          <div className="text-right">
            <p className="text-muted-foreground mb-1 text-[8px] tracking-widest uppercase">
              Vocalis Core
            </p>
            <p className="font-mono text-[10px] font-bold text-white/60">
              v1.5.4-BETA
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Metrics Section */}
      <div className="flex flex-col gap-6 p-6 pb-2">
        {/* Main Visual Stats Row */}
        <div className="grid grid-cols-3 gap-6">
          <CircularProgress
            value={efficiency}
            label="Efficiency"
            tooltip="Population health and survival rate"
            color="var(--color-viz-cyan)"
          />
          <CircularProgress
            value={complexity}
            label="Complexity"
            tooltip="Neural network density and innovation"
            color="var(--color-viz-purple)"
          />
          <CircularProgress
            value={stability}
            label="Stability"
            tooltip="Generic drift and stagnation risk"
            color="var(--color-viz-orange)"
          />
        </div>

        {/* Evolution Pulse Card */}
        <Card className="glass relative overflow-hidden border-white/10 bg-white/[0.02]">
          <div className="absolute top-0 right-0 p-3">
            <Badge
              variant="outline"
              className="border-viz-cyan/30 text-viz-cyan bg-viz-cyan/5 text-[8px] backdrop-blur-sm"
            >
              LIVE STREAM
            </Badge>
          </div>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] font-bold uppercase">
                  Gen Cycle
                </span>
                <span className="data-text text-5xl leading-none font-black tracking-tighter text-white">
                  {String(generationStats.generation).padStart(3, '0')}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-white/30 uppercase">
                    Max Fit
                  </span>
                  <span className="text-xl font-black text-white tabular-nums">
                    {Math.floor(generationStats.bestFitness)}
                  </span>
                  {generationStats.bestFitnessDelta !== undefined &&
                    generationStats.bestFitnessDelta !== 0 && (
                      <span
                        className={`text-[10px] font-bold ${generationStats.bestFitnessDelta > 0 ? 'text-viz-cyan' : 'text-viz-pink'}`}
                      >
                        {generationStats.bestFitnessDelta > 0 ? '+' : ''}
                        {Math.floor(generationStats.bestFitnessDelta)}
                      </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-white/30 uppercase">
                    Avg Fit
                  </span>
                  <span className="text-sm font-bold text-white/60 tabular-nums">
                    {Math.floor(generationStats.avgFitness)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-4">
              <div className="flex flex-col rounded-xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-3">
                <span className="mb-1 text-[9px] font-bold text-white/30 uppercase">
                  Diversity
                </span>
                <div className="flex items-center gap-2">
                  <Fingerprint className="text-viz-cyan h-4 w-4" />
                  <span className="font-mono text-xl font-bold text-white/90">
                    {generationStats.speciesCount}{' '}
                    <span className="text-[10px] text-white/30">Taxa</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col rounded-xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-3">
                <span className="mb-1 text-[9px] font-bold text-white/30 uppercase">
                  Active Pop
                </span>
                <div className="flex items-center gap-2">
                  <Radiation className="text-viz-pink h-4 w-4" />
                  <span className="font-mono text-xl font-bold text-white/90">
                    {playersAlive} / {generationStats.population}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
          <div className="from-viz-cyan via-viz-purple to-viz-pink h-[2px] w-full bg-gradient-to-r opacity-50" />
        </Card>
      </div>

      {/* Tabs System - Flex container to handle internal scroll */}
      <Tabs
        defaultValue="taxonomy"
        className="flex flex-1 flex-col overflow-hidden px-6 pb-2"
      >
        <TabsList className="mb-4 h-11 w-full shrink-0 rounded-xl border border-white/5 bg-[#161b22] p-1 shadow-inner">
          <TabsTrigger
            value="visuals"
            className="flex-1 rounded-lg text-[10px] font-black uppercase transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <LineChart className="mr-2 h-3 w-3" />
            Data
          </TabsTrigger>
          <TabsTrigger
            value="taxonomy"
            className="flex-1 rounded-lg text-[10px] font-black uppercase transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <Layout className="mr-2 h-3 w-3" />
            Rankings
          </TabsTrigger>
          <TabsTrigger
            value="champions"
            className="flex-1 rounded-lg text-[10px] font-black uppercase transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <Trophy className="mr-2 h-3 w-3" />
            HOF
          </TabsTrigger>
          <TabsTrigger
            value="engine"
            className="flex-1 rounded-lg text-[10px] font-black uppercase transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <Cpu className="mr-2 h-3 w-3" />
            Node
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <TabsContent
              value="visuals"
              className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-6 pr-4 pb-4 duration-500"
            >
              <div className="grid grid-cols-1 gap-6">
                <HighGraph
                  data={history.map((h) => h.bestFitness)}
                  label="Fitness Trajectory (Best)"
                  color="var(--color-viz-cyan)"
                  height={24}
                />
                <HighGraph
                  data={history.map((h) => h.avgFitness)}
                  label="Convergence Map (Avg)"
                  color="var(--color-viz-purple)"
                  height={16}
                />
              </div>

              {topPlayer ? (
                <div className="glass group relative flex flex-col gap-3 rounded-2xl border border-white/5 p-4 transition-all hover:bg-white/[0.04]">
                  <div className="absolute -top-2 -right-2 rotate-12">
                    <Badge className="bg-viz-cyan border-none px-2 py-0.5 text-[8px] font-black text-black uppercase">
                      GENETIC PEAK
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shell className="text-viz-cyan h-4 w-4 animate-pulse" />
                      <span className="text-[10px] font-black text-white/60 uppercase">
                        Apex Individual
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-viz-cyan border-viz-cyan/20 text-[9px] font-black uppercase"
                    >
                      {topPlayer.speciesName}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center rounded-xl border border-white/5 bg-white/5 p-3 transition-colors group-hover:bg-white/10">
                      <span className="mb-1 text-[8px] text-white/30 uppercase">
                        Kills
                      </span>
                      <span className="text-xl font-black text-white">
                        {topPlayer.mobsKilled}
                      </span>
                    </div>
                    <div className="flex flex-col items-center rounded-xl border border-white/5 bg-white/5 p-3 transition-colors group-hover:bg-white/10">
                      <span className="mb-1 text-[8px] text-white/30 uppercase">
                        Energy
                      </span>
                      <span className="text-viz-cyan text-xl font-black tabular-nums">
                        {topPlayer.ammo}
                      </span>
                    </div>
                    <div className="flex flex-col items-center rounded-xl border border-white/5 bg-white/5 p-3 transition-colors group-hover:bg-white/10">
                      <span className="mb-1 text-[8px] text-white/30 uppercase">
                        Cycle
                      </span>
                      <span className="mt-1 text-[10px] font-black text-white/60">
                        {formatTime(topPlayer.timeAlive)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent
              value="taxonomy"
              className="animate-in fade-in slide-in-from-bottom-2 pr-4 pb-4 duration-500"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase">
                    <Share2 className="text-viz-purple h-3 w-3" />
                    Population Rankings
                  </div>
                  <Badge
                    variant="outline"
                    className="border-white/10 text-[9px] text-white/20"
                  >
                    SORTED BY FITNESS
                  </Badge>
                </div>

                <div className="flex flex-col gap-3">
                  {generationStats.species.map((s, i) => (
                    <div
                      key={s.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedSpeciesId(
                          s.id === selectedSpeciesId ? null : s.id,
                        );
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedSpeciesId(
                            s.id === selectedSpeciesId ? null : s.id,
                          );
                        }
                      }}
                      className={`group relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3 transition-all ${s.id === selectedSpeciesId ? 'border-viz-cyan/50 bg-viz-cyan/5' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] font-bold text-white/20">
                            {getRankIcon(i)}
                          </span>
                          <span
                            className={`text-[11px] font-black tracking-tight uppercase ${s.id === selectedSpeciesId ? 'text-viz-cyan' : 'text-white/80'}`}
                          >
                            {s.name}
                          </span>
                          {s.momentum === 'up' && (
                            <ArrowUp className="text-viz-cyan h-3 w-3" />
                          )}
                          {s.momentum === 'down' && (
                            <ArrowDown className="text-viz-pink h-3 w-3" />
                          )}
                          {s.stagnation > 5 && (
                            <Tooltip
                              text={`Stagnated for ${String(s.stagnation)} generations`}
                            >
                              <div className="bg-viz-orange h-1.5 w-1.5 animate-pulse rounded-full" />
                            </Tooltip>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold tabular-nums">
                          <div className="flex flex-col items-end">
                            <span className="text-viz-cyan">
                              {Math.floor(s.avgFitness)} FIT
                            </span>
                            <span className="text-[8px] text-white/20">
                              PEAK: {Math.floor(s.bestFitness)}
                            </span>
                          </div>
                          <div className="flex flex-col items-end border-l border-white/5 pl-3">
                            <span className="text-white/60">{s.members} U</span>
                            <span className="text-[8px] text-white/20">
                              GEN {s.bornGen}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-all duration-1000"
                          style={{
                            width: `${String((s.members / generationStats.population) * 100)}%`,
                            background: `linear-gradient(90deg, var(--color-viz-cyan) 0%, var(--color-viz-purple) 100%)`,
                            opacity: 1 - i * 0.1,
                          }}
                        />
                      </div>

                      {/* Expandable Technical Details */}
                      {s.id === selectedSpeciesId && (
                        <div className="animate-in zoom-in-95 mt-2 grid grid-cols-2 gap-4 border-t border-white/5 pt-3 duration-200">
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-[9px] text-white/40 uppercase">
                              <span>Complexity</span>
                              <span className="text-white/80">Net Map</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-white">
                                  {s.avgNodes.toFixed(1)}
                                </span>
                                <span className="text-[7px] text-white/30 uppercase">
                                  Avg Nodes
                                </span>
                              </div>
                              <div className="h-4 w-[1px] bg-white/10" />
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-white">
                                  {s.avgConnections.toFixed(1)}
                                </span>
                                <span className="text-[7px] text-white/30 uppercase">
                                  Avg Conns
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-[9px] text-white/40 uppercase">
                              <span>Stability</span>
                              <span className="text-white/80">Health</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                                <div
                                  className="bg-viz-orange h-full transition-all"
                                  style={{
                                    width: `${String(Math.max(0, 100 - s.stagnation * 10))}%`,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-white/60">
                                {s.stagnation} S
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="champions"
              className="animate-in fade-in slide-in-from-bottom-2 pr-4 pb-4 duration-500"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase">
                    <Trophy className="text-viz-orange h-3 w-3" />
                    Hall of Fame
                  </div>
                  <Badge
                    variant="outline"
                    className="border-white/10 text-[9px] text-white/20"
                  >
                    ALL-TIME RECORDS
                  </Badge>
                </div>

                <div className="flex flex-col gap-3">
                  {allTimeChampions.length > 0 ? (
                    allTimeChampions.map((champ, i) => (
                      <div
                        key={champ.id + String(i)}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 font-black ${i === 0 ? 'bg-viz-cyan/20 border-viz-cyan/30 text-viz-cyan' : 'text-white/40'}`}
                          >
                            {i + 1}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black tracking-tight text-white/90 uppercase">
                              {champ.speciesName}
                            </span>
                            <span className="text-[9px] text-white/30 uppercase">
                              {formatTime(champ.timeAlive)} Runtime
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-white tabular-nums">
                            {Math.floor(champ.fitness)}
                          </span>
                          <div className="flex gap-2">
                            <span className="text-[8px] text-white/30 uppercase">
                              {champ.mobsKilled} Kills
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 bg-white/[0.02] p-10 text-center">
                      <Zap className="mb-3 h-8 w-8 text-white/10" />
                      <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase">
                        Awaiting Champions...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="engine"
              className="animate-in fade-in slide-in-from-bottom-2 pr-4 pb-4 duration-500"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="glass flex flex-col rounded-xl p-4 transition-transform hover:scale-[1.02]">
                  <Microwave className="text-viz-orange mb-2 h-4 w-4" />
                  <span className="mb-1 text-[8px] font-black text-white/30 uppercase">
                    Session Run
                  </span>
                  <span className="text-lg font-black text-white tabular-nums">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
                <div className="glass flex flex-col rounded-xl p-4 transition-transform hover:scale-[1.02]">
                  <Brain className="text-viz-cyan mb-2 h-4 w-4" />
                  <span className="mb-1 text-[8px] font-black text-white/30 uppercase">
                    Mutations
                  </span>
                  <span className="text-lg font-black text-white tabular-nums">
                    {sessionStats.totalGenerations * 16}
                  </span>
                </div>
                <div className="glass flex flex-col rounded-xl p-4 transition-transform hover:scale-[1.02]">
                  <Zap className="text-viz-pink mb-2 h-4 w-4" />
                  <span className="mb-1 text-[8px] font-black text-white/30 uppercase">
                    Peak Fitness
                  </span>
                  <span className="text-lg font-black text-white tabular-nums">
                    {Math.floor(sessionStats.peakFitness)}
                  </span>
                </div>
                <div className="glass flex flex-col rounded-xl p-4 transition-transform hover:scale-[1.02]">
                  <Layers className="text-viz-purple mb-2 h-4 w-4" />
                  <span className="mb-1 text-[8px] font-black text-white/30 uppercase">
                    Nodes Sum
                  </span>
                  <span className="text-lg font-black text-white tabular-nums">
                    {~~generationStats.avgComplexity}
                  </span>
                </div>
              </div>

              <div className="glass mt-4 flex flex-col gap-3 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <History className="h-3 w-3 text-white/40" />
                  <span className="text-[9px] font-bold text-white/40 uppercase">
                    System Parameters
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">Target species</span>
                    <span className="font-mono text-white/80">5.0</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">Speciation Threshold</span>
                    <span className="font-mono text-white/80">3.0</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">Mutation Rate</span>
                    <span className="font-mono text-white/80">3%</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </div>
      </Tabs>

      {/* Modern Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-white/5 bg-white/[0.01] px-6 py-4">
        <div className="flex items-center gap-2">
          <Activity
            className={`${playersAlive > 0 ? 'text-viz-cyan' : 'text-white/20'} h-3 w-3 animate-pulse`}
          />
          <span className="text-[9px] font-black tracking-widest text-white/40 uppercase">
            Neural Engine // Status: {playersAlive > 0 ? 'Optimal' : 'Idle'}
          </span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className={`h-1.5 w-1.5 rounded-full transition-shadow duration-500 ${playersAlive > 0 ? 'bg-viz-cyan shadow-[0_0_8px_var(--color-viz-cyan)]' : 'bg-white/10'}`}
            />
            <span className="text-[9px] font-bold text-white/60">EVOL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`h-1.5 w-1.5 rounded-full transition-shadow duration-500 ${!isPaused ? 'bg-viz-pink shadow-[0_0_8px_var(--color-viz-pink)]' : 'bg-white/10'}`}
            />
            <span className="text-[9px] font-bold text-white/60">PROC</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .dot-grid {
          background-image: radial-gradient(
            rgba(255, 255, 255, 0.03) 1px,
            transparent 1px
          );
          background-size: 24px 24px;
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }

        .data-text {
          font-variant-numeric: tabular-nums;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }

        .glass {
          background: rgba(255, 255, 255, 0.01);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
}
