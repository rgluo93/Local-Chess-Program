/**
 * StockfishEngine Test Suite - TDD approach
 * 
 * Tests define the expected behavior of the StockfishEngine class
 * before implementation. Following TDD principles:
 * 1. Write failing tests first
 * 2. Implement minimal code to make tests pass
 * 3. Refactor while keeping tests green
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import type { Move } from '@/types/Chess';
import type { EngineOptions, EvaluationResult, AIError, AIErrorType } from '../types/AITypes';

// Mock Stockfish for testing
const mockStockfish = {
  postMessage: vi.fn(),
  onmessage: null as ((event: { data: string }) => void) | null,
  terminate: vi.fn(),
};

// Mock the stockfish module
vi.mock('stockfish', () => ({
  default: () => mockStockfish
}));

// Import after mocking
const { StockfishEngine } = await import('../StockfishEngine');

describe('StockfishEngine', () => {
  let engine: StockfishEngine;
  let mockWorker: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create fresh engine instance
    engine = new StockfishEngine();
    
    // Mock Web Worker
    mockWorker = {
      postMessage: vi.fn(),
      onmessage: null,
      terminate: vi.fn(),
    };
    
    // Mock Worker constructor
    global.Worker = vi.fn(() => mockWorker);
  });

  afterEach(() => {
    if (engine) {
      engine.terminate();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      // Arrange: Mock successful UCI handshake
      const initPromise = engine.initialize();
      
      // Simulate UCI responses
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({ data: 'uciok' });
          mockWorker.onmessage({ data: 'readyok' });
        }
      }, 10);

      // Act & Assert
      await expect(initPromise).resolves.toBeUndefined();
      expect(engine.isReady()).toBe(true);
      expect(mockWorker.postMessage).toHaveBeenCalledWith('uci');
      expect(mockWorker.postMessage).toHaveBeenCalledWith('isready');
    });

    it('should handle initialization failure', async () => {
      // Arrange: Mock failed initialization
      const initPromise = engine.initialize();
      
      // Simulate timeout (no response)
      setTimeout(() => {
        // No response from engine
      }, 10);

      // Act & Assert
      await expect(initPromise).rejects.toThrow('Engine initialization timeout');
      expect(engine.isReady()).toBe(false);
    });

    it('should not allow multiple initializations', async () => {
      // Arrange: First initialization
      const firstInit = engine.initialize();
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({ data: 'uciok' });
          mockWorker.onmessage({ data: 'readyok' });
        }
      }, 10);
      await firstInit;

      // Act & Assert: Second initialization should be rejected
      await expect(engine.initialize()).rejects.toThrow('Engine already initialized');
    });
  });

  describe('Position Management', () => {
    beforeEach(async () => {
      // Initialize engine for position tests
      const initPromise = engine.initialize();
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({ data: 'uciok' });
          mockWorker.onmessage({ data: 'readyok' });
        }
      }, 10);
      await initPromise;
    });

    it('should set position from FEN string', async () => {
      // Arrange
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      // Act
      await engine.setPosition(fen);
      
      // Assert
      expect(mockWorker.postMessage).toHaveBeenCalledWith(`position fen ${fen}`);
    });

    it('should handle invalid FEN string', async () => {
      // Arrange
      const invalidFen = 'invalid-fen-string';
      
      // Act & Assert
      await expect(engine.setPosition(invalidFen)).rejects.toThrow('Invalid FEN string');
    });

    it('should update position correctly', async () => {
      // Arrange
      const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const afterE4Fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      
      // Act
      await engine.setPosition(startFen);
      await engine.setPosition(afterE4Fen);
      
      // Assert
      expect(mockWorker.postMessage).toHaveBeenCalledWith(`position fen ${afterE4Fen}`);
    });
  });

  describe('Move Calculation', () => {
    beforeEach(async () => {
      // Initialize engine for move tests
      const initPromise = engine.initialize();
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({ data: 'uciok' });
          mockWorker.onmessage({ data: 'readyok' });
        }
      }, 10);
      await initPromise;

      // Set starting position
      await engine.setPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });

    it('should calculate best move with time limit', async () => {
      // Arrange
      const options: EngineOptions = { timeLimit: 1000 };
      const expectedMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      
      const movePromise = engine.getBestMove(options);
      
      // Simulate engine response
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({ data: 'bestmove e2e4' });
        }
      }, 10);

      // Act
      const result = await movePromise;

      // Assert
      expect(result.from).toBe('e2');
      expect(result.to).toBe('e4');
      expect(mockWorker.postMessage).toHaveBeenCalledWith('go movetime 1000');
    });

    it('should calculate best move with depth limit', async () => {
      // Arrange
      const options: EngineOptions = { depth: 10 };
      
      const movePromise = engine.getBestMove(options);
      
      // Simulate engine response
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({ data: 'bestmove d2d4' });
        }
      }, 10);

      // Act
      const result = await movePromise;

      // Assert
      expect(result.from).toBe('d2');
      expect(result.to).toBe('d4');
      expect(mockWorker.postMessage).toHaveBeenCalledWith('go depth 10');
    });

    it('should handle calculation timeout', async () => {
      // Arrange
      const options: EngineOptions = { timeLimit: 100 };
      
      const movePromise = engine.getBestMove(options);
      
      // Don't simulate any response (timeout)
      
      // Act & Assert
      await expect(movePromise).rejects.toThrow('Move calculation timeout');
    });

    it('should stop calculation when requested', async () => {
      // Arrange
      const options: EngineOptions = { timeLimit: 5000 };
      
      const movePromise = engine.getBestMove(options);
      
      // Act: Stop calculation immediately
      engine.stop();
      
      // Assert
      expect(mockWorker.postMessage).toHaveBeenCalledWith('stop');
      await expect(movePromise).rejects.toThrow('Calculation stopped');
    });
  });

  describe('Position Evaluation', () => {
    beforeEach(async () => {
      // Initialize engine for evaluation tests
      const initPromise = engine.initialize();
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({ data: 'uciok' });
          mockWorker.onmessage({ data: 'readyok' });
        }
      }, 10);
      await initPromise;
    });

    it('should evaluate position and return detailed result', async () => {
      // Arrange
      const evalPromise = engine.evaluatePosition();
      
      // Simulate detailed engine response
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({ 
            data: 'info depth 12 seldepth 16 multipv 1 score cp 25 nodes 125000 nps 125000 hashfull 50 time 1000 pv e2e4 e7e5 g1f3'
          });
          mockWorker.onmessage({ data: 'bestmove e2e4' });
        }
      }, 10);

      // Act
      const result: EvaluationResult = await evalPromise;

      // Assert
      expect(result.bestMove.from).toBe('e2');
      expect(result.bestMove.to).toBe('e4');
      expect(result.evaluation).toBe(25); // centipawns
      expect(result.depth).toBe(12);
      expect(result.nodes).toBe(125000);
      expect(result.principalVariation).toHaveLength(3);
    });

    it('should handle mate scores correctly', async () => {
      // Arrange
      const evalPromise = engine.evaluatePosition();
      
      // Simulate mate in 2 response
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({ 
            data: 'info depth 8 score mate 2 pv f7f8q'
          });
          mockWorker.onmessage({ data: 'bestmove f7f8q' });
        }
      }, 10);

      // Act
      const result = await evalPromise;

      // Assert
      expect(result.evaluation).toBe(999999); // Represents mate
      expect(result.bestMove.from).toBe('f7');
      expect(result.bestMove.to).toBe('f8');
    });
  });

  describe('Thinking State Management', () => {
    beforeEach(async () => {
      const initPromise = engine.initialize();
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({ data: 'uciok' });
          mockWorker.onmessage({ data: 'readyok' });
        }
      }, 10);
      await initPromise;
    });

    it('should track thinking state correctly', async () => {
      // Arrange
      expect(engine.isThinking()).toBe(false);
      
      // Act: Start calculation
      const movePromise = engine.getBestMove({ timeLimit: 1000 });
      expect(engine.isThinking()).toBe(true);
      
      // Complete calculation
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({ data: 'bestmove e2e4' });
        }
      }, 10);
      
      await movePromise;
      
      // Assert
      expect(engine.isThinking()).toBe(false);
    });

    it('should provide thinking moves for visualization', async () => {
      // Arrange
      const movePromise = engine.getBestMove({ multiPV: 3 });
      
      // Simulate multi-PV responses
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({ data: 'info multipv 1 score cp 25 pv e2e4' });
          mockWorker.onmessage({ data: 'info multipv 2 score cp 20 pv d2d4' });
          mockWorker.onmessage({ data: 'info multipv 3 score cp 15 pv g1f3' });
          mockWorker.onmessage({ data: 'bestmove e2e4' });
        }
      }, 10);

      // Act: Check thinking moves during calculation
      setTimeout(() => {
        const thinkingMoves = engine.getThinkingMoves();
        expect(thinkingMoves).toHaveLength(3);
        expect(thinkingMoves[0].move.from).toBe('e2');
        expect(thinkingMoves[1].move.from).toBe('d2');
        expect(thinkingMoves[2].move.from).toBe('g1');
      }, 20);

      await movePromise;
    });
  });

  describe('Error Handling', () => {
    it('should handle worker initialization failure', async () => {
      // Arrange: Mock Worker constructor to throw
      global.Worker = vi.fn(() => {
        throw new Error('Worker creation failed');
      });

      const newEngine = new StockfishEngine();

      // Act & Assert
      await expect(newEngine.initialize()).rejects.toThrow('Worker creation failed');
    });

    it('should handle engine crash during calculation', async () => {
      // Arrange
      const initPromise = engine.initialize();
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({ data: 'uciok' });
          mockWorker.onmessage({ data: 'readyok' });
        }
      }, 10);
      await initPromise;

      // Act: Start calculation then simulate worker crash
      const movePromise = engine.getBestMove({ timeLimit: 1000 });
      
      // Simulate worker error
      setTimeout(() => {
        if (mockWorker.onerror) {
          mockWorker.onerror(new Error('Engine crashed'));
        }
      }, 10);

      // Assert
      await expect(movePromise).rejects.toThrow('Engine crashed');
    });

    it('should provide detailed error information', async () => {
      // Arrange
      const movePromise = engine.getBestMove({ timeLimit: 100 });
      
      try {
        await movePromise;
      } catch (error: any) {
        // Assert
        expect(error).toHaveProperty('type');
        expect(error).toHaveProperty('message');
        expect(error.type).toBe('CALCULATION_TIMEOUT');
      }
    });
  });

  describe('Resource Management', () => {
    it('should terminate worker properly', () => {
      // Act
      engine.terminate();

      // Assert
      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(engine.isReady()).toBe(false);
    });

    it('should handle multiple termination calls gracefully', () => {
      // Act
      engine.terminate();
      engine.terminate();

      // Assert: Should not throw error
      expect(mockWorker.terminate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Test Scenario #26: Basic AI Move Generation', () => {
    it('should generate legal AI moves for standard positions', async () => {
      // Arrange: Initialize and set starting position
      const initPromise = engine.initialize();
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({ data: 'uciok' });
          mockWorker.onmessage({ data: 'readyok' });
        }
      }, 10);
      await initPromise;

      await engine.setPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

      // Act: Request AI move
      const movePromise = engine.getBestMove({ timeLimit: 1000 });
      
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({ data: 'bestmove e2e4' });
        }
      }, 10);

      const move = await movePromise;

      // Assert: Move should be legal opening move
      expect(['e2', 'd2', 'g1', 'b1']).toContain(move.from);
      expect(move.from).toBeDefined();
      expect(move.to).toBeDefined();
      expect(move.piece).toBeDefined();
      expect(move.color).toBeDefined();
    });
  });
});