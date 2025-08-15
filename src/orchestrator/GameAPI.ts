/**
 * GameAPI - Unified Component Communication Interface
 * 
 * This interface defines the unified API that the ChessGameOrchestrator
 * implements to provide consistent access to all chess game functionality
 * across all components in the system.
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
} from '@/types/Chess';
import type {
  AppState,
  UIState,
  SavedGame,
  StateValidationResult,
} from '@/types/GameState';
import type {
  MoveRequest,
  MoveResponse,
  GameStateQuery,
  GameStateResponse,
  ComponentHealth,
  GameEvent,
  EventType,
  ComponentType,
  OrchestratorConfig,
  IntegrationTestScenario,
} from '@/types/Integration';

// =============================================================================
// CORE GAME API
// =============================================================================

export interface GameAPI {
  // Game Lifecycle
  initializeGame(fen?: string): Promise<GameStateResponse>;
  resetGame(): Promise<GameStateResponse>;
  loadGame(savedGame: SavedGame): Promise<GameStateResponse>;
  saveGame(): Promise<SavedGame>;
  
  // Move Operations
  makeMove(request: MoveRequest): Promise<MoveResponse>;
  getValidMoves(square?: Square): Square[];
  undoMove(): Promise<MoveResponse>;
  
  // Game State Access
  getGameState(query?: GameStateQuery): GameStateResponse;
  getCurrentPosition(): string; // FEN
  getGameStatus(): GameStatus;
  isGameOver(): boolean;
  getGameResult(): GameResult | null;
  
  // Move History
  getMoveHistory(): Move[];
  getNotation(format?: 'pgn' | 'fen' | 'algebraic'): string;
  exportGame(format: 'pgn' | 'fen'): string;
  
  // Chess Logic Queries
  isInCheck(color?: PieceColor): boolean;
  isKingInCheck(color: PieceColor): boolean;
  canCastle(side: 'kingside' | 'queenside', color?: PieceColor): boolean;
  getEnPassantSquare(): Square | null;
  
  // Endgame Analysis
  analyzePosition(): {
    status: GameStatus;
    result?: GameResult;
    threefoldRepetition: boolean;
    fiftyMoveRule: number;
    insufficientMaterial: boolean;
    possibleDraws: string[];
  };
  
  // Performance & Health
  getComponentHealth(): ComponentHealth;
  getPerformanceMetrics(): Record<string, number>;
  validateIntegrity(): Promise<StateValidationResult>;
}

// =============================================================================
// EVENT MANAGEMENT API
// =============================================================================

export interface EventAPI {
  // Event Subscription
  addEventListener<T extends GameEvent>(
    type: T['type'], 
    listener: (event: T) => void,
    options?: { once?: boolean; priority?: number }
  ): string; // returns subscription ID
  
  removeEventListener(subscriptionId: string): boolean;
  removeAllListeners(type?: EventType): void;
  
  // Event Emission
  emitEvent<T extends GameEvent>(event: T): void;
  
  // Event History
  getEventHistory(type?: EventType, limit?: number): GameEvent[];
  clearEventHistory(): void;
  
  // Event Utilities
  waitForEvent<T extends GameEvent>(
    type: T['type'],
    timeout?: number
  ): Promise<T>;
  
  getLastEvent(type?: EventType): GameEvent | null;
}

// =============================================================================
// CONFIGURATION & MANAGEMENT API
// =============================================================================

export interface ConfigAPI {
  // Configuration Management
  getConfig(): OrchestratorConfig;
  updateConfig(updates: Partial<OrchestratorConfig>): void;
  resetToDefaults(): void;
  
  // Component Management
  enableComponent(component: ComponentType): Promise<boolean>;
  disableComponent(component: ComponentType): Promise<boolean>;
  restartComponent(component: ComponentType): Promise<boolean>;
  
  // Health & Monitoring
  performHealthCheck(): Promise<ComponentHealth>;
  getComponentStatus(component?: ComponentType): ComponentHealth['components'];
  
  // Debugging & Diagnostics
  enableDebugMode(level?: 'basic' | 'verbose' | 'trace'): void;
  disableDebugMode(): void;
  getDiagnostics(): Record<string, any>;
  
  // Performance Monitoring
  startPerformanceMonitoring(): void;
  stopPerformanceMonitoring(): void;
  getPerformanceReport(): {
    averageResponseTime: number;
    maxResponseTime: number;
    operationsPerSecond: number;
    errorRate: number;
    componentBreakdown: Record<ComponentType, number>;
  };
}

// =============================================================================
// TESTING & VALIDATION API
// =============================================================================

export interface TestingAPI {
  // Integration Testing
  runIntegrationTest(scenario: IntegrationTestScenario): Promise<{
    passed: boolean;
    duration: number;
    events: GameEvent[];
    errors: string[];
    performance: Record<string, number>;
  }>;
  
  // State Validation
  validateGameState(): Promise<StateValidationResult>;
  validateComponentSynchronization(): Promise<{
    synchronized: boolean;
    discrepancies: Array<{
      component: ComponentType;
      property: string;
      expected: any;
      actual: any;
    }>;
  }>;
  
  // Mock & Simulation
  createMockGame(moves: string[]): Promise<GameStateResponse>;
  simulateRandomGame(maxMoves?: number): Promise<{
    moves: Move[];
    finalState: GameState;
    result: GameResult;
    pgn: string;
  }>;
  
  // Performance Testing
  benchmarkOperation(
    operation: () => Promise<any>,
    iterations?: number
  ): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    standardDeviation: number;
    throughput: number;
  }>;
  
  // Test Utilities
  createTestPosition(fen: string): Promise<GameStateResponse>;
  verifyTestScenario(name: string): Promise<boolean>;
  getAllTestScenarios(): IntegrationTestScenario[];
}

// =============================================================================
// COMBINED CHESS GAME ORCHESTRATOR API
// =============================================================================

export interface ChessGameOrchestratorAPI extends 
  GameAPI, 
  EventAPI, 
  ConfigAPI, 
  TestingAPI {
  
  // Orchestrator Lifecycle
  initialize(config?: Partial<OrchestratorConfig>): Promise<void>;
  destroy(): Promise<void>;
  
  // Version & Metadata
  getVersion(): string;
  getMetadata(): {
    version: string;
    buildDate: string;
    components: ComponentType[];
    initialized: Date;
    configVersion: string;
  };
  
  // Bulk Operations
  batchOperations<T>(
    operations: Array<() => Promise<T>>
  ): Promise<Array<{ success: boolean; result?: T; error?: string }>>;
  
  // State Synchronization
  forceSynchronization(): Promise<void>;
  getLastSynchronization(): Date;
  
  // Error Recovery
  recoverFromError(errorId: string): Promise<boolean>;
  getRecoveryHistory(): Array<{
    timestamp: Date;
    error: string;
    recovery: string;
    success: boolean;
  }>;
  
  // Advanced Features
  enableTransactionMode(): void;
  disableTransactionMode(): void;
  commitTransaction(): Promise<boolean>;
  rollbackTransaction(): Promise<boolean>;
  
  // Development Utilities
  inspectComponent(component: ComponentType): Record<string, any>;
  debugState(): {
    orchestrator: Record<string, any>;
    components: Record<ComponentType, Record<string, any>>;
    events: GameEvent[];
    errors: string[];
  };
}

// =============================================================================
// API METHOD RESULT TYPES
// =============================================================================

export interface APIResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  duration: number;
  source: ComponentType;
}

export interface APIBatchResult<T = any> {
  totalOperations: number;
  successful: number;
  failed: number;
  results: Array<APIResult<T>>;
  totalDuration: number;
}

// =============================================================================
// API FACTORY & BUILDER
// =============================================================================

export interface APIFactory {
  createOrchestrator(config?: Partial<OrchestratorConfig>): ChessGameOrchestratorAPI;
  createTestingOrchestrator(
    scenarios?: IntegrationTestScenario[]
  ): ChessGameOrchestratorAPI;
  
  validateAPICompliance(
    api: Partial<ChessGameOrchestratorAPI>
  ): {
    compliant: boolean;
    missingMethods: string[];
    invalidMethods: Array<{ method: string; reason: string }>;
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  GameAPI,
  EventAPI,
  ConfigAPI,
  TestingAPI,
  ChessGameOrchestratorAPI,
  APIResult,
  APIBatchResult,
  APIFactory,
};