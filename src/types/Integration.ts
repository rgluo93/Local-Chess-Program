/**
 * Integration Types and Interfaces
 * 
 * This file defines types and interfaces specific to component integration,
 * orchestration, and the unified API layer for Phase 1.4.
 */

import type {
  Square,
  PieceType,
  PieceColor,
  Move,
  GameState,
  GameStatus,
  GameResult,
  ChessBoard,
} from './Chess';
import type {
  AppState,
  UIState,
  SavedGame,
  StateValidationResult,
} from './GameState';

// =============================================================================
// EVENT SYSTEM TYPES
// =============================================================================

export type EventType = 
  | 'game:initialized'
  | 'move:attempted'
  | 'move:completed'
  | 'move:failed'
  | 'game:state_changed'
  | 'game:ended'
  | 'history:updated'
  | 'notation:generated'
  | 'endgame:detected'
  | 'state:saved'
  | 'state:loaded'
  | 'error:occurred'
  | 'performance:measured';

export interface BaseEvent {
  type: EventType;
  timestamp: Date;
  source: ComponentType;
  correlationId?: string;
}

export interface GameInitializedEvent extends BaseEvent {
  type: 'game:initialized';
  fen: string;
  gameState: GameState;
}

export interface MoveAttemptedEvent extends BaseEvent {
  type: 'move:attempted';
  from: Square;
  to: Square;
  promotion?: PieceType;
  player: PieceColor;
}

export interface MoveCompletedEvent extends BaseEvent {
  type: 'move:completed';
  move: Move;
  newGameState: GameState;
  notation: string;
  endgameStatus?: GameResult;
}

export interface MoveFailedEvent extends BaseEvent {
  type: 'move:failed';
  from: Square;
  to: Square;
  error: string;
  reason: string;
}

export interface GameStateChangedEvent extends BaseEvent {
  type: 'game:state_changed';
  previousState: GameState;
  newState: GameState;
  trigger: string;
}

export interface GameEndedEvent extends BaseEvent {
  type: 'game:ended';
  result: GameResult;
  finalState: GameState;
  pgn: string;
  reason: string;
}

export interface HistoryUpdatedEvent extends BaseEvent {
  type: 'history:updated';
  moveCount: number;
  pgn: string;
}

export interface NotationGeneratedEvent extends BaseEvent {
  type: 'notation:generated';
  move: Move;
  notation: string;
  format: 'algebraic' | 'pgn' | 'fen';
}

export interface EndgameDetectedEvent extends BaseEvent {
  type: 'endgame:detected';
  result: GameResult;
  reason: string;
  position: string;
}

export interface StateSavedEvent extends BaseEvent {
  type: 'state:saved';
  savedGame: SavedGame;
  size: number;
}

export interface StateLoadedEvent extends BaseEvent {
  type: 'state:loaded';
  loadedGame: SavedGame;
  validation: StateValidationResult;
}

export interface ErrorOccurredEvent extends BaseEvent {
  type: 'error:occurred';
  error: IntegrationError;
  context: string;
  recoverable: boolean;
}

export interface PerformanceMeasuredEvent extends BaseEvent {
  type: 'performance:measured';
  operation: string;
  duration: number;
  threshold: number;
  passed: boolean;
}

export type GameEvent = 
  | GameInitializedEvent
  | MoveAttemptedEvent
  | MoveCompletedEvent
  | MoveFailedEvent
  | GameStateChangedEvent
  | GameEndedEvent
  | HistoryUpdatedEvent
  | NotationGeneratedEvent
  | EndgameDetectedEvent
  | StateSavedEvent
  | StateLoadedEvent
  | ErrorOccurredEvent
  | PerformanceMeasuredEvent;

// =============================================================================
// COMPONENT COORDINATION TYPES
// =============================================================================

export type ComponentType = 
  | 'orchestrator'
  | 'game_engine'
  | 'state_manager'
  | 'move_history'
  | 'endgame_detector'
  | 'notation_generator'
  | 'state_serialization'
  | 'ui_component';

export interface ComponentStatus {
  name: ComponentType;
  initialized: boolean;
  healthy: boolean;
  lastActivity: Date;
  errorCount: number;
  performance: PerformanceMetrics;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  maxResponseTime: number;
  operationCount: number;
  errorRate: number;
  lastMeasurement: Date;
}

export interface ComponentHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: ComponentStatus[];
  lastCheck: Date;
  issues: string[];
}

// =============================================================================
// API OPERATION TYPES
// =============================================================================

export interface MoveRequest {
  from: Square;
  to: Square;
  promotion?: PieceType;
  skipValidation?: boolean;
  source?: ComponentType;
}

export interface MoveResponse {
  success: boolean;
  move?: Move;
  notation?: string;
  gameState?: GameState;
  endgameResult?: GameResult;
  error?: string;
  performance?: {
    validationTime: number;
    stateUpdateTime: number;
    notationTime: number;
    totalTime: number;
  };
}

export interface GameStateQuery {
  includeHistory?: boolean;
  includeNotation?: boolean;
  includeAnalysis?: boolean;
  format?: 'full' | 'minimal' | 'display';
}

export interface GameStateResponse {
  gameState: GameState;
  moveHistory?: Move[];
  notation?: {
    pgn: string;
    fen: string;
  };
  analysis?: {
    status: GameStatus;
    result?: GameResult;
    threefoldRepetition: boolean;
    fiftyMoveRule: number;
    materialBalance: any;
  };
  metadata: {
    timestamp: Date;
    version: string;
    source: ComponentType;
  };
}

// =============================================================================
// ERROR HANDLING TYPES
// =============================================================================

export type IntegrationErrorType = 
  | 'component_initialization'
  | 'state_synchronization'
  | 'event_propagation'
  | 'api_validation'
  | 'performance_violation'
  | 'recovery_failure'
  | 'unknown';

export interface IntegrationError extends Error {
  type: IntegrationErrorType;
  component: ComponentType;
  operation: string;
  timestamp: Date;
  correlationId?: string;
  context?: Record<string, any>;
  recoverable: boolean;
  recoveryAttempts?: number;
}

export interface ErrorRecoveryStrategy {
  type: IntegrationErrorType;
  maxAttempts: number;
  backoffMs: number;
  recoveryFn: (error: IntegrationError) => Promise<boolean>;
}

// =============================================================================
// ORCHESTRATOR CONFIGURATION
// =============================================================================

export interface OrchestratorConfig {
  performance: {
    maxResponseTimeMs: number;
    enableMetrics: boolean;
    metricsBufferSize: number;
  };
  events: {
    enableEventHistory: boolean;
    maxEventHistory: number;
    enablePerformanceEvents: boolean;
  };
  error: {
    enableRecovery: boolean;
    maxRecoveryAttempts: number;
    recoveryStrategies: ErrorRecoveryStrategy[];
  };
  validation: {
    enableStateValidation: boolean;
    enableCrossComponentValidation: boolean;
    validationLevel: 'basic' | 'thorough' | 'paranoid';
  };
  components: {
    [K in ComponentType]?: {
      enabled: boolean;
      initializeOnStart: boolean;
      healthCheckInterval?: number;
    };
  };
}

export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  performance: {
    maxResponseTimeMs: 100,
    enableMetrics: true,
    metricsBufferSize: 1000,
  },
  events: {
    enableEventHistory: true,
    maxEventHistory: 500,
    enablePerformanceEvents: true,
  },
  error: {
    enableRecovery: true,
    maxRecoveryAttempts: 3,
    recoveryStrategies: [],
  },
  validation: {
    enableStateValidation: true,
    enableCrossComponentValidation: true,
    validationLevel: 'thorough',
  },
  components: {
    game_engine: { enabled: true, initializeOnStart: true },
    state_manager: { enabled: true, initializeOnStart: true },
    move_history: { enabled: true, initializeOnStart: true },
    endgame_detector: { enabled: true, initializeOnStart: true },
    notation_generator: { enabled: true, initializeOnStart: true },
    state_serialization: { enabled: true, initializeOnStart: true },
  },
};

// =============================================================================
// TESTING SUPPORT TYPES
// =============================================================================

export interface IntegrationTestScenario {
  name: string;
  description: string;
  setup: () => Promise<void>;
  execute: () => Promise<any>;
  validate: (result: any) => Promise<boolean>;
  cleanup: () => Promise<void>;
  timeout?: number;
  expectedEvents?: EventType[];
  performanceThreshold?: number;
}

export interface TestGameState {
  fen: string;
  expectedMoves: string[];
  expectedResult?: GameResult;
  description: string;
}

export const INTEGRATION_TEST_POSITIONS: TestGameState[] = [
  {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    expectedMoves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'],
    description: 'Standard opening sequence',
  },
  {
    fen: 'rnb1kbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    expectedMoves: ['d4', 'Nf3', 'Bc4'],
    description: 'French Defense position',
  },
  {
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    expectedMoves: ['O-O', 'd3', 'Ng5'],
    description: 'Italian Game with castling rights',
  },
  {
    fen: 'rnbqk2r/ppp2ppp/4pn2/3p4/1bPP4/2N2N2/PP2PPPP/R1BQKB1R b KQkq c3 0 5',
    expectedMoves: ['Bxc3+', 'O-O', 'dxc4'],
    description: 'Queen\'s Gambit Declined with en passant',
  },
];