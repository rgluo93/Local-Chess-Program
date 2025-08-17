/**
 * GameStateManager - Central Game State Management
 * 
 * This class provides centralized management of the entire application state,
 * coordinating between the GameEngine and UI state management. It handles
 * state persistence, validation, and recovery mechanisms.
 */

import { GameEngine } from './GameEngine';
import { NotationGenerator } from './NotationGenerator';
import type {
  Square,
  PieceColor,
  GameState,
  GameStatus,
  GameResult,
  SavedGame,
} from '../types/Chess';
import type {
  AppState,
  UIState,
  GameStorage,
  AppSettings,
  StateValidationResult,
  ValidationError,
  ValidationWarning,
  AIUIState,
} from '../types/GameState';
import type { GameMode, ThinkingMove } from '../ai/types/AITypes';
import {
  DEFAULT_UI_STATE,
  DEFAULT_APP_SETTINGS,
} from '../types/GameState';

export interface GameStateManagerOptions {
  enableAutoSave?: boolean;
  autoSaveInterval?: number; // in milliseconds
  enableStateValidation?: boolean;
  maxSavedGames?: number;
}

export interface GameStateSnapshot {
  gameState: GameState;
  uiState: UIState;
  timestamp: Date;
  version: string;
}

const STORAGE_KEY = 'chess-program-state';
const CURRENT_VERSION = '1.0.0';

export class GameStateManager {
  private _gameEngine: GameEngine;
  private notationGenerator: NotationGenerator;
  private appState: AppState;
  private options: GameStateManagerOptions;
  private autoSaveTimer?: NodeJS.Timeout;
  private stateHistory: GameStateSnapshot[] = [];
  private maxHistorySize = 50;
  private externalEngine: boolean; // Track if external GameEngine was provided
  private expectedEngineId?: string; // Track the expected engine ID

  // Getter/setter to trap when gameEngine reference changes
  private get gameEngine(): GameEngine {
    return this._gameEngine;
  }

  private set gameEngine(value: GameEngine) {
    const oldId = this._gameEngine?.getInstanceId();
    const newId = value?.getInstanceId();
    
    if (this.expectedEngineId && newId !== this.expectedEngineId) {
      console.error('[StateManager] CRITICAL: GameEngine reference changed unexpectedly!');
      console.error('[StateManager] Expected ID:', this.expectedEngineId);
      console.error('[StateManager] Old ID:', oldId);
      console.error('[StateManager] New ID:', newId);
    }
    
    this._gameEngine = value;
  }

  constructor(gameEngine?: GameEngine, options: GameStateManagerOptions = {}) {
    this.options = {
      enableAutoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      enableStateValidation: true,
      maxSavedGames: 100,
      ...options,
    };

    // Track if an external GameEngine was provided
    this.externalEngine = !!gameEngine;
    
    if (gameEngine) {
      this.expectedEngineId = gameEngine.getInstanceId(); // Track the expected ID
      this.gameEngine = gameEngine;
    } else {
      this.gameEngine = new GameEngine();
      this.expectedEngineId = this.gameEngine.getInstanceId(); // Track our own ID
    }
    
    this.notationGenerator = new NotationGenerator();
    this.appState = this.initializeAppState();
    
    this.loadState();
    this.setupAutoSave();
  }

  // =============================================================================
  // STATE INITIALIZATION
  // =============================================================================

  private initializeAppState(): AppState {
    return {
      currentGame: null,
      gameHistory: [],
      uiState: { ...DEFAULT_UI_STATE },
      settings: { ...DEFAULT_APP_SETTINGS },
    };
  }

  // =============================================================================
  // GAME MANAGEMENT
  // =============================================================================

  public startNewGame(): void {
    // Reset the existing game engine to starting position instead of creating a new one
    this.gameEngine.reset();
    this.appState.currentGame = this.createGameStateFromEngine();
    this.updateUIState({ selectedSquare: null, validMoves: [] });
    this.saveSnapshot();
    this.persistState();
  }

  public makeMove(from: Square, to: Square, promotion?: 'queen' | 'rook' | 'bishop' | 'knight'): boolean {
    const result = this.gameEngine.makeMove(from, to, promotion);
    
    if (result.isValid) {
      this.appState.currentGame = this.createGameStateFromEngine();
      
      this.updateUIState({
        selectedSquare: null,
        validMoves: [],
        highlightedSquares: {
          ...this.appState.uiState.highlightedSquares,
          check: this.gameEngine.isInCheck() ? this.gameEngine.getKingPosition() : null,
        }
      });
      this.saveSnapshot();
      this.persistState();
      return true;
    }
    
    return false;
  }

  public undoLastMove(): boolean {
    const success = this.gameEngine.undo();
    if (success) {
      this.appState.currentGame = this.createGameStateFromEngine();
      this.updateUIState({
        highlightedSquares: {
          ...this.appState.uiState.highlightedSquares,
          check: this.gameEngine.isInCheck() ? this.gameEngine.getKingPosition() : null,
        }
      });
      this.saveSnapshot();
      this.persistState();
    }
    return success;
  }

  public resignGame(resigningPlayer: PieceColor): void {
    const winner = resigningPlayer === 'white' ? 'black' : 'white';
    const currentGame = this.appState.currentGame;
    
    if (currentGame) {
      // Create a new game state object to ensure React detects the change
      this.appState.currentGame = {
        ...currentGame,
        status: 'resigned',
        result: winner === 'white' ? 'white_wins' : 'black_wins',
        endDate: new Date()
      };
      this.saveSnapshot();
      this.persistState();
    }
  }

  public offerDraw(): void {
    // Implementation would depend on UI to handle draw offers
    // For now, we'll implement a simple auto-accept for testing
    if (this.appState.currentGame) {
      this.appState.currentGame.status = 'draw';
      this.appState.currentGame.result = 'draw';
      this.appState.currentGame.endDate = new Date();
      this.saveSnapshot();
      this.persistState();
    }
  }

  // =============================================================================
  // STATE ACCESS
  // =============================================================================

  public getCurrentGame(): GameState | null {
    return this.appState.currentGame;
  }

  public getUIState(): UIState {
    return { ...this.appState.uiState };
  }

  public getSettings(): AppSettings {
    return { ...this.appState.settings };
  }

  public getGameEngine(): GameEngine {
    return this.gameEngine;
  }

  public getValidMoves(square: Square): Square[] {
    return this.gameEngine.getValidMoves(square);
  }

  public isGameOver(): boolean {
    return this.gameEngine.isGameOver();
  }

  public getGameStatus(): GameStatus {
    return this.gameEngine.getGameStatus();
  }

  // =============================================================================
  // UI STATE MANAGEMENT
  // =============================================================================

  public updateUIState(update: Partial<UIState>): void {
    this.appState.uiState = { ...this.appState.uiState, ...update };
    this.persistState();
  }

  public selectSquare(square: Square | null): void {
    const validMoves = square ? this.getValidMoves(square) : [];
    this.updateUIState({
      selectedSquare: square,
      validMoves,
      highlightedSquares: {
        ...this.appState.uiState.highlightedSquares,
        selected: square,
        validMoves,
      }
    });
  }

  public updateSettings(settings: Partial<AppSettings>): void {
    this.appState.settings = { ...this.appState.settings, ...settings };
    this.persistState();
  }

  // =============================================================================
  // GAME PERSISTENCE
  // =============================================================================

  public saveGame(name: string): SavedGame {
    const currentGame = this.appState.currentGame;
    if (!currentGame) {
      throw new Error('No active game to save');
    }

    const savedGame: SavedGame = {
      id: this.generateGameId(),
      name,
      gameState: { ...currentGame },
      saveDate: new Date(),
      gameDate: currentGame.startDate,
      moveCount: currentGame.moves.length,
      status: currentGame.status,
      result: currentGame.result,
      duration: currentGame.endDate 
        ? currentGame.endDate.getTime() - currentGame.startDate.getTime()
        : Date.now() - currentGame.startDate.getTime(),
    };

    this.appState.gameHistory.unshift(savedGame);
    
    // Limit saved games
    if (this.appState.gameHistory.length > this.options.maxSavedGames!) {
      this.appState.gameHistory = this.appState.gameHistory.slice(0, this.options.maxSavedGames);
    }

    this.persistState();
    return savedGame;
  }

  public loadGame(gameId: string): boolean {
    // If external engine provided, don't allow loading games as it would break synchronization
    if (this.externalEngine) {
      console.error('[StateManager] BLOCKED: loadGame() called with external GameEngine - this would break synchronization!');
      return false;
    }

    const savedGame = this.appState.gameHistory.find(game => game.id === gameId);
    if (!savedGame) return false;

    try {
      this.gameEngine = new GameEngine(savedGame.gameState.fen);
      
      // Replay moves to restore engine state
      const moves = savedGame.gameState.moves;
      this.gameEngine = new GameEngine(); // Start fresh
      
      for (const move of moves) {
        this.gameEngine.makeMove(move.from, move.to, move.promotion);
      }

      this.appState.currentGame = { ...savedGame.gameState };
      this.updateUIState({ selectedSquare: null, validMoves: [] });
      this.saveSnapshot();
      this.persistState();
      
      return true;
    } catch (error) {
      console.error('Failed to load game:', error);
      return false;
    }
  }

  public getSavedGames(): SavedGame[] {
    return [...this.appState.gameHistory];
  }

  public deleteGame(gameId: string): boolean {
    const index = this.appState.gameHistory.findIndex(game => game.id === gameId);
    if (index === -1) return false;

    this.appState.gameHistory.splice(index, 1);
    this.persistState();
    return true;
  }

  // =============================================================================
  // STATE VALIDATION
  // =============================================================================

  public validateState(): StateValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate current game state
    if (this.appState.currentGame) {
      const game = this.appState.currentGame;
      
      if (!game.fen || typeof game.fen !== 'string') {
        errors.push({
          type: 'INVALID_GAME_STATE',
          message: 'Invalid or missing FEN string',
          field: 'fen',
          value: game.fen,
        });
      }

      if (!Array.isArray(game.moves)) {
        errors.push({
          type: 'INVALID_GAME_STATE',
          message: 'Invalid move history',
          field: 'moves',
          value: game.moves,
        });
      }

      if (!(game.startDate instanceof Date)) {
        warnings.push({
          type: 'MISSING_OPTIONAL_FIELD',
          message: 'Invalid start date',
          field: 'startDate',
          suggestion: 'Use current date as fallback',
        });
      }
    }

    // Validate UI state
    const ui = this.appState.uiState;
    if (ui.zoomLevel < 0.5 || ui.zoomLevel > 2.0) {
      warnings.push({
        type: 'UNUSUAL_STATE',
        message: 'Zoom level outside recommended range',
        field: 'zoomLevel',
        suggestion: 'Clamp to range [0.5, 2.0]',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // =============================================================================
  // STATE PERSISTENCE
  // =============================================================================

  private persistState(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const gameStorage: GameStorage & { uiState?: UIState } = {
        currentGame: this.appState.currentGame,
        savedGames: this.appState.gameHistory,
        settings: this.appState.settings,
        uiState: this.appState.uiState,
        lastUpdated: new Date(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameStorage, this.dateReplacer));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }

  private loadState(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    // If external engine provided, NEVER load from localStorage to avoid corruption
    if (this.externalEngine) {
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return;
      }

      const gameStorage: GameStorage & { uiState?: UIState } = JSON.parse(stored, this.dateReviver);
      
      if (this.options.enableStateValidation) {
        // Basic validation
        if (!gameStorage || typeof gameStorage !== 'object') {
          return;
        }
      }

      this.appState.currentGame = gameStorage.currentGame;
      this.appState.gameHistory = gameStorage.savedGames || [];
      this.appState.settings = { ...DEFAULT_APP_SETTINGS, ...gameStorage.settings };
      
      // Restore UI state if available
      if (gameStorage.uiState) {
        this.appState.uiState = { ...DEFAULT_UI_STATE, ...gameStorage.uiState };
      }

      // Restore game engine if there's a current game
      if (this.appState.currentGame) {
        if (!this.externalEngine) {
          // No external engine provided, create our own and load the saved position
          try {
            this.gameEngine = new GameEngine(this.appState.currentGame.fen);
          } catch (error) {
            console.error('Failed to restore game engine:', error);
            this.appState.currentGame = null;
          }
        } else {
          // External engine provided, don't override it but clear any saved game to start fresh
          this.appState.currentGame = null;
        }
      }
    } catch (error) {
      console.error('Failed to load state:', error);
      this.appState = this.initializeAppState();
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private createGameStateFromEngine(): GameState {
    const moves = this.gameEngine.getMoveHistory();
    const gameState = {
      fen: this.gameEngine.getFEN(),
      pgn: this.generatePGNFromMoves(moves),
      moves,
      currentPlayer: this.gameEngine.getCurrentPlayer(),
      status: this.gameEngine.getGameStatus(),
      result: this.determineGameResult(),
      startDate: this.appState.currentGame?.startDate || new Date(),
      endDate: this.gameEngine.isGameOver() ? new Date() : undefined,
      board: this.gameEngine.getBoard(),
    };
    
    return gameState;
  }

  private determineGameResult(): GameResult {
    const status = this.gameEngine.getGameStatus();
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    
    switch (status) {
      case 'checkmate':
        return currentPlayer === 'white' ? 'black_wins' : 'white_wins';
      case 'stalemate':
      case 'draw':
        return 'draw';
      default:
        return 'ongoing';
    }
  }

  private saveSnapshot(): void {
    if (!this.appState.currentGame) return;

    const snapshot: GameStateSnapshot = {
      gameState: { ...this.appState.currentGame },
      uiState: { ...this.appState.uiState },
      timestamp: new Date(),
      version: CURRENT_VERSION,
    };

    this.stateHistory.unshift(snapshot);
    
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory = this.stateHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Generate PGN using the existing move notation from moves.
   * This ensures that the PGN matches exactly what's displayed in the Move History panel.
   */
  private generatePGNFromMoves(moves: Move[]): string {
    if (moves.length === 0) {
      return '*';
    }

    let pgn = '';
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const moveNumber = Math.floor(i / 2) + 1;
      const isWhiteMove = i % 2 === 0;

      // Add move number for white moves
      if (isWhiteMove) {
        pgn += `${moveNumber}. `;
      }

      // Add the move notation (already correctly formatted from chess.js)
      pgn += move.notation;

      // Add space between moves (except for the last move)
      if (i < moves.length - 1) {
        pgn += ' ';
      }
    }

    // Add game result
    let result = '*';
    const gameResult = this.determineGameResult();
    if (gameResult === 'white_wins') {
      result = '1-0';
    } else if (gameResult === 'black_wins') {
      result = '0-1';
    } else if (gameResult === 'draw') {
      result = '1/2-1/2';
    }

    return pgn + (pgn ? ' ' : '') + result;
  }

  private generateGameId(): string {
    return `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupAutoSave(): void {
    if (!this.options.enableAutoSave) return;

    this.autoSaveTimer = setInterval(() => {
      this.persistState();
    }, this.options.autoSaveInterval);
  }

  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', __value: value.toISOString() };
    }
    return value;
  }

  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.__value);
    }
    return value;
  }

  // =============================================================================
  // CLEANUP
  // =============================================================================

  // =============================================================================
  // AI GAME MODE MANAGEMENT
  // =============================================================================

  public setGameMode(mode: GameMode): void {
    this.updateUIState({
      gameMode: mode,
      aiState: {
        ...this.appState.uiState.aiState,
        engineStatus: mode === 'HUMAN_VS_HUMAN' ? 'offline' : 'ready'
      }
    });
    this.persistState();
  }

  public getGameMode(): GameMode {
    return this.appState.uiState.gameMode;
  }

  public setAIThinking(isThinking: boolean): void {
    this.updateUIState({
      aiState: {
        ...this.appState.uiState.aiState,
        isThinking,
        thinkingStartTime: isThinking ? new Date() : null,
        engineStatus: isThinking ? 'thinking' : 'ready'
      }
    });
    this.persistState();
  }

  public setAIThinkingMoves(thinkingMoves: ThinkingMove[]): void {
    this.updateUIState({
      aiState: {
        ...this.appState.uiState.aiState,
        thinkingMoves
      }
    });
  }

  public setAIEngineStatus(status: 'ready' | 'thinking' | 'error' | 'offline'): void {
    this.updateUIState({
      aiState: {
        ...this.appState.uiState.aiState,
        engineStatus: status
      }
    });
    this.persistState();
  }

  public isAITurn(): boolean {
    const currentGame = this.getCurrentGame();
    if (!currentGame || this.getGameMode() === 'HUMAN_VS_HUMAN') {
      return false;
    }

    if (this.getGameMode() === 'HUMAN_VS_AI') {
      // In human vs AI, AI plays as black
      return currentGame.currentPlayer === 'black';
    }

    if (this.getGameMode() === 'AI_VS_AI') {
      // For testing - AI plays both sides
      return true;
    }

    return false;
  }

  public getAIState(): AIUIState {
    return this.appState.uiState.aiState;
  }

  public recordAIMove(moveTime: number): void {
    this.updateUIState({
      aiState: {
        ...this.appState.uiState.aiState,
        lastAIMoveTime: moveTime,
        thinkingMoves: [],
        thinkingStartTime: null,
        isThinking: false,
        engineStatus: 'ready'
      }
    });
    this.persistState();
  }

  // =============================================================================
  // RESOURCE CLEANUP
  // =============================================================================

  public dispose(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
    this.persistState(); // Final save
  }
}