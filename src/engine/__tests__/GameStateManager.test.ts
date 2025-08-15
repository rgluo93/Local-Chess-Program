/**
 * GameStateManager Unit Tests
 * 
 * Comprehensive tests for the GameStateManager class covering:
 * - Basic initialization and state creation
 * - State persistence (save/load) functionality
 * - State validation and error handling
 * - Integration with GameEngine
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameStateManager } from '../GameStateManager';
import type { AppSettings } from '@/types/GameState';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('GameStateManager', () => {
  let manager: GameStateManager;

  beforeEach(() => {
    localStorageMock.clear();
    manager = new GameStateManager(undefined, {
      enableAutoSave: false, // Disable for testing
      enableStateValidation: true,
    });
  });

  afterEach(() => {
    manager.dispose();
  });

  // =============================================================================
  // INITIALIZATION TESTS
  // =============================================================================

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      expect(manager.getCurrentGame()).toBeNull();
      expect(manager.getUIState()).toBeDefined();
      expect(manager.getSettings()).toBeDefined();
      expect(manager.getSavedGames()).toEqual([]);
    });

    it('should initialize GameEngine correctly', () => {
      const engine = manager.getGameEngine();
      expect(engine).toBeDefined();
      expect(engine.getFEN()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(engine.getCurrentPlayer()).toBe('white');
    });

    it('should apply custom options', () => {
      const customManager = new GameStateManager(undefined, {
        enableAutoSave: true,
        autoSaveInterval: 5000,
        maxSavedGames: 50,
      });
      
      expect(customManager.getSettings()).toBeDefined();
      customManager.dispose();
    });
  });

  // =============================================================================
  // GAME MANAGEMENT TESTS
  // =============================================================================

  describe('Game Management', () => {
    it('should start new game correctly', () => {
      manager.startNewGame();
      
      const currentGame = manager.getCurrentGame();
      expect(currentGame).not.toBeNull();
      expect(currentGame!.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(currentGame!.currentPlayer).toBe('white');
      expect(currentGame!.status).toBe('playing');
      expect(currentGame!.moves).toEqual([]);
    });

    it('should make moves and update state', () => {
      manager.startNewGame();
      
      const moveSuccess = manager.makeMove('e2', 'e4');
      expect(moveSuccess).toBe(true);
      
      const currentGame = manager.getCurrentGame();
      expect(currentGame!.moves).toHaveLength(1);
      expect(currentGame!.moves[0].from).toBe('e2');
      expect(currentGame!.moves[0].to).toBe('e4');
      expect(currentGame!.currentPlayer).toBe('black');
      
      const uiState = manager.getUIState();
      // lastMove highlighting has been removed per user request
    });

    it('should reject invalid moves', () => {
      manager.startNewGame();
      
      const moveSuccess = manager.makeMove('e2', 'e5'); // Invalid move
      expect(moveSuccess).toBe(false);
      
      const currentGame = manager.getCurrentGame();
      expect(currentGame!.moves).toHaveLength(0);
      expect(currentGame!.currentPlayer).toBe('white');
    });

    it('should handle undo moves', () => {
      manager.startNewGame();
      manager.makeMove('e2', 'e4');
      manager.makeMove('e7', 'e5');
      
      expect(manager.getCurrentGame()!.moves).toHaveLength(2);
      
      const undoSuccess = manager.undoLastMove();
      expect(undoSuccess).toBe(true);
      expect(manager.getCurrentGame()!.moves).toHaveLength(1);
      expect(manager.getCurrentGame()!.currentPlayer).toBe('black');
    });

    it('should handle game resignation', () => {
      manager.startNewGame();
      
      manager.resignGame('white');
      
      const currentGame = manager.getCurrentGame();
      expect(currentGame!.status).toBe('resigned');
      expect(currentGame!.result).toBe('black_wins');
      expect(currentGame!.endDate).toBeInstanceOf(Date);
    });

    it('should handle draw offers', () => {
      manager.startNewGame();
      
      manager.offerDraw();
      
      const currentGame = manager.getCurrentGame();
      expect(currentGame!.status).toBe('draw');
      expect(currentGame!.result).toBe('draw');
      expect(currentGame!.endDate).toBeInstanceOf(Date);
    });
  });

  // =============================================================================
  // UI STATE TESTS
  // =============================================================================

  describe('UI State Management', () => {
    it('should update UI state', () => {
      const update = { zoomLevel: 1.5, showCoordinates: false };
      manager.updateUIState(update);
      
      const uiState = manager.getUIState();
      expect(uiState.zoomLevel).toBe(1.5);
      expect(uiState.showCoordinates).toBe(false);
    });

    it('should handle square selection', () => {
      manager.startNewGame();
      manager.selectSquare('e2');
      
      const uiState = manager.getUIState();
      expect(uiState.selectedSquare).toBe('e2');
      expect(uiState.validMoves).toContain('e3');
      expect(uiState.validMoves).toContain('e4');
      expect(uiState.highlightedSquares.selected).toBe('e2');
    });

    it('should clear selection when square is null', () => {
      manager.startNewGame();
      manager.selectSquare('e2');
      manager.selectSquare(null);
      
      const uiState = manager.getUIState();
      expect(uiState.selectedSquare).toBeNull();
      expect(uiState.validMoves).toEqual([]);
      expect(uiState.highlightedSquares.selected).toBeNull();
    });

    it('should update settings', () => {
      const settingsUpdate: Partial<AppSettings> = {
        display: {
          theme: 'modern',
          boardColors: { lightSquare: '#fff', darkSquare: '#000' },
          pieceStyle: 'modern',
          showCoordinates: false,
          showMoveHistory: false,
          highlightLastMove: false,
          highlightValidMoves: false,
          animationSpeed: 'fast',
          zoomLevel: 1.5,
        },
      };
      
      manager.updateSettings(settingsUpdate);
      
      const settings = manager.getSettings();
      expect(settings.display.theme).toBe('modern');
      expect(settings.display.zoomLevel).toBe(1.5);
    });
  });

  // =============================================================================
  // PERSISTENCE TESTS
  // =============================================================================

  describe('Game Persistence', () => {
    it('should save games correctly', () => {
      manager.startNewGame();
      manager.makeMove('e2', 'e4');
      manager.makeMove('e7', 'e5');
      
      const savedGame = manager.saveGame('Test Game');
      
      expect(savedGame.name).toBe('Test Game');
      expect(savedGame.moveCount).toBe(2);
      expect(savedGame.status).toBe('playing');
      expect(savedGame.id).toBeDefined();
      
      const savedGames = manager.getSavedGames();
      expect(savedGames).toHaveLength(1);
      expect(savedGames[0].id).toBe(savedGame.id);
    });

    it('should load games correctly', () => {
      manager.startNewGame();
      manager.makeMove('e2', 'e4');
      manager.makeMove('e7', 'e5');
      
      const savedGame = manager.saveGame('Test Game');
      
      // Start a new game
      manager.startNewGame();
      expect(manager.getCurrentGame()!.moves).toHaveLength(0);
      
      // Load the saved game
      const loadSuccess = manager.loadGame(savedGame.id);
      expect(loadSuccess).toBe(true);
      
      const currentGame = manager.getCurrentGame();
      expect(currentGame!.moves).toHaveLength(2);
      expect(currentGame!.moves[0].from).toBe('e2');
      expect(currentGame!.moves[0].to).toBe('e4');
      expect(currentGame!.moves[1].from).toBe('e7');
      expect(currentGame!.moves[1].to).toBe('e5');
    });

    it('should handle loading non-existent games', () => {
      const loadSuccess = manager.loadGame('non-existent-id');
      expect(loadSuccess).toBe(false);
    });

    it('should delete games correctly', () => {
      manager.startNewGame();
      const savedGame = manager.saveGame('Test Game');
      
      expect(manager.getSavedGames()).toHaveLength(1);
      
      const deleteSuccess = manager.deleteGame(savedGame.id);
      expect(deleteSuccess).toBe(true);
      expect(manager.getSavedGames()).toHaveLength(0);
      
      const deleteAgain = manager.deleteGame(savedGame.id);
      expect(deleteAgain).toBe(false);
    });

    it('should persist state to localStorage', () => {
      manager.startNewGame();
      manager.makeMove('e2', 'e4');
      
      // Force persistence (since auto-save is disabled)
      manager.updateUIState({ zoomLevel: 1.5 });
      
      const stored = localStorage.getItem('chess-program-state');
      expect(stored).not.toBeNull();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.currentGame).toBeDefined();
      expect(parsed.lastUpdated).toBeDefined();
    });

    it('should restore state from localStorage', () => {
      // Create initial state
      manager.startNewGame();
      manager.makeMove('e2', 'e4');
      manager.updateUIState({ zoomLevel: 1.5 });
      
      // Create new manager (simulates app restart)
      const newManager = new GameStateManager(undefined, { enableAutoSave: false });
      
      const currentGame = newManager.getCurrentGame();
      expect(currentGame).not.toBeNull();
      expect(currentGame!.moves).toHaveLength(1);
      
      const uiState = newManager.getUIState();
      expect(uiState.zoomLevel).toBe(1.5);
      
      newManager.dispose();
    });
  });

  // =============================================================================
  // STATE VALIDATION TESTS
  // =============================================================================

  describe('State Validation', () => {
    it('should validate valid state', () => {
      manager.startNewGame();
      
      const validation = manager.validateState();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid game state', () => {
      manager.startNewGame();
      
      // Manually corrupt the state
      const currentGame = manager.getCurrentGame()!;
      (currentGame as any).fen = null;
      
      const validation = manager.validateState();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(err => err.field === 'fen')).toBe(true);
    });

    it('should generate warnings for unusual states', () => {
      manager.updateUIState({ zoomLevel: 3.0 }); // Outside recommended range
      
      const validation = manager.validateState();
      expect(validation.warnings.some(warn => warn.field === 'zoomLevel')).toBe(true);
    });
  });

  // =============================================================================
  // INTEGRATION TESTS
  // =============================================================================

  describe('GameEngine Integration', () => {
    it('should maintain sync with GameEngine', () => {
      manager.startNewGame();
      manager.makeMove('e2', 'e4');
      manager.makeMove('e7', 'e5');
      
      const engine = manager.getGameEngine();
      const currentGame = manager.getCurrentGame()!;
      
      expect(engine.getFEN()).toBe(currentGame.fen);
      expect(engine.getCurrentPlayer()).toBe(currentGame.currentPlayer);
      expect(engine.getMoveHistory()).toEqual(currentGame.moves);
      expect(engine.getGameStatus()).toBe(currentGame.status);
    });

    it('should handle check detection', () => {
      manager.startNewGame();
      
      // Set up a position with check
      const moves = [
        ['e2', 'e4'], ['e7', 'e5'], ['d1', 'h5'], ['b8', 'c6'], 
        ['f1', 'c4'], ['g8', 'f6'], ['h5', 'f7']  // Checkmate
      ] as const;
      
      for (const [from, to] of moves) {
        manager.makeMove(from, to);
      }
      
      expect(manager.isGameOver()).toBe(true);
      expect(manager.getGameStatus()).toBe('checkmate');
    });

    it('should provide correct valid moves', () => {
      manager.startNewGame();
      
      const pawnMoves = manager.getValidMoves('e2');
      expect(pawnMoves).toContain('e3');
      expect(pawnMoves).toContain('e4');
      expect(pawnMoves).toHaveLength(2);
      
      const knightMoves = manager.getValidMoves('g1');
      expect(knightMoves).toContain('f3');
      expect(knightMoves).toContain('h3');
      expect(knightMoves).toHaveLength(2);
    });
  });
});