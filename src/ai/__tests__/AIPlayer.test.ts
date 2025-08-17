/**
 * AIPlayer Test Suite - TDD approach
 * 
 * Tests define the expected behavior of the AIPlayer class
 * which coordinates AI gameplay at a high level.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import type { Move, GameState } from '@/types/Chess';
import type { EngineOptions, GameMode, ThinkingMove } from '../types/AITypes';

// Mock StockfishEngine
const mockStockfishEngine = {
  initialize: vi.fn(),
  setPosition: vi.fn(),
  getBestMove: vi.fn(),
  evaluatePosition: vi.fn(),
  getThinkingMoves: vi.fn(),
  stop: vi.fn(),
  terminate: vi.fn(),
  isReady: vi.fn(),
  isThinking: vi.fn(),
};

// Mock the StockfishEngine import
vi.mock('../StockfishEngine', () => ({
  StockfishEngine: vi.fn(() => mockStockfishEngine)
}));

// Import after mocking
const { AIPlayer } = await import('../AIPlayer');

describe('AIPlayer', () => {
  let aiPlayer: AIPlayer;
  let mockGameState: GameState;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock engine responses
    mockStockfishEngine.initialize.mockResolvedValue(undefined);
    mockStockfishEngine.setPosition.mockResolvedValue(undefined);
    mockStockfishEngine.isReady.mockReturnValue(true);
    mockStockfishEngine.isThinking.mockReturnValue(false);
    
    aiPlayer = new AIPlayer();
    
    // Mock game state
    mockGameState = {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      pgn: '',
      moves: [],
      currentPlayer: 'w',
      status: 'playing',
      result: null,
      startDate: new Date(),
      endDate: null,
      board: [] // Mock board
    };
  });

  afterEach(() => {
    if (aiPlayer) {
      aiPlayer.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      // Act
      await aiPlayer.initialize();

      // Assert
      expect(mockStockfishEngine.initialize).toHaveBeenCalled();
      expect(aiPlayer.isReady()).toBe(true);
    });

    it('should handle initialization failure', async () => {
      // Arrange
      mockStockfishEngine.initialize.mockRejectedValue(new Error('Init failed'));

      // Act & Assert
      await expect(aiPlayer.initialize()).rejects.toThrow('Init failed');
      expect(aiPlayer.isReady()).toBe(false);
    });

    it('should not allow operations before initialization', async () => {
      // Arrange: Don't initialize
      mockStockfishEngine.isReady.mockReturnValue(false);

      // Act & Assert
      await expect(aiPlayer.makeMove(mockGameState)).rejects.toThrow('AI player not initialized');
    });
  });

  describe('Move Generation', () => {
    beforeEach(async () => {
      await aiPlayer.initialize();
    });

    it('should make a valid move for the current position', async () => {
      // Arrange
      const expectedMove: Move = {
        from: 'e2',
        to: 'e4',
        piece: 'p',
        color: 'w',
        san: 'e4'
      };
      
      mockStockfishEngine.getBestMove.mockResolvedValue(expectedMove);

      // Act
      const move = await aiPlayer.makeMove(mockGameState);

      // Assert
      expect(mockStockfishEngine.setPosition).toHaveBeenCalledWith(mockGameState.fen);
      expect(mockStockfishEngine.getBestMove).toHaveBeenCalled();
      expect(move).toEqual(expectedMove);
    });

    it('should use default engine options when none provided', async () => {
      // Arrange
      const expectedMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      mockStockfishEngine.getBestMove.mockResolvedValue(expectedMove);

      // Act
      await aiPlayer.makeMove(mockGameState);

      // Assert
      const callArgs = mockStockfishEngine.getBestMove.mock.calls[0][0];
      expect(callArgs).toHaveProperty('timeLimit');
      expect(callArgs.timeLimit).toBeGreaterThan(0);
    });

    it('should use custom engine options when provided', async () => {
      // Arrange
      const customOptions: EngineOptions = {
        timeLimit: 5000,
        depth: 15,
        multiPV: 5
      };
      const expectedMove: Move = { from: 'd2', to: 'd4', piece: 'p', color: 'w' };
      
      mockStockfishEngine.getBestMove.mockResolvedValue(expectedMove);
      aiPlayer.setEngineOptions(customOptions);

      // Act
      await aiPlayer.makeMove(mockGameState);

      // Assert
      expect(mockStockfishEngine.getBestMove).toHaveBeenCalledWith(customOptions);
    });

    it('should handle move calculation timeout gracefully', async () => {
      // Arrange
      mockStockfishEngine.getBestMove.mockRejectedValue(new Error('Calculation timeout'));

      // Act & Assert
      await expect(aiPlayer.makeMove(mockGameState)).rejects.toThrow('Calculation timeout');
    });

    it('should validate AI moves before returning', async () => {
      // Arrange: Mock invalid move (piece doesn't exist on from square)
      const invalidMove: Move = { from: 'e3', to: 'e4', piece: 'p', color: 'w' };
      mockStockfishEngine.getBestMove.mockResolvedValue(invalidMove);

      // Act & Assert
      await expect(aiPlayer.makeMove(mockGameState)).rejects.toThrow('Invalid AI move');
    });
  });

  describe('Thinking State Management', () => {
    beforeEach(async () => {
      await aiPlayer.initialize();
    });

    it('should track thinking state correctly', async () => {
      // Arrange
      mockStockfishEngine.isThinking.mockReturnValue(false);
      expect(aiPlayer.isThinking()).toBe(false);

      // Act: Start thinking
      aiPlayer.startThinking(mockGameState);
      mockStockfishEngine.isThinking.mockReturnValue(true);
      
      // Assert
      expect(aiPlayer.isThinking()).toBe(true);
      expect(mockStockfishEngine.setPosition).toHaveBeenCalledWith(mockGameState.fen);
    });

    it('should stop thinking when requested', () => {
      // Arrange: Start thinking
      mockStockfishEngine.isThinking.mockReturnValue(true);
      aiPlayer.startThinking(mockGameState);

      // Act
      aiPlayer.stopThinking();

      // Assert
      expect(mockStockfishEngine.stop).toHaveBeenCalled();
    });

    it('should provide thinking moves for visualization', () => {
      // Arrange
      const mockThinkingMoves: ThinkingMove[] = [
        { move: { from: 'e2', to: 'e4', piece: 'p', color: 'w' }, evaluation: 25, depth: 8, pv: [] },
        { move: { from: 'd2', to: 'd4', piece: 'p', color: 'w' }, evaluation: 20, depth: 8, pv: [] },
        { move: { from: 'g1', to: 'f3', piece: 'n', color: 'w' }, evaluation: 15, depth: 8, pv: [] }
      ];
      
      mockStockfishEngine.getThinkingMoves.mockReturnValue(mockThinkingMoves);

      // Act
      const thinkingMoves = aiPlayer.getThinkingMoves();

      // Assert
      expect(thinkingMoves).toEqual(mockThinkingMoves);
      expect(thinkingMoves).toHaveLength(3);
    });

    it('should handle thinking state transitions correctly', async () => {
      // Arrange
      const expectedMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      mockStockfishEngine.getBestMove.mockImplementation(() => {
        // Simulate thinking state change during calculation
        mockStockfishEngine.isThinking.mockReturnValue(true);
        return new Promise(resolve => {
          setTimeout(() => {
            mockStockfishEngine.isThinking.mockReturnValue(false);
            resolve(expectedMove);
          }, 10);
        });
      });

      // Act
      const movePromise = aiPlayer.makeMove(mockGameState);
      
      // Assert: Should be thinking during calculation
      expect(aiPlayer.isThinking()).toBe(true);
      
      const move = await movePromise;
      
      // Assert: Should not be thinking after completion
      expect(aiPlayer.isThinking()).toBe(false);
      expect(move).toEqual(expectedMove);
    });
  });

  describe('Engine Options Management', () => {
    beforeEach(async () => {
      await aiPlayer.initialize();
    });

    it('should use default options initially', async () => {
      // Arrange
      const expectedMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      mockStockfishEngine.getBestMove.mockResolvedValue(expectedMove);

      // Act
      await aiPlayer.makeMove(mockGameState);

      // Assert
      const options = mockStockfishEngine.getBestMove.mock.calls[0][0];
      expect(options).toHaveProperty('timeLimit');
      expect(options.timeLimit).toBe(3000); // Default 3 seconds
    });

    it('should update engine options correctly', async () => {
      // Arrange
      const newOptions: EngineOptions = {
        timeLimit: 8000,
        depth: 20,
        multiPV: 1,
        debug: true
      };

      // Act
      aiPlayer.setEngineOptions(newOptions);

      // Assert: Next move should use new options
      const expectedMove: Move = { from: 'd2', to: 'd4', piece: 'p', color: 'w' };
      mockStockfishEngine.getBestMove.mockResolvedValue(expectedMove);
      
      await aiPlayer.makeMove(mockGameState);
      
      expect(mockStockfishEngine.getBestMove).toHaveBeenCalledWith(newOptions);
    });

    it('should merge partial options with defaults', () => {
      // Arrange
      const partialOptions: Partial<EngineOptions> = {
        timeLimit: 10000
      };

      // Act
      aiPlayer.setEngineOptions(partialOptions);

      // Assert: Should have merged with defaults
      const options = aiPlayer.getEngineOptions();
      expect(options.timeLimit).toBe(10000);
      expect(options).toHaveProperty('multiPV'); // Should have default multiPV
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await aiPlayer.initialize();
    });

    it('should handle engine communication errors', async () => {
      // Arrange
      mockStockfishEngine.setPosition.mockRejectedValue(new Error('Engine communication error'));

      // Act & Assert
      await expect(aiPlayer.makeMove(mockGameState)).rejects.toThrow('Engine communication error');
    });

    it('should handle engine crash during move calculation', async () => {
      // Arrange
      mockStockfishEngine.getBestMove.mockRejectedValue(new Error('Engine crashed'));

      // Act & Assert
      await expect(aiPlayer.makeMove(mockGameState)).rejects.toThrow('Engine crashed');
    });

    it('should provide fallback behavior on engine failure', async () => {
      // Arrange
      mockStockfishEngine.getBestMove.mockRejectedValue(new Error('Engine failed'));
      
      // Enable fallback mode
      aiPlayer.setFallbackMode(true);

      // Act: Should not throw but return an error indicator
      const result = await aiPlayer.makeMove(mockGameState);

      // Assert
      expect(result).toHaveProperty('error');
      expect(result.error).toBe(true);
    });
  });

  describe('Resource Management', () => {
    it('should clean up engine resources on destroy', () => {
      // Act
      aiPlayer.destroy();

      // Assert
      expect(mockStockfishEngine.terminate).toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', () => {
      // Act
      aiPlayer.destroy();
      aiPlayer.destroy();

      // Assert: Should not throw error
      expect(mockStockfishEngine.terminate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Game Integration', () => {
    beforeEach(async () => {
      await aiPlayer.initialize();
    });

    it('should handle different game positions correctly', async () => {
      // Arrange: Middle game position
      const middleGameState: GameState = {
        ...mockGameState,
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4'
      };
      
      const expectedMove: Move = { from: 'f3', to: 'g5', piece: 'n', color: 'w' };
      mockStockfishEngine.getBestMove.mockResolvedValue(expectedMove);

      // Act
      const move = await aiPlayer.makeMove(middleGameState);

      // Assert
      expect(mockStockfishEngine.setPosition).toHaveBeenCalledWith(middleGameState.fen);
      expect(move).toEqual(expectedMove);
    });

    it('should handle endgame positions correctly', async () => {
      // Arrange: King and pawn endgame
      const endgameState: GameState = {
        ...mockGameState,
        fen: '8/8/8/8/8/k7/p7/K7 b - - 0 1'
      };
      
      const expectedMove: Move = { from: 'a2', to: 'a1', piece: 'p', color: 'b', promotion: 'q' };
      mockStockfishEngine.getBestMove.mockResolvedValue(expectedMove);

      // Act
      const move = await aiPlayer.makeMove(endgameState);

      // Assert
      expect(move.promotion).toBe('q');
    });
  });

  describe('Test Scenario #27: AI vs Human Complete Game', () => {
    beforeEach(async () => {
      await aiPlayer.initialize();
    });

    it('should play complete game maintaining move quality', async () => {
      // Arrange: Simulate game progression
      const gamePositions = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Start
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', // After e4
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2', // After e5
      ];

      const expectedMoves = [
        { from: 'e2', to: 'e4', piece: 'p', color: 'w' },
        { from: 'g1', to: 'f3', piece: 'n', color: 'w' },
      ];

      // Act & Assert: Each move should be legal and strategic
      for (let i = 0; i < expectedMoves.length; i++) {
        mockStockfishEngine.getBestMove.mockResolvedValue(expectedMoves[i]);
        
        const gameState = { ...mockGameState, fen: gamePositions[i] };
        const move = await aiPlayer.makeMove(gameState);
        
        expect(move).toEqual(expectedMoves[i]);
        expect(move.from).toBeDefined();
        expect(move.to).toBeDefined();
      }
    });

    it('should handle game ending scenarios correctly', async () => {
      // Arrange: Position where AI can deliver checkmate
      const mateInOneState: GameState = {
        ...mockGameState,
        fen: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'
      };
      
      const matingMove: Move = { from: 'g2', to: 'g3', piece: 'p', color: 'w' };
      mockStockfishEngine.getBestMove.mockResolvedValue(matingMove);

      // Act
      const move = await aiPlayer.makeMove(mateInOneState);

      // Assert
      expect(move).toEqual(matingMove);
    });
  });

  describe('Performance Requirements', () => {
    beforeEach(async () => {
      await aiPlayer.initialize();
    });

    it('should complete move calculation within time limit', async () => {
      // Arrange
      const timeLimit = 1000; // 1 second
      aiPlayer.setEngineOptions({ timeLimit });
      
      const expectedMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      mockStockfishEngine.getBestMove.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(expectedMove), 500))
      );

      // Act
      const startTime = Date.now();
      const move = await aiPlayer.makeMove(mockGameState);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(timeLimit + 100); // Allow small buffer
      expect(move).toEqual(expectedMove);
    });

    it('should provide responsive thinking updates', () => {
      // Arrange
      const thinkingMoves: ThinkingMove[] = [
        { move: { from: 'e2', to: 'e4', piece: 'p', color: 'w' }, evaluation: 25, depth: 5, pv: [] }
      ];
      
      mockStockfishEngine.getThinkingMoves.mockReturnValue(thinkingMoves);

      // Act & Assert: Should return immediately
      const startTime = Date.now();
      const moves = aiPlayer.getThinkingMoves();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10); // Should be near-instantaneous
      expect(moves).toEqual(thinkingMoves);
    });
  });
});