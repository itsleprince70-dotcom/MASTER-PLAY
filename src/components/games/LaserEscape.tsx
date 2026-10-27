import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Clock, Heart, Volume2, VolumeX, Pause, Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

interface LaserEscapeProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
  currentUser?: any;
  onBack?: () => void;
}

interface Laser {
  id: number;
  type: 'fixed' | 'pulsing' | 'moving';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isActive: boolean;
  isWarning: boolean;
  axis?: 'h' | 'v';
  min?: number;
  max?: number;
  speed?: number;
  dir?: number;
  pos?: number;
  period?: number; // cycle duration
}

export const LaserEscape: React.FC<LaserEscapeProps> = ({ onGameOver, currentUser, onBack }) => {
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(35);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'win_level' | 'defeat' | 'all_complete'>('playing');

  // Player position (grid coords: 0-9)
  const [player, setPlayer] = useState({ x: 0.5, y: 0.5 });
  const [invincible, setInvincible] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const lasersRef = useRef<Laser[]>([]);

  // 10 Level configurations: Maze grid 10x10 (1 = wall, 0 = open)
  const levelConfigs = [
    {
      level: 1,
      time: 40,
      maze: [
        [0,0,0,1,0,0,0,0,0,0],
        [1,1,0,1,0,1,1,1,1,0],
        [0,0,0,0,0,0,0,0,1,0],
        [0,1,1,1,1,1,0,0,1,0],
        [0,0,0,0,0,1,0,0,0,0],
        [1,1,1,1,0,1,0,1,1,0],
        [0,0,0,1,0,0,0,1,0,0],
        [0,1,0,1,1,1,0,1,0,1],
        [0,1,0,0,0,0,0,0,0,0],
        [0,1,1,1,1,1,1,1,1,0]
      ],
      lasers: [
        { id: 1, type: 'fixed' as const, x1: 2, y1: 2.5, x2: 6, y2: 2.5, isActive: true, isWarning: false },
        { id: 2, type: 'fixed' as const, x1: 4.5, y1: 6, x2: 4.5, y2: 8, isActive: true, isWarning: false },
      ]
    },
    {
      level: 2,
      time: 35,
      maze: [
        [0,0,1,0,0,0,1,0,0,0],
        [0,0,1,0,1,0,1,0,1,0],
        [1,0,0,0,1,0,0,0,1,0],
        [1,1,1,0,1,1,1,0,1,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,0,1,1,1,1,0],
        [0,0,0,1,0,0,0,0,1,0],
        [1,1,0,1,1,1,1,0,1,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,1,1,1,1,0,0]
      ],
      lasers: [
        { id: 1, type: 'fixed' as const, x1: 0, y1: 4.5, x2: 4, y2: 4.5, isActive: true, isWarning: false },
        { id: 2, type: 'fixed' as const, x1: 5, y1: 4.5, x2: 9, y2: 4.5, isActive: true, isWarning: false },
        { id: 3, type: 'fixed' as const, x1: 7.5, y1: 6, x2: 7.5, y2: 9, isActive: true, isWarning: false },
      ]
    },
    {
      level: 3,
      time: 35,
      maze: [
        [0,0,0,0,1,0,0,0,0,0],
        [1,1,1,0,1,0,1,1,1,0],
        [0,0,0,0,0,0,0,0,1,0],
        [0,1,1,1,0,1,1,0,1,0],
        [0,0,0,1,0,0,1,0,0,0],
        [1,1,0,1,1,0,1,1,1,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,1,1,0,1,1,0],
        [0,0,0,0,0,1,0,0,0,0],
        [1,1,1,1,0,1,1,1,1,0]
      ],
      lasers: [
        { id: 1, type: 'pulsing' as const, x1: 0, y1: 2.5, x2: 8, y2: 2.5, isActive: false, isWarning: false, period: 3 },
        { id: 2, type: 'pulsing' as const, x1: 0, y1: 6.5, x2: 9, y2: 6.5, isActive: false, isWarning: false, period: 3.5 },
      ]
    },
    {
      level: 4,
      time: 32,
      maze: [
        [0,0,0,1,0,0,0,0,1,0],
        [1,1,0,1,0,1,1,0,1,0],
        [0,0,0,0,0,1,0,0,0,0],
        [0,1,1,1,0,1,0,1,1,0],
        [0,0,0,1,0,0,0,1,0,0],
        [1,1,0,1,1,1,0,1,0,1],
        [0,0,0,0,0,1,0,0,0,0],
        [0,1,1,1,0,1,1,1,1,0],
        [0,0,0,1,0,0,0,0,0,0],
        [1,1,0,1,1,1,1,1,1,0]
      ],
      lasers: [
        { id: 1, type: 'pulsing' as const, x1: 0, y1: 2.5, x2: 5, y2: 2.5, isActive: false, isWarning: false, period: 2.8 },
        { id: 2, type: 'pulsing' as const, x1: 4.5, y1: 2, x2: 4.5, y2: 6, isActive: false, isWarning: false, period: 2.5 },
        { id: 3, type: 'fixed' as const, x1: 6, y1: 6.5, x2: 9, y2: 6.5, isActive: true, isWarning: false },
      ]
    },
    {
      level: 5,
      time: 35,
      maze: [
        [0,0,0,0,0,0,0,0,0,0],
        [1,1,1,0,1,1,1,0,1,1],
        [0,0,0,0,0,0,0,0,0,0],
        [1,0,1,1,1,0,1,1,1,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,0,1,1,1,0,1],
        [0,0,0,0,0,0,0,0,0,0],
        [1,1,0,1,1,1,0,1,1,1],
        [0,0,0,0,0,0,0,0,0,0],
        [1,1,1,1,1,1,1,1,1,0]
      ],
      lasers: [
        { id: 1, type: 'moving' as const, x1: 0, y1: 2.5, x2: 9, y2: 2.5, isActive: true, isWarning: false, axis: 'h' as const, min: 0, max: 9, speed: 2, dir: 1, pos: 2 },
        { id: 2, type: 'moving' as const, x1: 4.5, y1: 4, x2: 4.5, y2: 8, isActive: true, isWarning: false, axis: 'v' as const, min: 4, max: 8, speed: 1.5, dir: 1, pos: 5 },
      ]
    },
    {
      level: 6,
      time: 30,
      maze: [
        [0,0,1,0,0,0,0,1,0,0],
        [1,0,1,0,1,1,0,1,0,1],
        [0,0,0,0,1,0,0,0,0,0],
        [0,1,1,0,1,0,1,1,1,0],
        [0,0,0,0,0,0,0,0,1,0],
        [1,1,1,1,0,1,1,0,1,0],
        [0,0,0,1,0,0,1,0,0,0],
        [0,1,0,1,1,0,1,1,0,1],
        [0,1,0,0,0,0,0,0,0,0],
        [0,1,1,1,1,1,1,1,1,0]
      ],
      lasers: [
        { id: 1, type: 'moving' as const, x1: 1, y1: 4.5, x2: 8, y2: 4.5, isActive: true, isWarning: false, axis: 'h' as const, min: 1, max: 8, speed: 2.2, dir: 1, pos: 3 },
        { id: 2, type: 'pulsing' as const, x1: 0, y1: 8.5, x2: 8, y2: 8.5, isActive: false, isWarning: false, period: 2.5 },
      ]
    },
    {
      level: 7,
      time: 30,
      maze: [
        [0,0,0,1,0,0,0,0,0,0],
        [0,1,0,1,0,1,1,1,1,0],
        [0,1,0,0,0,0,0,0,1,0],
        [0,1,1,1,1,1,0,0,1,0],
        [0,0,0,0,0,1,0,0,0,0],
        [1,1,1,0,0,1,0,1,1,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,1,1,0,1,0,1],
        [0,0,0,0,0,0,0,1,0,0],
        [1,1,1,1,1,1,0,1,1,0]
      ],
      lasers: [
        { id: 1, type: 'moving' as const, x1: 0, y1: 6.5, x2: 9, y2: 6.5, isActive: true, isWarning: false, axis: 'h' as const, min: 0, max: 9, speed: 2.5, dir: 1, pos: 2 },
        { id: 2, type: 'pulsing' as const, x1: 2.5, y1: 2, x2: 2.5, y2: 6, isActive: false, isWarning: false, period: 2.4 },
        { id: 3, type: 'fixed' as const, x1: 6.5, y1: 3, x2: 6.5, y2: 7, isActive: true, isWarning: false },
      ]
    },
    {
      level: 8,
      time: 28,
      maze: [
        [0,0,1,0,0,0,1,0,0,0],
        [1,0,1,0,1,0,1,0,1,0],
        [0,0,0,0,1,0,0,0,1,0],
        [0,1,1,1,1,1,1,0,1,0],
        [0,0,0,0,0,0,0,0,0,0],
        [1,1,1,0,1,1,1,0,1,1],
        [0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,0,1,1,1,0,1],
        [0,0,0,1,0,0,0,1,0,0],
        [1,0,0,1,1,1,0,1,1,0]
      ],
      lasers: [
        { id: 1, type: 'moving' as const, x1: 0, y1: 4.5, x2: 9, y2: 4.5, isActive: true, isWarning: false, axis: 'h' as const, min: 0, max: 9, speed: 3, dir: 1, pos: 1 },
        { id: 2, type: 'moving' as const, x1: 0, y1: 6.5, x2: 9, y2: 6.5, isActive: true, isWarning: false, axis: 'h' as const, min: 0, max: 9, speed: 2.5, dir: -1, pos: 7 },
        { id: 3, type: 'pulsing' as const, x1: 4.5, y1: 6, x2: 4.5, y2: 9, isActive: false, isWarning: false, period: 2 },
      ]
    },
    {
      level: 9,
      time: 25,
      maze: [
        [0,0,0,0,1,0,0,0,0,0],
        [1,1,1,0,1,0,1,1,1,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,0,1,1,1,1,0],
        [0,0,0,1,0,0,0,0,1,0],
        [1,1,0,1,1,1,1,0,1,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,1,1,0,1,1,0],
        [0,0,0,0,0,1,0,0,0,0],
        [1,1,1,1,0,1,1,1,1,0]
      ],
      lasers: [
        { id: 1, type: 'pulsing' as const, x1: 0, y1: 2.5, x2: 9, y2: 2.5, isActive: false, isWarning: false, period: 2 },
        { id: 2, type: 'pulsing' as const, x1: 0, y1: 6.5, x2: 9, y2: 6.5, isActive: false, isWarning: false, period: 2.2 },
        { id: 3, type: 'moving' as const, x1: 4.5, y1: 3, x2: 4.5, y2: 8, isActive: true, isWarning: false, axis: 'v' as const, min: 3, max: 8, speed: 2.8, dir: 1, pos: 4 },
      ]
    },
    {
      level: 10,
      time: 25,
      maze: [
        [0,0,1,0,0,0,0,1,0,0],
        [1,0,1,0,1,1,0,1,0,1],
        [0,0,0,0,1,0,0,0,0,0],
        [0,1,1,0,1,0,1,1,1,0],
        [0,0,0,0,0,0,0,0,0,0],
        [1,1,1,0,1,1,1,0,1,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,1,0,1,1,1,0,1,0,1],
        [0,1,0,0,0,0,0,1,0,0],
        [0,1,1,1,1,1,0,1,1,0]
      ],
      lasers: [
        { id: 1, type: 'moving' as const, x1: 0, y1: 4.5, x2: 9, y2: 4.5, isActive: true, isWarning: false, axis: 'h' as const, min: 0, max: 9, speed: 3.5, dir: 1, pos: 1 },
        { id: 2, type: 'moving' as const, x1: 0, y1: 6.5, x2: 9, y2: 6.5, isActive: true, isWarning: false, axis: 'h' as const, min: 0, max: 9, speed: 3.2, dir: -1, pos: 8 },
        { id: 3, type: 'pulsing' as const, x1: 3.5, y1: 2, x2: 3.5, y2: 7, isActive: false, isWarning: false, period: 1.8 },
        { id: 4, type: 'pulsing' as const, x1: 6.5, y1: 2, x2: 6.5, y2: 7, isActive: false, isWarning: false, period: 2 },
      ]
    }
  ];

  const currentCfg = levelConfigs[level - 1] || levelConfigs[0];

  // Initialize level
  const initLevel = useCallback((lvlNum: number) => {
    const cfg = levelConfigs[lvlNum - 1] || levelConfigs[0];
    setPlayer({ x: 0.5, y: 0.5 });
    setTimeLeft(cfg.time);
    setInvincible(false);
    setGameStatus('playing');
    lasersRef.current = cfg.lasers.map(l => ({ ...l }));
  }, []);

  useEffect(() => {
    initLevel(level);
  }, [level, initLevel]);

  // Audio mute sync
  const toggleMute = () => {
    const m = gameAudio.toggleMute();
    setIsMuted(m);
  };

  // Movement handler with wall collision
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameStatus !== 'playing' || isPaused) return;

    setPlayer((prev) => {
      const targetX = prev.x + dx;
      const targetY = prev.y + dy;

      // Bound checks (10x10 grid)
      if (targetX < 0 || targetX >= 10 || targetY < 0 || targetY >= 10) {
        return prev;
      }

      // Wall collision check
      const cellX = Math.floor(targetX);
      const cellY = Math.floor(targetY);
      if (currentCfg.maze[cellY]?.[cellX] === 1) {
        return prev;
      }

      gameAudio.play('move');

      // Check exit reached (bottom right at cell 9,9)
      if (cellX === 9 && cellY === 9) {
        handleLevelComplete();
      }

      return { x: targetX, y: targetY };
    });
  }, [gameStatus, isPaused, currentCfg]);

  // Complete level
  const handleLevelComplete = () => {
    gameAudio.play('win');
    // Calculate points: 100 base + fast finish (up to 50) + no life lost bonus (25)
    const timeBonus = Math.min(50, Math.floor(timeLeft * 1.5));
    const flawlessBonus = lives === 3 ? 25 : 0;
    const gained = 100 + timeBonus + flawlessBonus;

    const newScore = score + gained;
    setScore(newScore);

    if (level >= 10) {
      setGameStatus('all_complete');
      onGameOver(newScore, 0, 10);
    } else {
      setGameStatus('win_level');
    }
  };

  // Handle hit
  const handleLaserHit = useCallback(() => {
    if (invincible || gameStatus !== 'playing') return;

    gameAudio.play('hit');
    setInvincible(true);
    const newLives = lives - 1;
    setLives(newLives);

    if (newLives <= 0) {
      gameAudio.play('lose');
      setGameStatus('defeat');
      onGameOver(score, 0, level);
    } else {
      // Return player to start and give temporary shield
      setPlayer({ x: 0.5, y: 0.5 });
      setTimeout(() => setInvincible(false), 1500);
    }
  }, [invincible, gameStatus, lives, score, level, onGameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          movePlayer(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          movePlayer(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          movePlayer(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          movePlayer(1, 0);
          break;
        case 'p':
        case 'P':
          setIsPaused(p => !p);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer]);

  // Countdown timer
  useEffect(() => {
    if (gameStatus !== 'playing' || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          gameAudio.play('lose');
          setGameStatus('defeat');
          onGameOver(score, 0, level);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, isPaused, score, level, onGameOver]);

  // Main animation & laser loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const now = Date.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const width = canvas.width;
      const height = canvas.height;
      const cellSize = width / 10;

      // Clear background
      ctx.fillStyle = '#080C14';
      ctx.fillRect(0, 0, width, height);

      // Draw Grid & Maze Walls
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          const isWall = currentCfg.maze[r][c] === 1;
          if (isWall) {
            ctx.fillStyle = '#1E293B';
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);

            // Wall highlight border
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
          } else {
            // Path tiles
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#1E293B/30';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
          }
        }
      }

      // Draw Exit Portal (9, 9)
      const exitX = 9 * cellSize;
      const exitY = 9 * cellSize;
      const pulse = Math.sin(now * 0.006) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(16, 185, 129, ${pulse * 0.5})`;
      ctx.fillRect(exitX, exitY, cellSize, cellSize);
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(exitX + 2, exitY + 2, cellSize - 4, cellSize - 4);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${cellSize * 0.45}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚪', exitX + cellSize / 2, exitY + cellSize / 2);

      // Update and Draw Lasers
      lasersRef.current.forEach((laser) => {
        if (!isPaused && gameStatus === 'playing') {
          if (laser.type === 'pulsing' && laser.period) {
            const cycleTime = (now / 1000) % laser.period;
            laser.isWarning = cycleTime > laser.period * 0.6 && cycleTime <= laser.period * 0.75;
            laser.isActive = cycleTime > laser.period * 0.75;
          } else if (laser.type === 'moving' && laser.axis && laser.speed) {
            const min = laser.min ?? 0;
            const max = laser.max ?? 9;
            const dir = laser.dir ?? 1;
            let pos = (laser.pos ?? min) + dir * laser.speed * dt;
            if (pos > max) {
              pos = max;
              laser.dir = -1;
            } else if (pos < min) {
              pos = min;
              laser.dir = 1;
            }
            laser.pos = pos;
            if (laser.axis === 'h') {
              laser.x1 = pos;
              laser.x2 = pos + 2;
            } else {
              laser.y1 = pos;
              laser.y2 = pos + 2;
            }
          }
        }

        // Draw laser
        const lx1 = laser.x1 * cellSize;
        const ly1 = laser.y1 * cellSize;
        const lx2 = laser.x2 * cellSize;
        const ly2 = laser.y2 * cellSize;

        if (laser.isWarning) {
          // Warning dashed line
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 2;
          ctx.moveTo(lx1, ly1);
          ctx.lineTo(lx2, ly2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (laser.isActive) {
          // Laser outer glow
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.lineWidth = 8;
          ctx.moveTo(lx1, ly1);
          ctx.lineTo(lx2, ly2);
          ctx.stroke();

          // Laser core
          ctx.beginPath();
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 3;
          ctx.moveTo(lx1, ly1);
          ctx.lineTo(lx2, ly2);
          ctx.stroke();

          // Laser nodes
          ctx.fillStyle = '#F87171';
          ctx.beginPath();
          ctx.arc(lx1, ly1, 4, 0, Math.PI * 2);
          ctx.arc(lx2, ly2, 4, 0, Math.PI * 2);
          ctx.fill();

          // Check Collision with player
          if (gameStatus === 'playing' && !invincible) {
            const px = player.x * cellSize;
            const py = player.y * cellSize;
            const dist = pointToSegmentDistance(px, py, lx1, ly1, lx2, ly2);
            if (dist < cellSize * 0.4) {
              handleLaserHit();
            }
          }
        }
      });

      // Draw Player
      const px = player.x * cellSize;
      const py = player.y * cellSize;
      const pRadius = cellSize * 0.35;

      // Invincible flash
      if (!invincible || Math.floor(now / 100) % 2 === 0) {
        // Player glow
        ctx.beginPath();
        ctx.fillStyle = invincible ? 'rgba(251, 191, 36, 0.4)' : 'rgba(59, 130, 246, 0.3)';
        ctx.arc(px, py, pRadius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Player body
        ctx.beginPath();
        ctx.fillStyle = invincible ? '#F59E0B' : '#38BDF8';
        ctx.arc(px, py, pRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eye / direction
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(px + 2, py - 2, pRadius * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    lastTimeRef.current = Date.now();
    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentCfg, player, invincible, gameStatus, isPaused, handleLaserHit]);

  // Distance helper from point to line segment
  function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  return (
    <div className="bg-[#0B0F19] rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-2xl max-w-xl mx-auto space-y-4">
      {/* Top Header / Stats */}
      <div className="flex items-center justify-between bg-[#131B2E] p-3 sm:p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
            ⚡
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Laser Escape</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                Nivo {level}/10
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Trophy className="w-3 h-3" /> {score} pts
              </span>
              <span className="flex items-center gap-1 text-slate-300 font-bold">
                <Clock className="w-3 h-3 text-rose-400" /> {timeLeft}s
              </span>
            </div>
          </div>
        </div>

        {/* Lives & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#080C14] px-2.5 py-1.5 rounded-xl border border-slate-800">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < lives ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isMuted ? 'Limen son' : 'Koupe son'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsPaused(p => !p)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isPaused ? 'Kontinye' : 'Poz'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex justify-center bg-black/60 rounded-2xl border border-slate-800 overflow-hidden shadow-inner p-1">
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          className="w-full max-w-[360px] aspect-square rounded-xl block"
        />

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <Pause className="w-12 h-12 text-amber-400 mb-2" />
            <h3 className="text-lg font-black text-white">Jwèt la an Poz</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Pran yon ti souf epi klike pou kontinye.</p>
            <button
              onClick={() => setIsPaused(false)}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase"
            >
              Kontinye Jwe
            </button>
          </div>
        )}

        {/* Level Complete Modal */}
        {gameStatus === 'win_level' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl mb-2 animate-bounce">
              🎉
            </div>
            <h3 className="text-xl font-black text-white">Bravo ! Ou chape anba lazè yo !</h3>
            <p className="text-xs text-slate-300 mt-1">Nivo {level} fini avèk siksè.</p>
            <div className="my-3 p-3 bg-[#0F172A] rounded-xl border border-slate-700 text-xs space-y-1">
              <div className="text-slate-400">Total Nòt Akimile:</div>
              <div className="text-2xl font-black text-amber-400 tabular-nums">{score} pts</div>
            </div>
            <button
              onClick={() => setLevel(l => l + 1)}
              className="px-7 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg"
            >
              Kontinye nan Nivo {level + 1} ➔
            </button>
          </div>
        )}

        {/* Defeat Modal */}
        {gameStatus === 'defeat' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-2xl mb-2">
              💥
            </div>
            <h3 className="text-xl font-black text-white">Lazè a touche w ! Eseye ankò</h3>
            <p className="text-xs text-slate-400 mt-1">Lavi ou oswa tan ou fini.</p>
            <div className="my-3 p-3 bg-[#0F172A] rounded-xl border border-slate-700 text-xs">
              Nòt ou : <strong className="text-amber-400">{score} pts</strong>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLives(3);
                  initLevel(level);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs uppercase flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rekòmanse Nivo {level}</span>
              </button>
            </div>
          </div>
        )}

        {/* All Levels Complete Modal */}
        {gameStatus === 'all_complete' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-3xl mb-2 animate-bounce">
              👑
            </div>
            <h3 className="text-2xl font-black text-white">Chanpyon Laser Escape !</h3>
            <p className="text-xs text-slate-300 mt-1">Ou fini tout 10 nivo labirent lazè yo !</p>
            <div className="my-3 p-4 bg-[#0F172A] rounded-2xl border border-slate-700 text-sm">
              Nòt Final : <strong className="text-2xl font-black text-amber-400 block mt-1">{score} pts</strong>
            </div>
            <button
              onClick={() => {
                setLevel(1);
                setLives(3);
                setScore(0);
                initLevel(1);
              }}
              className="px-7 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider"
            >
              Rejwe depi Nivo 1
            </button>
          </div>
        )}
      </div>

      {/* On-Screen Mobile Touch D-Pad Controls */}
      <div className="space-y-2 pt-1">
        <div className="text-[11px] text-center text-slate-400 font-semibold">
          Kontwòl Flèch (Telefòn & Òdinatè) :
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => movePlayer(0, -1)}
            disabled={gameStatus !== 'playing' || isPaused}
            className="w-14 h-12 bg-slate-800 hover:bg-slate-700 active:scale-90 text-white rounded-2xl flex items-center justify-center border border-slate-700 shadow-md disabled:opacity-40"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => movePlayer(-1, 0)}
              disabled={gameStatus !== 'playing' || isPaused}
              className="w-14 h-12 bg-slate-800 hover:bg-slate-700 active:scale-90 text-white rounded-2xl flex items-center justify-center border border-slate-700 shadow-md disabled:opacity-40"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => movePlayer(0, 1)}
              disabled={gameStatus !== 'playing' || isPaused}
              className="w-14 h-12 bg-slate-800 hover:bg-slate-700 active:scale-90 text-white rounded-2xl flex items-center justify-center border border-slate-700 shadow-md disabled:opacity-40"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              onClick={() => movePlayer(1, 0)}
              disabled={gameStatus !== 'playing' || isPaused}
              className="w-14 h-12 bg-slate-800 hover:bg-slate-700 active:scale-90 text-white rounded-2xl flex items-center justify-center border border-slate-700 shadow-md disabled:opacity-40"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
