import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, RotateCcw, Undo2, Volume2, VolumeX, Car, ArrowRight, Play, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

interface ParkingGeniusProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
  currentUser?: any;
  onBack?: () => void;
}

export interface Vehicle {
  id: string;
  name: string;
  x: number; // 0 to 5 (col)
  y: number; // 0 to 5 (row)
  length: number; // 2 or 3
  axis: 'h' | 'v';
  color: string;
  isTarget?: boolean;
}

interface LevelConfig {
  id: number;
  name: string;
  parMoves: number;
  vehicles: Vehicle[];
}

// 20 Solvable Rush Hour / Parking Genius Puzzle Configurations
const PARKING_LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "Nivo 1: Premye Deplasman",
    parMoves: 2,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 1, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Kamyonèt Ble', x: 3, y: 0, length: 2, axis: 'v', color: '#3b82f6' },
      { id: 'v2', name: 'Machin Vèt', x: 4, y: 2, length: 2, axis: 'v', color: '#10b981' },
    ]
  },
  {
    id: 2,
    name: "Nivo 2: Netwaye Chemen an",
    parMoves: 4,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 0, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Kamyon Jòn', x: 2, y: 1, length: 3, axis: 'v', color: '#f59e0b' },
      { id: 'v2', name: 'Machin Mov', x: 3, y: 0, length: 2, axis: 'h', color: '#8b5cf6' },
      { id: 'v3', name: 'Machin Vèt', x: 3, y: 3, length: 2, axis: 'h', color: '#10b981' },
    ]
  },
  {
    id: 3,
    name: "Nivo 3: Travèse Santral",
    parMoves: 5,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 1, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Kamyon Ble', x: 3, y: 1, length: 3, axis: 'v', color: '#3b82f6' },
      { id: 'v2', name: 'Machin Rose', x: 0, y: 0, length: 2, axis: 'v', color: '#ec4899' },
      { id: 'v3', name: 'Machin Jòn', x: 1, y: 4, length: 2, axis: 'h', color: '#f59e0b' },
      { id: 'v4', name: 'Kamyonèt Vèt', x: 4, y: 3, length: 2, axis: 'v', color: '#10b981' },
    ]
  },
  {
    id: 4,
    name: "Nivo 4: Kamyon an Blokaj",
    parMoves: 6,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 0, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Kamyon Ble', x: 2, y: 2, length: 3, axis: 'v', color: '#3b82f6' },
      { id: 'v2', name: 'Machin Vèt', x: 0, y: 4, length: 2, axis: 'h', color: '#10b981' },
      { id: 'v3', name: 'Machin Mov', x: 3, y: 1, length: 2, axis: 'h', color: '#8b5cf6' },
      { id: 'v4', name: 'Kamyon Jòn', x: 4, y: 2, length: 3, axis: 'v', color: '#f59e0b' },
    ]
  },
  {
    id: 5,
    name: "Nivo 5: Baryè Koulè",
    parMoves: 7,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 1, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Kamyon Jòn', x: 0, y: 0, length: 3, axis: 'h', color: '#f59e0b' },
      { id: 'v2', name: 'Machin Mov', x: 3, y: 2, length: 2, axis: 'v', color: '#8b5cf6' },
      { id: 'v3', name: 'Machin Ble', x: 4, y: 1, length: 3, axis: 'v', color: '#3b82f6' },
      { id: 'v4', name: 'Machin Vèt', x: 1, y: 4, length: 2, axis: 'v', color: '#10b981' },
      { id: 'v5', name: 'Machin Orange', x: 2, y: 5, length: 2, axis: 'h', color: '#f97316' },
    ]
  },
  {
    id: 6,
    name: "Nivo 6: Ang Dwat",
    parMoves: 8,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 1, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Kamyon Ble', x: 3, y: 0, length: 3, axis: 'v', color: '#3b82f6' },
      { id: 'v2', name: 'Machin Vèt', x: 4, y: 2, length: 2, axis: 'v', color: '#10b981' },
      { id: 'v3', name: 'Machin Jòn', x: 0, y: 3, length: 2, axis: 'v', color: '#f59e0b' },
      { id: 'v4', name: 'Machin Rose', x: 1, y: 4, length: 2, axis: 'h', color: '#ec4899' },
      { id: 'v5', name: 'Machin Mov', x: 4, y: 4, length: 2, axis: 'h', color: '#8b5cf6' },
    ]
  },
  {
    id: 7,
    name: "Nivo 7: Labyrinth Machin",
    parMoves: 9,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 2, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Machin Ble', x: 1, y: 1, length: 2, axis: 'v', color: '#3b82f6' },
      { id: 'v2', name: 'Machin Mov', x: 4, y: 1, length: 2, axis: 'v', color: '#8b5cf6' },
      { id: 'v3', name: 'Kamyon Jòn', x: 0, y: 4, length: 3, axis: 'h', color: '#f59e0b' },
      { id: 'v4', name: 'Machin Vèt', x: 5, y: 2, length: 3, axis: 'v', color: '#10b981' },
      { id: 'v5', name: 'Machin Orange', x: 2, y: 0, length: 2, axis: 'h', color: '#f97316' },
    ]
  },
  {
    id: 8,
    name: "Nivo 8: Liy Fwon an",
    parMoves: 10,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 0, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Kamyon Ble', x: 2, y: 1, length: 3, axis: 'v', color: '#3b82f6' },
      { id: 'v2', name: 'Machin Vèt', x: 3, y: 2, length: 2, axis: 'v', color: '#10b981' },
      { id: 'v3', name: 'Machin Rose', x: 4, y: 2, length: 2, axis: 'v', color: '#ec4899' },
      { id: 'v4', name: 'Machin Jòn', x: 3, y: 0, length: 2, axis: 'h', color: '#f59e0b' },
      { id: 'v5', name: 'Kamyon Mov', x: 0, y: 5, length: 3, axis: 'h', color: '#8b5cf6' },
    ]
  },
  {
    id: 9,
    name: "Nivo 9: Estasyon Blokaj",
    parMoves: 11,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 1, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Kamyon Jòn', x: 0, y: 0, length: 3, axis: 'v', color: '#f59e0b' },
      { id: 'v2', name: 'Machin Vèt', x: 3, y: 1, length: 2, axis: 'v', color: '#10b981' },
      { id: 'v3', name: 'Machin Ble', x: 4, y: 1, length: 3, axis: 'v', color: '#3b82f6' },
      { id: 'v4', name: 'Machin Orange', x: 1, y: 3, length: 2, axis: 'h', color: '#f97316' },
      { id: 'v5', name: 'Machin Mov', x: 0, y: 4, length: 2, axis: 'h', color: '#8b5cf6' },
      { id: 'v6', name: 'Machin Rose', x: 3, y: 4, length: 2, axis: 'v', color: '#ec4899' },
    ]
  },
  {
    id: 10,
    name: "Nivo 10: Pakin Sere",
    parMoves: 12,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 1, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Machin Ble', x: 3, y: 2, length: 2, axis: 'v', color: '#3b82f6' },
      { id: 'v2', name: 'Kamyon Jòn', x: 4, y: 0, length: 3, axis: 'v', color: '#f59e0b' },
      { id: 'v3', name: 'Machin Vèt', x: 1, y: 0, length: 2, axis: 'h', color: '#10b981' },
      { id: 'v4', name: 'Machin Rose', x: 0, y: 3, length: 2, axis: 'v', color: '#ec4899' },
      { id: 'v5', name: 'Machin Mov', x: 1, y: 4, length: 2, axis: 'h', color: '#8b5cf6' },
      { id: 'v6', name: 'Machin Orange', x: 3, y: 5, length: 3, axis: 'h', color: '#f97316' },
    ]
  },
  {
    id: 11,
    name: "Nivo 11: Klotir Machin",
    parMoves: 12,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 0, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Kamyon Ble', x: 2, y: 0, length: 3, axis: 'v', color: '#3b82f6' },
      { id: 'v2', name: 'Kamyon Jòn', x: 3, y: 2, length: 3, axis: 'v', color: '#f59e0b' },
      { id: 'v3', name: 'Machin Vèt', x: 4, y: 1, length: 2, axis: 'v', color: '#10b981' },
      { id: 'v4', name: 'Machin Mov', x: 0, y: 4, length: 2, axis: 'h', color: '#8b5cf6' },
      { id: 'v5', name: 'Machin Rose', x: 4, y: 4, length: 2, axis: 'h', color: '#ec4899' },
    ]
  },
  {
    id: 12,
    name: "Nivo 12: Kolizyon Evite",
    parMoves: 13,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 1, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Machin Ble', x: 3, y: 1, length: 2, axis: 'v', color: '#3b82f6' },
      { id: 'v2', name: 'Machin Mov', x: 4, y: 1, length: 2, axis: 'v', color: '#8b5cf6' },
      { id: 'v3', name: 'Kamyon Jòn', x: 5, y: 0, length: 3, axis: 'v', color: '#f59e0b' },
      { id: 'v4', name: 'Machin Vèt', x: 0, y: 0, length: 2, axis: 'v', color: '#10b981' },
      { id: 'v5', name: 'Machin Rose', x: 2, y: 4, length: 2, axis: 'h', color: '#ec4899' },
      { id: 'v6', name: 'Machin Orange', x: 0, y: 5, length: 2, axis: 'h', color: '#f97316' },
    ]
  },
  {
    id: 13,
    name: "Nivo 13: Tranzisyon Santral",
    parMoves: 14,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 2, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Machin Ble', x: 4, y: 1, length: 3, axis: 'v', color: '#3b82f6' },
      { id: 'v2', name: 'Machin Vèt', x: 1, y: 1, length: 2, axis: 'v', color: '#10b981' },
      { id: 'v3', name: 'Machin Mov', x: 0, y: 3, length: 2, axis: 'v', color: '#8b5cf6' },
      { id: 'v4', name: 'Kamyon Jòn', x: 2, y: 0, length: 3, axis: 'h', color: '#f59e0b' },
      { id: 'v5', name: 'Machin Rose', x: 2, y: 3, length: 2, axis: 'h', color: '#ec4899' },
      { id: 'v6', name: 'Machin Nwa', x: 1, y: 5, length: 3, axis: 'h', color: '#475569' },
    ]
  },
  {
    id: 14,
    name: "Nivo 14: Blokaj Doub",
    parMoves: 15,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 0, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Kamyon Jòn', x: 2, y: 1, length: 3, axis: 'v', color: '#f59e0b' },
      { id: 'v2', name: 'Kamyon Ble', x: 3, y: 2, length: 3, axis: 'v', color: '#3b82f6' },
      { id: 'v3', name: 'Machin Mov', x: 4, y: 0, length: 2, axis: 'h', color: '#8b5cf6' },
      { id: 'v4', name: 'Machin Vèt', x: 0, y: 4, length: 2, axis: 'h', color: '#10b981' },
      { id: 'v5', name: 'Machin Rose', x: 4, y: 4, length: 2, axis: 'v', color: '#ec4899' },
      { id: 'v6', name: 'Machin Orange', x: 1, y: 0, length: 2, axis: 'v', color: '#f97316' },
    ]
  },
  {
    id: 15,
    name: "Nivo 15: Grand Pakin",
    parMoves: 15,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 1, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Machin Ble', x: 3, y: 1, length: 2, axis: 'v', color: '#3b82f6' },
      { id: 'v2', name: 'Kamyon Jòn', x: 4, y: 1, length: 3, axis: 'v', color: '#f59e0b' },
      { id: 'v3', name: 'Machin Vèt', x: 0, y: 1, length: 2, axis: 'v', color: '#10b981' },
      { id: 'v4', name: 'Machin Mov', x: 0, y: 3, length: 2, axis: 'h', color: '#8b5cf6' },
      { id: 'v5', name: 'Machin Rose', x: 2, y: 4, length: 2, axis: 'h', color: '#ec4899' },
      { id: 'v6', name: 'Kamyon Te', x: 1, y: 0, length: 3, axis: 'h', color: '#059669' },
    ]
  },
  {
    id: 16,
    name: "Nivo 16: Defi Ekspè 1",
    parMoves: 16,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 1, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Kamyon Ble', x: 3, y: 1, length: 3, axis: 'v', color: '#3b82f6' },
      { id: 'v2', name: 'Machin Vèt', x: 4, y: 2, length: 2, axis: 'v', color: '#10b981' },
      { id: 'v3', name: 'Machin Mov', x: 5, y: 1, length: 2, axis: 'v', color: '#8b5cf6' },
      { id: 'v4', name: 'Machin Jòn', x: 0, y: 0, length: 2, axis: 'h', color: '#f59e0b' },
      { id: 'v5', name: 'Machin Rose', x: 0, y: 3, length: 2, axis: 'v', color: '#ec4899' },
      { id: 'v6', name: 'Machin Orange', x: 1, y: 4, length: 2, axis: 'h', color: '#f97316' },
      { id: 'v7', name: 'Machin Syèl', x: 3, y: 5, length: 3, axis: 'h', color: '#06b6d4' },
    ]
  },
  {
    id: 17,
    name: "Nivo 17: Defi Ekspè 2",
    parMoves: 17,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 0, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Kamyon Jòn', x: 2, y: 1, length: 3, axis: 'v', color: '#f59e0b' },
      { id: 'v2', name: 'Machin Ble', x: 3, y: 1, length: 2, axis: 'v', color: '#3b82f6' },
      { id: 'v3', name: 'Machin Vèt', x: 4, y: 2, length: 2, axis: 'v', color: '#10b981' },
      { id: 'v4', name: 'Machin Mov', x: 0, y: 0, length: 2, axis: 'h', color: '#8b5cf6' },
      { id: 'v5', name: 'Machin Rose', x: 0, y: 4, length: 2, axis: 'h', color: '#ec4899' },
      { id: 'v6', name: 'Machin Orange', x: 2, y: 5, length: 2, axis: 'h', color: '#f97316' },
      { id: 'v7', name: 'Machin Sitwon', x: 4, y: 0, length: 2, axis: 'h', color: '#84cc16' },
    ]
  },
  {
    id: 18,
    name: "Nivo 18: Labirent Machin Sere",
    parMoves: 18,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 1, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Machin Ble', x: 3, y: 2, length: 2, axis: 'v', color: '#3b82f6' },
      { id: 'v2', name: 'Kamyon Jòn', x: 4, y: 1, length: 3, axis: 'v', color: '#f59e0b' },
      { id: 'v3', name: 'Machin Vèt', x: 0, y: 1, length: 2, axis: 'v', color: '#10b981' },
      { id: 'v4', name: 'Machin Mov', x: 2, y: 0, length: 2, axis: 'h', color: '#8b5cf6' },
      { id: 'v5', name: 'Machin Rose', x: 1, y: 3, length: 2, axis: 'v', color: '#ec4899' },
      { id: 'v6', name: 'Machin Orange', x: 2, y: 4, length: 2, axis: 'h', color: '#f97316' },
      { id: 'v7', name: 'Machin Nwa', x: 4, y: 5, length: 2, axis: 'h', color: '#334155' },
    ]
  },
  {
    id: 19,
    name: "Nivo 19: Gran Master Park",
    parMoves: 19,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 1, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Kamyon Ble', x: 3, y: 0, length: 3, axis: 'v', color: '#3b82f6' },
      { id: 'v2', name: 'Machin Mov', x: 4, y: 1, length: 2, axis: 'v', color: '#8b5cf6' },
      { id: 'v3', name: 'Machin Vèt', x: 5, y: 2, length: 2, axis: 'v', color: '#10b981' },
      { id: 'v4', name: 'Kamyon Jòn', x: 0, y: 4, length: 3, axis: 'h', color: '#f59e0b' },
      { id: 'v5', name: 'Machin Rose', x: 0, y: 1, length: 2, axis: 'v', color: '#ec4899' },
      { id: 'v6', name: 'Machin Orange', x: 3, y: 3, length: 2, axis: 'h', color: '#f97316' },
      { id: 'v7', name: 'Machin Syèl', x: 3, y: 5, length: 3, axis: 'h', color: '#0284c7' },
    ]
  },
  {
    id: 20,
    name: "Nivo 20: Defi Final KÈKÈ",
    parMoves: 20,
    vehicles: [
      { id: 'red', name: 'Machin Wouj', x: 0, y: 2, length: 2, axis: 'h', color: '#ef4444', isTarget: true },
      { id: 'v1', name: 'Kamyon Ble', x: 2, y: 1, length: 3, axis: 'v', color: '#3b82f6' },
      { id: 'v2', name: 'Kamyon Jòn', x: 3, y: 2, length: 3, axis: 'v', color: '#f59e0b' },
      { id: 'v3', name: 'Machin Mov', x: 4, y: 1, length: 2, axis: 'v', color: '#8b5cf6' },
      { id: 'v4', name: 'Machin Vèt', x: 0, y: 0, length: 2, axis: 'h', color: '#10b981' },
      { id: 'v5', name: 'Machin Rose', x: 0, y: 4, length: 2, axis: 'v', color: '#ec4899' },
      { id: 'v6', name: 'Machin Orange', x: 1, y: 5, length: 2, axis: 'h', color: '#f97316' },
      { id: 'v7', name: 'Machin Sitwon', x: 4, y: 0, length: 2, axis: 'h', color: '#84cc16' },
      { id: 'v8', name: 'Machin Nwa', x: 4, y: 4, length: 2, axis: 'h', color: '#1e293b' },
    ]
  }
];

export const ParkingGenius: React.FC<ParkingGeniusProps> = ({ onGameOver, currentUser, onBack }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const currentLevel = PARKING_LEVELS[levelIdx];

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => JSON.parse(JSON.stringify(currentLevel.vehicles)));
  const [history, setHistory] = useState<Vehicle[][]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isWon, setIsWon] = useState(false);
  const [isCompletedAll, setIsCompletedAll] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Load new level
  const initLevel = useCallback((idx: number) => {
    const lvl = PARKING_LEVELS[idx];
    setVehicles(JSON.parse(JSON.stringify(lvl.vehicles)));
    setHistory([]);
    setMoves(0);
    setSelectedId(null);
    setIsWon(false);
  }, []);

  useEffect(() => {
    initLevel(levelIdx);
  }, [levelIdx, initLevel]);

  // Build 6x6 occupied grid
  const getOccupiedGrid = (vList: Vehicle[], excludeId?: string) => {
    const grid: string[][] = Array(6).fill(null).map(() => Array(6).fill(''));
    vList.forEach((v) => {
      if (v.id === excludeId) return;
      for (let i = 0; i < v.length; i++) {
        const cx = v.axis === 'h' ? v.x + i : v.x;
        const cy = v.axis === 'v' ? v.y + i : v.y;
        if (cx >= 0 && cx < 6 && cy >= 0 && cy < 6) {
          grid[cy][cx] = v.id;
        }
      }
    });
    return grid;
  };

  // Move vehicle by delta (-1 or +1)
  const moveVehicle = (id: string, delta: number) => {
    if (isWon || isCompletedAll) return;
    const vIndex = vehicles.findIndex((v) => v.id === id);
    if (vIndex === -1) return;

    const v = vehicles[vIndex];
    const grid = getOccupiedGrid(vehicles, id);

    let canMove = true;
    let newX = v.x;
    let newY = v.y;

    if (v.axis === 'h') {
      newX += delta;
      // Target car special victory condition: if it moves to x = 4 (or 5) reaching exit
      if (v.isTarget && newX + v.length > 6) {
        // Exiting the parking lot
        if (newX <= 5) {
          // OK can exit
        } else {
          canMove = false;
        }
      } else if (newX < 0 || newX + v.length > 6) {
        canMove = false;
      }

      if (canMove) {
        for (let i = 0; i < v.length; i++) {
          const cx = newX + i;
          if (cx < 6 && grid[v.y][cx] !== '') {
            canMove = false;
            break;
          }
        }
      }
    } else {
      // vertical
      newY += delta;
      if (newY < 0 || newY + v.length > 6) {
        canMove = false;
      } else {
        for (let i = 0; i < v.length; i++) {
          const cy = newY + i;
          if (grid[cy][v.x] !== '') {
            canMove = false;
            break;
          }
        }
      }
    }

    if (!canMove) {
      gameAudio.play('hit');
      return;
    }

    // Save previous state for undo
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(vehicles))]);

    // Apply move
    const updated = [...vehicles];
    updated[vIndex] = { ...v, x: newX, y: newY };
    setVehicles(updated);
    setMoves((m) => m + 1);
    gameAudio.play('move');

    // Check target vehicle reached exit (row 2, x + length === 6)
    if (v.isTarget && newX + v.length >= 6) {
      handleWinLevel(updated, moves + 1);
    }
  };

  const handleWinLevel = (finalVehicles: Vehicle[], totalMoves: number) => {
    setIsWon(true);
    gameAudio.play('win');

    // Score calculation
    let lvlScore = 100;
    if (totalMoves <= currentLevel.parMoves) {
      lvlScore += 50; // Max bonus
    } else if (totalMoves <= currentLevel.parMoves + 4) {
      lvlScore += 25;
    }
    const newTotalScore = score + lvlScore;
    setScore(newTotalScore);

    if (levelIdx === PARKING_LEVELS.length - 1) {
      setIsCompletedAll(true);
      onGameOver(newTotalScore, 0, 20);
    }
  };

  const undoMove = () => {
    if (history.length === 0 || isWon) return;
    const last = history[history.length - 1];
    setVehicles(last);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setMoves((m) => Math.max(0, m - 1));
    gameAudio.play('move');
  };

  const restartLevel = () => {
    initLevel(levelIdx);
    gameAudio.play('alert');
  };

  const nextLevel = () => {
    if (levelIdx < PARKING_LEVELS.length - 1) {
      setLevelIdx((idx) => idx + 1);
    } else {
      setIsCompletedAll(true);
    }
  };

  const toggleSound = () => {
    const muted = gameAudio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-slate-950 text-white p-3 select-none pb-20">
      {/* Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 shadow-lg mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-500/20 rounded-xl text-red-400">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">PARKING GENIUS</h1>
            <p className="text-xs text-slate-400">Nivo {currentLevel.id} / 20</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            aria-label="Sound Toggle"
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200"
            >
              Kite
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="w-full max-w-md grid grid-cols-3 gap-2 mb-3">
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-slate-400">Mouvman</span>
          <span className="text-lg font-black text-amber-400">{moves}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-slate-400">Objektif Par</span>
          <span className="text-lg font-black text-blue-400">{currentLevel.parMoves}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-slate-400">Nòt Total</span>
          <span className="text-lg font-black text-emerald-400 flex items-center gap-1">
            <Trophy className="w-4 h-4" /> {score}
          </span>
        </div>
      </div>

      {/* Parking Board Container */}
      <div className="relative w-full max-w-md aspect-square bg-slate-900 border-4 border-slate-800 rounded-3xl p-3 shadow-2xl flex flex-col justify-center">
        {/* Exit Gate Indicator (Row 2, Right side) */}
        <div
          className="absolute -right-3 top-[33.33%] h-[16.66%] w-4 bg-emerald-500 rounded-r-lg flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-pulse z-20"
          title="Sòti Machin Wouj la"
        >
          <ArrowRight className="w-3 h-3 text-slate-950 font-bold" />
        </div>

        {/* 6x6 Grid Background */}
        <div className="relative w-full h-full grid grid-cols-6 grid-rows-6 gap-1 bg-slate-950/80 rounded-2xl p-1.5 border border-slate-800/60 overflow-hidden">
          {Array.from({ length: 36 }).map((_, idx) => {
            const row = Math.floor(idx / 6);
            const isExitRow = row === 2;
            return (
              <div
                key={idx}
                className={`rounded-lg border border-slate-800/40 flex items-center justify-center transition-colors ${
                  isExitRow ? 'bg-slate-900/40' : 'bg-slate-950/30'
                }`}
              />
            );
          })}

          {/* Render Vehicles */}
          {vehicles.map((v) => {
            const isSelected = selectedId === v.id;
            const leftPct = (v.x / 6) * 100;
            const topPct = (v.y / 6) * 100;
            const widthPct = v.axis === 'h' ? (v.length / 6) * 100 : 100 / 6;
            const heightPct = v.axis === 'v' ? (v.length / 6) * 100 : 100 / 6;

            return (
              <div
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                  padding: '3px',
                }}
                className="cursor-pointer transition-all duration-150 z-10"
              >
                <div
                  style={{ backgroundColor: v.color }}
                  className={`w-full h-full rounded-xl flex items-center justify-center text-white shadow-md relative overflow-hidden transition-all ${
                    isSelected
                      ? 'ring-4 ring-yellow-400 scale-[1.02] shadow-yellow-500/30'
                      : 'hover:brightness-110'
                  }`}
                >
                  {/* Vehicle Decal / Windshield */}
                  <div className="absolute inset-1 border border-white/20 rounded-lg pointer-events-none" />
                  {v.isTarget ? (
                    <div className="flex items-center gap-1 font-black text-xs tracking-wider uppercase drop-shadow">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>SIB</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold opacity-80 uppercase tracking-tighter truncate px-1">
                      {v.axis === 'h' ? '◀ ▶' : '▲ ▼'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vehicle Movement Control Pad */}
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-3 mt-3 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">
            {selectedId ? (
              <span className="text-yellow-400 font-bold">
                Machin chwazi: {vehicles.find((v) => v.id === selectedId)?.name}
              </span>
            ) : (
              'Touche yon machin nan pakin nan pou deplase li'
            )}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Kontwòl</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(() => {
            const currentV = vehicles.find((v) => v.id === selectedId);
            if (!currentV) {
              return (
                <div className="col-span-2 text-center text-xs text-slate-500 py-3 bg-slate-950/60 rounded-xl border border-dashed border-slate-800">
                  Klike sou machin ou vle deplase a
                </div>
              );
            }
            if (currentV.axis === 'h') {
              return (
                <>
                  <button
                    onClick={() => moveVehicle(currentV.id, -1)}
                    className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all text-sm active:scale-95"
                  >
                    <span>◀</span> Deplase Agoch
                  </button>
                  <button
                    onClick={() => moveVehicle(currentV.id, 1)}
                    className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all text-sm active:scale-95"
                  >
                    Deplase Adwat <span>▶</span>
                  </button>
                </>
              );
            } else {
              return (
                <>
                  <button
                    onClick={() => moveVehicle(currentV.id, -1)}
                    className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-sm active:scale-95"
                  >
                    <span>▲</span> Deplase Anlè
                  </button>
                  <button
                    onClick={() => moveVehicle(currentV.id, 1)}
                    className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-sm active:scale-95"
                  >
                    <span>▼</span> Deplase Anba
                  </button>
                </>
              );
            }
          })()}
        </div>

        {/* Action Controls: Undo and Reset */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={undoMove}
            disabled={history.length === 0 || isWon}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition-all"
          >
            <Undo2 className="w-3.5 h-3.5" /> Retounen yon mouvman
          </button>
          <button
            onClick={restartLevel}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Rekòmanse nivo a
          </button>
        </div>
      </div>

      {/* Win Modal */}
      {isWon && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-xl font-black text-white mb-1">Ekselan! Ou libere pakin nan!</h2>
            <p className="text-sm text-slate-300 mb-4">
              Machin wouj la soti san pwoblèm nan {moves} mouvman!
            </p>

            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 mb-5 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Nivo:</span>
                <span className="font-bold text-white">{currentLevel.id} / 20</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Mouvman fèt:</span>
                <span className="font-bold text-white">{moves}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Mouvman referans (Par):</span>
                <span className="font-bold text-emerald-400">{currentLevel.parMoves}</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                <span>Nòt Nivo a:</span>
                <span className="font-bold text-amber-400 text-sm">+{moves <= currentLevel.parMoves ? 150 : 125} Pwen</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {levelIdx < PARKING_LEVELS.length - 1 ? (
                <button
                  onClick={nextLevel}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm shadow-lg transition-all"
                >
                  Nivo Ki Vin Apre ❯
                </button>
              ) : (
                <button
                  onClick={() => onGameOver(score, 0, 20)}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-sm shadow-lg"
                >
                  Fini Tout 20 Nivo Yo! 🏆
                </button>
              )}
              <button
                onClick={restartLevel}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Rejwe nivo sa a
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ParkingGenius;
