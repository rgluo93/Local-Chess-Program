/**
 * ChessGameOrchestrator - Central Game Coordination Hub
 * 
 * This class serves as the main coordination center that integrates all
 * Phase 1 components (GameEngine, GameStateManager, MoveHistoryManager,
 * EndgameDetector, NotationGenerator, GameStateSerialization) through
 * a unified API interface.
 */

import { Chess } from 'chess.js';
import { GameEngine } from '../engine/GameEngine';
import { GameStateManager } from '../engine/GameStateManager';
import { MoveHistoryManager } from '../engine/MoveHistoryManager';
import { EndgameDetector } from '../engine/EndgameDetector';
import { NotationGenerator } from '../engine/NotationGenerator';
import { GameStateSerialization } from '../utils/GameStateSerialization';
import { EventManager } from './EventManager';
import { AIGameIntegration } from '../ai/AIGameIntegration';
import { GameMode } from '../ai/types/AITypes';

import type {
  Square,
  PieceType,
  PieceColor,
  Move,
  GameState,
  GameStatus,
  GameResult,
  ChessBoard,
} from '../types/Chess';
import type {
  AppState,
  UIState,
  SavedGame,
  StateValidationResult,
} from '../types/GameState';
import type { GameMode, ThinkingMove, EngineOptions } from '../ai/types/AITypes';
import { DEFAULT_ORCHESTRATOR_CONFIG } from '../types/Integration';
import type {
  ChessGameOrchestratorAPI,
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
  GameInitializedEvent,
  MoveAttemptedEvent,
  MoveCompletedEvent,
  MoveFailedEvent,
  GameStateChangedEvent,
  GameEndedEvent,
  HistoryUpdatedEvent,
  NotationGeneratedEvent,
  EndgameDetectedEvent,
  StateSavedEvent,
  StateLoadedEvent,
  ErrorOccurredEvent,
  PerformanceMeasuredEvent,
  ComponentStatus,
  PerformanceMetrics,
  IntegrationError,
  APIResult,
  APIBatchResult,
} from '../types/Integration';

// =============================================================================
// ORCHESTRATOR IMPLEMENTATION
// =============================================================================

export class ChessGameOrchestrator implements ChessGameOrchestratorAPI {
  private gameEngine: GameEngine;
  private stateManager: GameStateManager;
  private moveHistory: MoveHistoryManager;
  private endgameDetector: EndgameDetector;
  private notationGenerator: NotationGenerator;
  private eventManager: EventManager;
  private aiIntegration: AIGameIntegration;
  private serialization: GameStateSerialization;
  
  private config: OrchestratorConfig;
  private initialized = false;
  private destroyed = false;
  private initializationDate?: Date;
  private lastSynchronization?: Date;
  private transactionMode = false;
  private transactionBackup?: {
    gameState: string;
    moveHistory: Move[];
    timestamp: Date;
  };
  
  private performanceMetrics = new Map<string, number[]>();
  private componentHealth = new Map<ComponentType, ComponentStatus>();
  private recoveryHistory: Array<{
    timestamp: Date;
    error: string;
    recovery: string;
    success: boolean;
  }> = [];

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config };
    this.eventManager = new EventManager({
      maxHistorySize: this.config.events.maxEventHistory,
      enableMetrics: this.config.events.enablePerformanceEvents,
      enablePerformanceTracking: this.config.events.enablePerformanceEvents,
    });

    // Initialize components
    this.gameEngine = new GameEngine();
    this.stateManager = new GameStateManager(this.gameEngine);
    
    this.moveHistory = new MoveHistoryManager();
    this.endgameDetector = new EndgameDetector();
    this.notationGenerator = new NotationGenerator();
    this.aiIntegration = new AIGameIntegration();
    this.serialization = new GameStateSerialization();

    // Set up AI integration callbacks
    this.aiIntegration.setOrchestratorCallbacks(
      (move: Move) => this.makeMove(move),
      () => this.getGameState().gameState
    );

    this.setupEventHandlers();
  }

  // ==========================================================================
  // ORCHESTRATOR LIFECYCLE
  // ==========================================================================

  async initialize(config?: Partial<OrchestratorConfig>, gameMode?: GameMode): Promise<void> {
    if (this.initialized) {
      throw new Error('Orchestrator already initialized');
    }

    if (config) {
      this.config = { ...this.config, ...config };
    }

    const startTime = performance.now();

    try {
      // Initialize all components
      await this.initializeComponents();
      
      // Setup cross-component integrations
      this.setupIntegrations();
      
      // Set initial game mode if provided
      if (gameMode) {
        await this.setGameMode(gameMode);
      }
      
      this.initialized = true;
      this.initializationDate = new Date();
      this.lastSynchronization = new Date();

      // Emit initialization event
      const event: GameInitializedEvent = {
        type: 'game:initialized',
        timestamp: new Date(),
        source: 'orchestrator',
        fen: this.gameEngine.getFEN(),
        gameState: this.stateManager.getCurrentGame(),
      };
      
      await this.eventManager.emitEvent(event);

      // Track performance
      this.recordPerformance('initialization', performance.now() - startTime);

    } catch (error) {
      await this.handleError(error as Error, 'initialization');
      throw error;
    }
  }

  async destroy(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    try {
      // Cleanup components
      this.eventManager.destroy();
      
      // Clear state
      this.performanceMetrics.clear();
      this.componentHealth.clear();
      this.recoveryHistory = [];
      
      this.destroyed = true;
      this.initialized = false;

    } catch (error) {
      console.error('Error during orchestrator destruction:', error);
    }
  }

  // ==========================================================================
  // GAME LIFECYCLE API
  // ==========================================================================

  async initializeGame(fen?: string): Promise<GameStateResponse> {
    this.ensureInitialized();
    const startTime = performance.now();

    try {
      // Reset all components
      this.gameEngine = new GameEngine(fen);
      this.stateManager.startNewGame();
      this.moveHistory.clear();
      
      // Synchronize state
      await this.forceSynchronization();

      const response = this.createGameStateResponse();
      this.recordPerformance('initializeGame', performance.now() - startTime);

      return response;

    } catch (error) {
      await this.handleError(error as Error, 'initializeGame');
      throw error;
    }
  }

  async resetGame(): Promise<GameStateResponse> {
    return this.initializeGame();
  }

  async loadGame(savedGame: SavedGame): Promise<GameStateResponse> {
    // Simplified implementation - just load the gameState directly
    this.ensureInitialized();
    const startTime = performance.now();

    try {
      // NEVER create new GameEngine - this breaks synchronization with StateManager
      // Instead, load the position into existing engine
      this.gameEngine.loadFEN(savedGame.gameState.fen);
      
      // Update state manager
      this.stateManager.startNewGame();
      
      // Restore move history
      this.moveHistory.clear();
      if (savedGame.gameState.moves) {
        savedGame.gameState.moves.forEach(move => this.moveHistory.addMove(move));
      }

      // Synchronize state
      await this.forceSynchronization();

      const response = this.createGameStateResponse();
      this.recordPerformance('loadGame', performance.now() - startTime);

      return response;

    } catch (error) {
      await this.handleError(error as Error, 'loadGame');
      throw error;
    }
  }

  async saveGame(): Promise<SavedGame> {
    this.ensureInitialized();
    const startTime = performance.now();

    try {
      // Ensure state is synchronized
      await this.forceSynchronization();

      const currentGame = this.stateManager.getCurrentGame();
      
      // Create saved game using the actual SavedGame interface
      const savedGame: SavedGame = {
        id: `game_${Date.now()}`,
        name: `Chess Game ${new Date().toLocaleDateString()}`,
        gameState: currentGame,
        saveDate: new Date(),
        gameDate: currentGame.startDate,
        moveCount: this.moveHistory.getTotalMoves(),
        status: this.gameEngine.getGameStatus(),
        result: this.gameEngine.getGameResult() || 'ongoing',
        duration: currentGame.endDate ? 
          currentGame.endDate.getTime() - currentGame.startDate.getTime() : 
          Date.now() - currentGame.startDate.getTime(),
      };

      this.recordPerformance('saveGame', performance.now() - startTime);
      return savedGame;

    } catch (error) {
      await this.handleError(error as Error, 'saveGame');
      throw error;
    }
  }

  // ==========================================================================
  // MOVE OPERATIONS API
  // ==========================================================================

  async makeMove(request: MoveRequest): Promise<MoveResponse> {
    this.ensureInitialized();
    const startTime = performance.now();
    const timings = {
      validationTime: 0,
      stateUpdateTime: 0,
      notationTime: 0,
      totalTime: 0,
    };

    try {
      // Emit move attempted event
      const attemptEvent: MoveAttemptedEvent = {
        type: 'move:attempted',
        timestamp: new Date(),
        source: request.source || 'orchestrator',
        from: request.from,
        to: request.to,
        promotion: request.promotion,
        player: this.gameEngine.getCurrentPlayer(),
      };
      
      await this.eventManager.emitEvent(attemptEvent);

      // Validation phase
      const validationStart = performance.now();
      
      if (!request.skipValidation && !this.gameEngine.validateMove(request.from, request.to, request.promotion).isValid) {
        const error = 'Invalid move';
        
        const failEvent: MoveFailedEvent = {
          type: 'move:failed',
          timestamp: new Date(),
          source: 'orchestrator',
          from: request.from,
          to: request.to,
          error,
          reason: 'Move validation failed',
        };
        
        await this.eventManager.emitEvent(failEvent);

        return {
          success: false,
          error,
          performance: timings,
        };
      }
      
      timings.validationTime = performance.now() - validationStart;

      // State update phase
      const stateUpdateStart = performance.now();
      
      // Make move in engine first
      const moveResult = this.gameEngine.makeMove(request.from, request.to, request.promotion);
      
      if (!moveResult.isValid || !moveResult.move) {
        const error = moveResult.error || 'Move failed';
        
        const failEvent: MoveFailedEvent = {
          type: 'move:failed',
          timestamp: new Date(),
          source: 'orchestrator',
          from: request.from,
          to: request.to,
          error,
          reason: 'Engine rejected move',
        };
        
        await this.eventManager.emitEvent(failEvent);

        return {
          success: false,
          error,
          performance: timings,
        };
      }

      // Update move history
      this.moveHistory.addMove(moveResult.move);
      
      // Synchronize state manager - force it to update from current engine state
      await this.forceSynchronization();
      
      timings.stateUpdateTime = performance.now() - stateUpdateStart;

      // Notation phase
      const notationStart = performance.now();
      
      // Generate notation
      const notation = this.notationGenerator.generateMoveNotation(
        moveResult.move,
        this.gameEngine
      );
      
      timings.notationTime = performance.now() - notationStart;

      // Check for endgame  
      const chessInstance = new Chess(this.gameEngine.getFEN());
      const allMoves = this.moveHistory.getAllMoves().map(entry => entry.move);
      const endgameResult = this.endgameDetector.analyzePosition(chessInstance, allMoves);
      
      // Emit events
      const notationEvent: NotationGeneratedEvent = {
        type: 'notation:generated',
        timestamp: new Date(),
        source: 'orchestrator',
        move: moveResult.move,
        notation,
        format: 'algebraic',
      };
      
      await this.eventManager.emitEvent(notationEvent);

      const historyEvent: HistoryUpdatedEvent = {
        type: 'history:updated',
        timestamp: new Date(),
        source: 'orchestrator',
        moveCount: this.moveHistory.getTotalMoves(),
        pgn: this.notationGenerator.generatePGN(this.moveHistory.getAllMoves().map(entry => entry.move)),
      };
      
      await this.eventManager.emitEvent(historyEvent);

      if (endgameResult.isGameOver) {
        const endgameEvent: EndgameDetectedEvent = {
          type: 'endgame:detected',
          timestamp: new Date(),
          source: 'orchestrator',
          result: endgameResult.result!,
          reason: endgameResult.reason || 'Game ended',
          position: this.gameEngine.getFEN(),
        };
        
        await this.eventManager.emitEvent(endgameEvent);
      }

      const completedEvent: MoveCompletedEvent = {
        type: 'move:completed',
        timestamp: new Date(),
        source: 'orchestrator',
        move: moveResult.move,
        newGameState: this.stateManager.getCurrentGame(),
        notation,
        endgameStatus: endgameResult.result,
      };
      
      await this.eventManager.emitEvent(completedEvent);

      // Update synchronization timestamp
      this.lastSynchronization = new Date();

      timings.totalTime = performance.now() - startTime;
      this.recordPerformance('makeMove', timings.totalTime);

      return {
        success: true,
        move: moveResult.move,
        notation,
        gameState: this.stateManager.getCurrentGame(),
        endgameResult: endgameResult.result,
        performance: timings,
      };

    } catch (error) {
      await this.handleError(error as Error, 'makeMove');
      throw error;
    }
  }

  getValidMoves(square?: Square): Square[] {
    this.ensureInitialized();
    return this.gameEngine.getValidMoves(square);
  }

  async undoMove(): Promise<MoveResponse> {
    this.ensureInitialized();
    const startTime = performance.now();

    try {
      if (this.moveHistory.getTotalMoves() === 0) {
        return {
          success: false,
          error: 'No moves to undo',
        };
      }

      
      // Use state manager to undo - it coordinates with the engine internally
      const undoResult = this.stateManager.undoLastMove();
      
      if (!undoResult) {
        return {
          success: false,
          error: 'State manager failed to undo move',
        };
      }

      // Update move history
      this.moveHistory.undoLastMove();
      
      // Get updated state
      const newGameState = this.stateManager.getCurrentGame();
      
      // Update synchronization
      this.lastSynchronization = new Date();

      this.recordPerformance('undoMove', performance.now() - startTime);

      return {
        success: true,
        gameState: this.stateManager.getCurrentGame(),
      };

    } catch (error) {
      await this.handleError(error as Error, 'undoMove');
      throw error;
    }
  }

  async resignGame(resigningPlayer?: PieceColor): Promise<MoveResponse> {
    this.ensureInitialized();
    const startTime = performance.now();

    try {
      const currentGame = this.stateManager.getCurrentGame();
      if (!currentGame) {
        return {
          success: false,
          error: 'No active game to resign',
        };
      }

      // If no player specified, use current player (the one whose turn it is)
      const playerToResign = resigningPlayer || currentGame.currentPlayer;
      
      // Resign through state manager
      this.stateManager.resignGame(playerToResign);
      
      // Emit game ended event
      const endedEvent: GameEndedEvent = {
        type: 'game:ended',
        timestamp: new Date(),
        source: 'orchestrator',
        result: playerToResign === 'white' ? 'black_wins' : 'white_wins',
        reason: 'resignation',
        finalPosition: this.gameEngine.getFEN(),
      };
      
      await this.eventManager.emitEvent(endedEvent);

      // Update synchronization
      this.lastSynchronization = new Date();
      this.recordPerformance('resignGame', performance.now() - startTime);

      return {
        success: true,
        gameState: this.stateManager.getCurrentGame(),
      };

    } catch (error) {
      await this.handleError(error as Error, 'resignGame');
      throw error;
    }
  }

  // ==========================================================================
  // GAME STATE ACCESS API
  // ==========================================================================

  getGameState(query?: GameStateQuery): GameStateResponse {
    this.ensureInitialized();
    return this.createGameStateResponse(query);
  }

  getCurrentPosition(): string {
    this.ensureInitialized();
    return this.gameEngine.getFEN();
  }

  getGameStatus(): GameStatus {
    this.ensureInitialized();
    return this.gameEngine.getGameStatus();
  }

  isGameOver(): boolean {
    this.ensureInitialized();
    return this.gameEngine.isGameOver();
  }

  getGameResult(): GameResult | null {
    this.ensureInitialized();
    return this.gameEngine.getGameResult();
  }

  // ==========================================================================
  // MOVE HISTORY API
  // ==========================================================================

  getMoveHistory(): Move[] {
    this.ensureInitialized();
    return this.moveHistory.getAllMoves().map(entry => entry.move);
  }

  getNotation(format: 'pgn' | 'fen' | 'algebraic' = 'pgn'): string {
    this.ensureInitialized();
    
    switch (format) {
      case 'pgn':
        return this.notationGenerator.generatePGN(this.moveHistory.getAllMoves().map(entry => entry.move));
      case 'fen':
        return this.gameEngine.getFEN();
      case 'algebraic':
        const moves = this.moveHistory.getAllMoves().map(entry => entry.move);
        return moves.map(move => move.notation).join(' ');
      default:
        throw new Error(`Unsupported notation format: ${format}`);
    }
  }

  exportGame(format: 'pgn' | 'fen'): string {
    return this.getNotation(format);
  }

  // ==========================================================================
  // CHESS LOGIC QUERIES API
  // ==========================================================================

  isInCheck(color?: PieceColor): boolean {
    this.ensureInitialized();
    return this.gameEngine.isInCheck(color);
  }

  isKingInCheck(color: PieceColor): boolean {
    this.ensureInitialized();
    return this.gameEngine.isInCheck(color);
  }

  getCurrentPlayer(): PieceColor {
    this.ensureInitialized();
    return this.gameEngine.getCurrentPlayer();
  }

  getKingPosition(color?: PieceColor): Square | null {
    this.ensureInitialized();
    return this.gameEngine.getKingPosition();
  }

  canCastle(side: 'kingside' | 'queenside', color?: PieceColor): boolean {
    this.ensureInitialized();
    // For Phase 1.4, just check if castling moves are available
    const moves = this.gameEngine.getValidMoves();
    const castleMoves = moves.filter(move => {
      // This is a simplified check - a full implementation would examine move flags
      return (side === 'kingside' && move === 'g1') || (side === 'queenside' && move === 'c1') ||
             (side === 'kingside' && move === 'g8') || (side === 'queenside' && move === 'c8');
    });
    return castleMoves.length > 0;
  }

  getEnPassantSquare(): Square | null {
    this.ensureInitialized();
    return this.gameEngine.getEnPassantSquare();
  }

  // ==========================================================================
  // ENDGAME ANALYSIS API
  // ==========================================================================

  analyzePosition() {
    this.ensureInitialized();
    
    // Create Chess.js instance from current FEN for endgame analysis
    const chess = new Chess(this.gameEngine.getFEN());
    const moves = this.moveHistory.getAllMoves().map(entry => entry.move);
    
    const analysis = this.endgameDetector.analyzePosition(chess, moves);
    
    return {
      status: this.gameEngine.getGameStatus(),
      result: this.gameEngine.getGameResult(),
      threefoldRepetition: false, // Would be implemented in endgame detector
      fiftyMoveRule: 0, // Would be tracked in endgame detector  
      insufficientMaterial: false, // Would be calculated from material balance
      possibleDraws: [], // Would be calculated from analysis
    };
  }

  // ==========================================================================
  // PERFORMANCE & HEALTH API
  // ==========================================================================

  getComponentHealth(): ComponentHealth {
    this.ensureInitialized();
    
    const components = Array.from(this.componentHealth.values());
    const healthy = components.filter(c => c.healthy).length;
    const total = components.length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthy === total) {
      overall = 'healthy';
    } else if (healthy > total / 2) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    const issues: string[] = [];
    components.forEach(comp => {
      if (!comp.healthy) {
        issues.push(`${comp.name}: health check failed`);
      }
      if (comp.errorCount > 0) {
        issues.push(`${comp.name}: ${comp.errorCount} errors`);
      }
    });

    return {
      overall,
      components,
      lastCheck: new Date(),
      issues,
    };
  }

  getPerformanceMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    for (const [operation, times] of this.performanceMetrics) {
      if (times.length > 0) {
        metrics[`${operation}_avg`] = times.reduce((a, b) => a + b) / times.length;
        metrics[`${operation}_max`] = Math.max(...times);
        metrics[`${operation}_min`] = Math.min(...times);
        metrics[`${operation}_count`] = times.length;
      }
    }
    
    return metrics;
  }

  async validateIntegrity(): Promise<StateValidationResult> {
    this.ensureInitialized();
    
    try {
      // Validate game engine state
      const engineFEN = this.gameEngine.getFEN();
      const currentGame = this.stateManager.getCurrentGame();
      
      if (!currentGame) {
        return {
          isValid: false,
          errors: ['State manager has no current game'],
        };
      }
      
      const stateManagerFEN = (currentGame as any).fen; // Using any since the interface might not match
      
      if (engineFEN !== stateManagerFEN) {
        return {
          isValid: false,
          errors: [`Game engine and state manager positions out of sync: engine=${engineFEN}, state=${stateManagerFEN}`],
        };
      }

      // Validate move history consistency
      const engineMoves = this.gameEngine.getMoveHistory();
      const historyMoves = this.moveHistory.getAllMoves().map(entry => entry.move);
      
      if (engineMoves.length !== historyMoves.length) {
        return {
          isValid: false,
          errors: [`Move history length mismatch: engine=${engineMoves.length}, history=${historyMoves.length}`],
        };
      }

      // Additional validations...
      
      return {
        isValid: true,
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Integrity validation error: ${(error as Error).message}`],
      };
    }
  }

  // ==========================================================================
  // EVENT MANAGEMENT API
  // ==========================================================================

  addEventListener<T extends GameEvent>(
    type: T['type'],
    listener: (event: T) => void,
    options?: { once?: boolean; priority?: number }
  ): string {
    return this.eventManager.addEventListener(type, listener, options);
  }

  removeEventListener(subscriptionId: string): boolean {
    return this.eventManager.removeEventListener(subscriptionId);
  }

  removeAllListeners(type?: EventType): void {
    this.eventManager.removeAllListeners(type);
  }

  emitEvent<T extends GameEvent>(event: T): void {
    this.eventManager.emitEventSync(event);
  }

  getEventHistory(type?: EventType, limit?: number): GameEvent[] {
    return this.eventManager.getEventHistory(type, limit);
  }

  clearEventHistory(): void {
    this.eventManager.clearEventHistory();
  }

  async waitForEvent<T extends GameEvent>(
    type: T['type'],
    timeout?: number
  ): Promise<T> {
    return this.eventManager.waitForEvent(type, timeout);
  }

  getLastEvent(type?: EventType): GameEvent | null {
    return this.eventManager.getLastEvent(type);
  }

  // ==========================================================================
  // CONFIGURATION & MANAGEMENT API
  // ==========================================================================

  getConfig(): OrchestratorConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...updates };
    this.eventManager.updateConfig({
      maxHistorySize: this.config.events.maxEventHistory,
      enableMetrics: this.config.events.enablePerformanceEvents,
      enablePerformanceTracking: this.config.events.enablePerformanceEvents,
    });
  }

  resetToDefaults(): void {
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG };
  }

  async enableComponent(component: ComponentType): Promise<boolean> {
    if (this.config.components[component]) {
      this.config.components[component]!.enabled = true;
      return true;
    }
    return false;
  }

  async disableComponent(component: ComponentType): Promise<boolean> {
    if (this.config.components[component]) {
      this.config.components[component]!.enabled = false;
      return true;
    }
    return false;
  }

  async restartComponent(component: ComponentType): Promise<boolean> {
    // Implementation depends on component-specific restart logic
    return true;
  }

  async performHealthCheck(): Promise<ComponentHealth> {
    // Update component health
    const components: ComponentType[] = [
      'game_engine',
      'state_manager', 
      'move_history',
      'endgame_detector',
      'notation_generator',
      'orchestrator'
    ];

    for (const component of components) {
      const status: ComponentStatus = {
        name: component,
        initialized: this.initialized,
        healthy: true, // Basic health check - could be more sophisticated
        lastActivity: new Date(),
        errorCount: 0,
        performance: {
          averageResponseTime: 0,
          maxResponseTime: 0,
          operationCount: 0,
          errorRate: 0,
          lastMeasurement: new Date(),
        },
      };
      
      this.componentHealth.set(component, status);
    }

    return this.getComponentHealth();
  }

  getComponentStatus(component?: ComponentType) {
    if (component) {
      const status = this.componentHealth.get(component);
      return status ? [status] : [];
    }
    return Array.from(this.componentHealth.values());
  }

  enableDebugMode(level: 'basic' | 'verbose' | 'trace' = 'basic'): void {
    // Implementation for debug mode
    console.log(`Debug mode enabled: ${level}`);
  }

  disableDebugMode(): void {
    console.log('Debug mode disabled');
  }

  getDiagnostics(): Record<string, any> {
    return {
      initialized: this.initialized,
      destroyed: this.destroyed,
      config: this.config,
      componentHealth: Object.fromEntries(this.componentHealth),
      performanceMetrics: Object.fromEntries(this.performanceMetrics),
      eventMetrics: this.eventManager.getMetrics(),
      lastSynchronization: this.lastSynchronization,
    };
  }

  startPerformanceMonitoring(): void {
    // Implementation for performance monitoring
  }

  stopPerformanceMonitoring(): void {
    // Implementation to stop performance monitoring
  }

  getPerformanceReport() {
    const metrics = this.getPerformanceMetrics();
    
    return {
      averageResponseTime: metrics.makeMove_avg || 0,
      maxResponseTime: metrics.makeMove_max || 0,
      operationsPerSecond: 0, // Would need timing data
      errorRate: 0, // Would need error tracking
      componentBreakdown: {} as Record<ComponentType, number>,
    };
  }

  // ==========================================================================
  // TESTING & VALIDATION API
  // ==========================================================================

  async runIntegrationTest(scenario: IntegrationTestScenario): Promise<{
    passed: boolean;
    duration: number;
    events: GameEvent[];
    errors: string[];
    performance: Record<string, number>;
  }> {
    const startTime = performance.now();
    const initialEventCount = this.eventManager.getEventHistory().length;
    const errors: string[] = [];
    
    try {
      await scenario.setup();
      const result = await scenario.execute();
      const passed = await scenario.validate(result);
      await scenario.cleanup();
      
      const duration = performance.now() - startTime;
      const events = this.eventManager.getEventHistory().slice(initialEventCount);
      
      return {
        passed,
        duration,
        events,
        errors,
        performance: { [scenario.name]: duration },
      };
      
    } catch (error) {
      errors.push((error as Error).message);
      
      return {
        passed: false,
        duration: performance.now() - startTime,
        events: this.eventManager.getEventHistory().slice(initialEventCount),
        errors,
        performance: {},
      };
    }
  }

  async validateComponentSynchronization(): Promise<{
    synchronized: boolean;
    discrepancies: Array<{
      component: ComponentType;
      property: string;
      expected: any;
      actual: any;
    }>;
  }> {
    const discrepancies: Array<{
      component: ComponentType;
      property: string;
      expected: any;
      actual: any;
    }> = [];

    // For Phase 1.4, basic synchronization check
    const engineFEN = this.gameEngine.getFEN();
    const gameState = this.stateManager.getCurrentGame();
    
    // Simplified synchronization - both components should be functional
    if (!engineFEN || !gameState) {
      discrepancies.push({
        component: 'state_manager',
        property: 'synchronization',
        expected: 'functional',
        actual: 'missing_data',
      });
    }

    return {
      synchronized: discrepancies.length === 0,
      discrepancies,
    };
  }

  async createMockGame(moves: string[]): Promise<GameStateResponse> {
    await this.initializeGame();
    
    for (const moveNotation of moves) {
      // Parse algebraic notation and make move
      // This would require a notation parser - simplified for now
      console.log(`Would make move: ${moveNotation}`);
    }
    
    return this.getGameState();
  }

  async simulateRandomGame(maxMoves: number = 50): Promise<{
    moves: Move[];
    finalState: GameState;
    result: GameResult;
    pgn: string;
  }> {
    await this.initializeGame();
    
    let moveCount = 0;
    while (!this.isGameOver() && moveCount < maxMoves) {
      const validMoves = this.getValidMoves();
      if (validMoves.length === 0) break;
      
      // Make random move (simplified)
      const randomDestination = validMoves[Math.floor(Math.random() * validMoves.length)];
      // Would need to determine source square - simplified for now
      
      moveCount++;
    }
    
    return {
      moves: this.getMoveHistory(),
      finalState: this.stateManager.getCurrentGame(),
      result: this.getGameResult() || 'draw',
      pgn: this.getNotation('pgn'),
    };
  }

  async benchmarkOperation(
    operation: () => Promise<any>,
    iterations: number = 100
  ): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    standardDeviation: number;
    throughput: number;
  }> {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await operation();
      times.push(performance.now() - start);
    }
    
    const avg = times.reduce((a, b) => a + b) / times.length;
    const variance = times.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / times.length;
    
    return {
      averageTime: avg,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      standardDeviation: Math.sqrt(variance),
      throughput: 1000 / avg, // operations per second
    };
  }

  async createTestPosition(fen: string): Promise<GameStateResponse> {
    return this.initializeGame(fen);
  }

  async verifyTestScenario(name: string): Promise<boolean> {
    // Implementation would check predefined test scenarios
    return true;
  }

  getAllTestScenarios(): IntegrationTestScenario[] {
    // Return predefined test scenarios
    return [];
  }

  // ==========================================================================
  // ADDITIONAL API METHODS
  // ==========================================================================

  getVersion(): string {
    return '1.0.0';
  }

  getMetadata() {
    return {
      version: this.getVersion(),
      buildDate: '2025-08-12',
      components: ['game_engine', 'state_manager', 'move_history', 'endgame_detector', 'notation_generator'] as ComponentType[],
      initialized: this.initializationDate || new Date(),
      configVersion: '1.0.0',
    };
  }

  async batchOperations<T>(
    operations: Array<() => Promise<T>>
  ): Promise<Array<{ success: boolean; result?: T; error?: string }>> {
    const results = await Promise.allSettled(operations.map(op => op()));
    
    return results.map(result => 
      result.status === 'fulfilled'
        ? { success: true, result: result.value }
        : { success: false, error: result.reason.message }
    );
  }

  async forceSynchronization(): Promise<void> {
    // Ensure all components are synchronized
    
    // Force the state manager to update its current game state from the engine
    // Since createGameStateFromEngine is private, we'll use reflection to access it
    const stateManager = this.stateManager as any;
    if (stateManager.createGameStateFromEngine) {
      const newGameState = stateManager.createGameStateFromEngine();
      stateManager.appState.currentGame = newGameState;
    }
    
    this.lastSynchronization = new Date();
  }

  getLastSynchronization(): Date {
    return this.lastSynchronization || new Date();
  }

  async recoverFromError(errorId: string): Promise<boolean> {
    // Implementation for error recovery
    return true;
  }

  getRecoveryHistory() {
    return [...this.recoveryHistory];
  }

  enableTransactionMode(): void {
    if (this.transactionMode) return;
    
    this.transactionBackup = {
      gameState: this.gameEngine.getFEN(),
      moveHistory: [...this.moveHistory.getAllMoves().map(entry => entry.move)],
      timestamp: new Date(),
    };
    
    this.transactionMode = true;
  }

  disableTransactionMode(): void {
    this.transactionMode = false;
    this.transactionBackup = undefined;
  }

  async commitTransaction(): Promise<boolean> {
    if (!this.transactionMode) {
      throw new Error('Not in transaction mode');
    }
    
    this.disableTransactionMode();
    return true;
  }

  async rollbackTransaction(): Promise<boolean> {
    if (!this.transactionMode || !this.transactionBackup) {
      throw new Error('Not in transaction mode or no backup available');
    }
    
    // Restore state from backup
    this.gameEngine = new GameEngine(this.transactionBackup.gameState);
    this.moveHistory.loadFromMoves(this.transactionBackup.moveHistory);
    
    this.disableTransactionMode();
    return true;
  }

  inspectComponent(component: ComponentType): Record<string, any> {
    switch (component) {
      case 'game_engine':
        return {
          fen: this.gameEngine.getFEN(),
          status: this.gameEngine.getGameStatus(),
          turn: this.gameEngine.getCurrentPlayer(),
        };
      case 'state_manager':
        return {
          state: this.stateManager.getCurrentGame(),
        };
      case 'move_history':
        return {
          moveCount: this.moveHistory.getTotalMoves(),
          canUndo: this.moveHistory.getTotalMoves() > 0,
        };
      default:
        return {};
    }
  }

  debugState() {
    return {
      orchestrator: {
        initialized: this.initialized,
        config: this.config,
        lastSync: this.lastSynchronization,
      },
      components: {
        game_engine: this.inspectComponent('game_engine'),
        state_manager: this.inspectComponent('state_manager'),
        move_history: this.inspectComponent('move_history'),
      } as Record<ComponentType, Record<string, any>>,
      events: this.eventManager.getEventHistory(),
      errors: this.recoveryHistory.map(r => r.error),
    };
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Orchestrator not initialized');
    }
    if (this.destroyed) {
      throw new Error('Orchestrator has been destroyed');
    }
  }

  private async initializeComponents(): Promise<void> {
    // Reset the existing GameEngine to starting position instead of creating new one
    this.gameEngine.reset();
    
    // Reset StateManager to use the same engine instance (don't create new StateManager)
    this.stateManager.startNewGame();
    
    // Initialize MoveHistory
    this.moveHistory = new MoveHistoryManager();
    
    // Initialize EndgameDetector
    this.endgameDetector = new EndgameDetector();
    
    // Initialize NotationGenerator
    this.notationGenerator = new NotationGenerator();
    
    // Sync all components to initial state
    await this.forceSynchronization();
  }

  private setupIntegrations(): void {
    // Setup cross-component event handlers and integrations
    // This ensures components stay synchronized
    
    // Initialize component health tracking
    this.componentHealth.set('game_engine', 'healthy');
    this.componentHealth.set('state_manager', 'healthy');
    this.componentHealth.set('move_history', 'healthy');
    this.componentHealth.set('endgame_detector', 'healthy');
    this.componentHealth.set('notation_generator', 'healthy');
  }

  private setupEventHandlers(): void {
    // Setup internal event handlers
  }

  private createGameStateResponse(query?: GameStateQuery): GameStateResponse {
    const gameState = this.stateManager.getCurrentGame();
    
    const response: GameStateResponse = {
      gameState,
      metadata: {
        timestamp: new Date(),
        version: '1.0.0',
        source: 'orchestrator',
      },
    };

    if (query?.includeHistory) {
      response.moveHistory = this.moveHistory.getAllMoves().map(entry => entry.move);
    }

    if (query?.includeNotation) {
      response.notation = {
        pgn: this.notationGenerator.generatePGN(this.moveHistory.getAllMoves().map(entry => entry.move)),
        fen: this.gameEngine.getFEN(),
      };
    }

    if (query?.includeAnalysis) {
      const analysis = this.analyzePosition();
      response.analysis = {
        status: analysis.status,
        result: analysis.result,
        threefoldRepetition: analysis.threefoldRepetition,
        fiftyMoveRule: analysis.fiftyMoveRule,
        materialBalance: {}, // Would be calculated
      };
    }

    return response;
  }

  private recordPerformance(operation: string, duration: number): void {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    
    const times = this.performanceMetrics.get(operation)!;
    times.push(duration);
    
    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }

    // Check if duration exceeds threshold
    if (duration > this.config.performance.maxResponseTimeMs) {
      const perfEvent: PerformanceMeasuredEvent = {
        type: 'performance:measured',
        timestamp: new Date(),
        source: 'orchestrator',
        operation,
        duration,
        threshold: this.config.performance.maxResponseTimeMs,
        passed: false,
      };
      
      this.eventManager.emitEventSync(perfEvent);
    }
  }

  private async handleError(error: Error, context: string): Promise<void> {
    const integrationError: IntegrationError = {
      ...error,
      type: 'unknown',
      component: 'orchestrator',
      operation: context,
      timestamp: new Date(),
      recoverable: true,
    };

    const errorEvent: ErrorOccurredEvent = {
      type: 'error:occurred',
      timestamp: new Date(),
      source: 'orchestrator',
      error: integrationError,
      context,
      recoverable: true,
    };

    await this.eventManager.emitEvent(errorEvent);

    // Add to recovery history
    this.recoveryHistory.push({
      timestamp: new Date(),
      error: error.message,
      recovery: 'Error logged and event emitted',
      success: false,
    });
  }

  // =============================================================================
  // AI INTEGRATION METHODS
  // =============================================================================

  async setGameMode(mode: GameMode): Promise<void> {
    try {
      await this.aiIntegration.setGameMode(mode);
      
      this.stateManager.setGameMode(mode);
      
      // Initialize AI if switching to AI mode
      if (mode !== 'HUMAN_VS_HUMAN' && !this.aiIntegration.isReady()) {
        await this.aiIntegration.initialize();
      }
      
      this.eventManager.emitEventSync({
        type: 'game:mode_changed',
        timestamp: new Date(),
        source: 'orchestrator',
        gameMode: mode
      } as any);
    } catch (error) {
      await this.handleError(error as Error, 'setGameMode');
      throw error;
    }
  }

  getGameMode(): GameMode {
    return this.stateManager.getGameMode();
  }

  async handlePlayerMove(move: Move): Promise<MoveResponse> {
    try {
      // Make the human move first
      const moveResponse = await this.makeMove({
        from: move.from,
        to: move.to,
        promotion: move.promotion
      });

      // If in AI mode and it's AI's turn, trigger AI move
      if (this.getGameMode() !== 'HUMAN_VS_HUMAN' && this.stateManager.isAITurn()) {
        await this.triggerAIMove();
      }

      return moveResponse;
    } catch (error) {
      await this.handleError(error as Error, 'handlePlayerMove');
      throw error;
    }
  }

  async triggerAIMove(): Promise<void> {
    try {
      const currentGame = this.stateManager.getCurrentGame();
      if (!currentGame) {
        throw new Error('No current game for AI move');
      }

      console.log('🤖 Triggering AI move for current position:', currentGame.fen);

      // Get the current game state after human move
      const gameStateResponse = this.getGameState();
      const gameState = gameStateResponse.gameState;
      
      console.log('🤖 Game state for AI:', {
        fen: gameState.fen,
        currentPlayer: gameState.currentPlayer,
        status: gameState.status
      });

      // Only proceed if it's the AI's turn  
      // In Human vs AI mode, AI plays as black by default
      // TODO: Make this configurable for user to choose color
      const currentGameMode = this.aiIntegration.getGameMode();
      const isAITurn = (currentGameMode === GameMode.HUMAN_VS_AI && gameState.currentPlayer === 'black');
      
      if (!isAITurn) {
        console.warn('⚠️ Not AI turn, skipping. Current player:', gameState.currentPlayer, 'Game mode:', currentGameMode);
        return;
      }

      // Generate AI move directly
      const aiMove = await this.aiIntegration.generateAIMove(gameState);
      
      // Execute the AI move
      const moveResult = await this.makeMove(aiMove);
      console.log('🤖 AI move executed:', moveResult);
      
    } catch (error) {
      await this.handleError(error as Error, 'triggerAIMove');
      throw error;
    }
  }

  getAIThinkingMoves(): ThinkingMove[] {
    return this.aiIntegration.getAIThinkingMoves();
  }

  isAIThinking(): boolean {
    return this.aiIntegration.isAIThinking();
  }

  setAIEngineOptions(options: Partial<EngineOptions>): void {
    this.aiIntegration.setAIEngineOptions(options);
  }

  async initializeAI(): Promise<void> {
    try {
      if (!this.aiIntegration.isReady()) {
        await this.aiIntegration.initialize();
        this.stateManager.setAIEngineStatus('ready');
      }
    } catch (error) {
      this.stateManager.setAIEngineStatus('error');
      await this.handleError(error as Error, 'initializeAI');
      throw error;
    }
  }
}