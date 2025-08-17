/**
 * AI-specific type definitions for Stockfish integration
 */

import type { Move } from '../types/Chess';

export enum GameMode {
  HUMAN_VS_HUMAN = 'human_vs_human',
  HUMAN_VS_AI = 'human_vs_ai',
  AI_VS_AI = 'ai_vs_ai' // For testing
}

export interface EngineOptions {
  depth?: number;
  timeLimit?: number; // milliseconds
  multiPV?: number; // number of best moves to consider
  debug?: boolean;
}

export interface EvaluationResult {
  bestMove: Move;
  evaluation: number; // centipawns
  depth: number;
  nodes: number;
  time: number;
  principalVariation: Move[];
}

export interface UCIResponse {
  type: 'bestmove' | 'info' | 'readyok' | 'error';
  data: any;
  raw: string;
}

export enum AIErrorType {
  ENGINE_INITIALIZATION_FAILED = 'engine_init_failed',
  ENGINE_COMMUNICATION_ERROR = 'engine_comm_error',
  INVALID_POSITION = 'invalid_position',
  CALCULATION_TIMEOUT = 'calc_timeout',
  ENGINE_CRASHED = 'engine_crashed'
}

export interface AIError {
  type: AIErrorType;
  message: string;
  originalError?: Error;
}

export interface ThinkingMove {
  move: Move;
  evaluation: number;
  depth: number;
  pv: Move[]; // Principal variation
}

// Extended GameState interface for AI-specific data
export interface AIGameState {
  gameMode: GameMode;
  aiPlayer?: {
    isThinking: boolean;
    thinkingStartTime?: Date;
    lastMoveTime?: number;
    candidateMoves?: ThinkingMove[];
    currentDepth?: number;
  };
}