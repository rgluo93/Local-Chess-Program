/**
 * AI Integration Test Suite - TDD approach
 * 
 * Tests the complete AI integration with game systems,
 * covering test scenarios #26-30 and full game flow.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import type { Move, GameState } from '@/types/Chess';
import type { GameMode, EngineOptions, ThinkingMove } from '../types/AITypes';

// Mock external dependencies
const mockGameStateManager = {
  getCurrentState: vi.fn(),
  setGameMode: vi.fn(),
  getGameMode: vi.fn(),
  setAIThinking: vi.fn(),
  isAITurn: vi.fn(),
  processMove: vi.fn(),
};

const mockChessGameOrchestrator = {
  setGameMode: vi.fn(),
  handlePlayerMove: vi.fn(),
  triggerAIMove: vi.fn(),
  makeMove: vi.fn(),
  getGameState: vi.fn(),
};

const mockGameEngine = {
  makeMove: vi.fn(),
  validateMove: vi.fn(),
  getValidMoves: vi.fn(),
  isGameOver: vi.fn(),
};

const mockAIPlayer = {
  initialize: vi.fn(),
  makeMove: vi.fn(),
  startThinking: vi.fn(),
  stopThinking: vi.fn(),
  getThinkingMoves: vi.fn(),
  isThinking: vi.fn(),
  isReady: vi.fn(),
  setEngineOptions: vi.fn(),
  destroy: vi.fn(),
};

// Mock imports
vi.mock('@/engine/GameStateManager', () => ({
  GameStateManager: vi.fn(() => mockGameStateManager)
}));

vi.mock('@/orchestrator/ChessGameOrchestrator', () => ({
  ChessGameOrchestrator: vi.fn(() => mockChessGameOrchestrator)
}));

vi.mock('@/engine/GameEngine', () => ({
  GameEngine: vi.fn(() => mockGameEngine)
}));

vi.mock('../AIPlayer', () => ({
  AIPlayer: vi.fn(() => mockAIPlayer)
}));

// Import the integration module (to be implemented)
const { AIGameIntegration } = await import('../AIGameIntegration');

describe('AI Game Integration', () => {
  let integration: AIGameIntegration;
  let mockGameState: GameState;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockAIPlayer.initialize.mockResolvedValue(undefined);
    mockAIPlayer.isReady.mockReturnValue(true);
    mockAIPlayer.isThinking.mockReturnValue(false);
    
    mockGameStateManager.getGameMode.mockReturnValue('HUMAN_VS_HUMAN');
    mockGameStateManager.isAITurn.mockReturnValue(false);
    
    mockGameEngine.isGameOver.mockReturnValue(false);
    mockGameEngine.validateMove.mockReturnValue({ isValid: true });
    
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
    
    mockChessGameOrchestrator.getGameState.mockReturnValue(mockGameState);
    
    integration = new AIGameIntegration();
  });

  afterEach(() => {
    if (integration) {
      integration.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize all AI components', async () => {
      // Act
      await integration.initialize();

      // Assert
      expect(mockAIPlayer.initialize).toHaveBeenCalled();
      expect(integration.isReady()).toBe(true);
    });

    it('should handle initialization failure gracefully', async () => {
      // Arrange
      mockAIPlayer.initialize.mockRejectedValue(new Error('AI init failed'));

      // Act & Assert
      await expect(integration.initialize()).rejects.toThrow('AI init failed');
    });
  });

  describe('Game Mode Management', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should switch to AI mode correctly', async () => {
      // Act
      await integration.setGameMode('HUMAN_VS_AI');

      // Assert
      expect(mockGameStateManager.setGameMode).toHaveBeenCalledWith('HUMAN_VS_AI');
      expect(mockChessGameOrchestrator.setGameMode).toHaveBeenCalledWith('HUMAN_VS_AI');
    });

    it('should handle human vs human mode', async () => {
      // Act
      await integration.setGameMode('HUMAN_VS_HUMAN');

      // Assert
      expect(mockGameStateManager.setGameMode).toHaveBeenCalledWith('HUMAN_VS_HUMAN');
      expect(mockAIPlayer.stopThinking).toHaveBeenCalled();
    });

    it('should validate game mode transitions', async () => {
      // Arrange: Invalid mode
      // Act & Assert
      await expect(integration.setGameMode('INVALID_MODE' as GameMode))
        .rejects.toThrow('Invalid game mode');
    });
  });

  describe('AI Move Processing', () => {
    beforeEach(async () => {
      await integration.initialize();
      await integration.setGameMode('HUMAN_VS_AI');
    });

    it('should process AI moves after human moves', async () => {
      // Arrange
      const humanMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      const aiMove: Move = { from: 'e7', to: 'e5', piece: 'p', color: 'b' };
      
      mockGameStateManager.isAITurn.mockReturnValue(true);
      mockAIPlayer.makeMove.mockResolvedValue(aiMove);
      mockGameEngine.makeMove.mockReturnValue({ isValid: true, move: aiMove });

      // Act
      await integration.processPlayerMove(humanMove);

      // Assert
      expect(mockChessGameOrchestrator.handlePlayerMove).toHaveBeenCalledWith(humanMove);
      expect(mockAIPlayer.makeMove).toHaveBeenCalled();
      expect(mockChessGameOrchestrator.makeMove).toHaveBeenCalledWith(aiMove);
    });

    it('should not trigger AI in human vs human mode', async () => {
      // Arrange
      await integration.setGameMode('HUMAN_VS_HUMAN');
      const humanMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      
      mockGameStateManager.isAITurn.mockReturnValue(false);

      // Act
      await integration.processPlayerMove(humanMove);

      // Assert
      expect(mockChessGameOrchestrator.handlePlayerMove).toHaveBeenCalledWith(humanMove);
      expect(mockAIPlayer.makeMove).not.toHaveBeenCalled();
    });

    it('should handle AI move calculation errors', async () => {
      // Arrange
      const humanMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      
      mockGameStateManager.isAITurn.mockReturnValue(true);
      mockAIPlayer.makeMove.mockRejectedValue(new Error('AI calculation failed'));

      // Act & Assert
      await expect(integration.processPlayerMove(humanMove))
        .rejects.toThrow('AI calculation failed');
    });
  });

  describe('Thinking Visualization', () => {
    beforeEach(async () => {
      await integration.initialize();
      await integration.setGameMode('HUMAN_VS_AI');
    });

    it('should provide thinking moves for visualization', () => {
      // Arrange
      const thinkingMoves: ThinkingMove[] = [
        { move: { from: 'e7', to: 'e5', piece: 'p', color: 'b' }, evaluation: 0, depth: 8, pv: [] },
        { move: { from: 'd7', to: 'd6', piece: 'p', color: 'b' }, evaluation: -10, depth: 8, pv: [] },
        { move: { from: 'g8', to: 'f6', piece: 'n', color: 'b' }, evaluation: -5, depth: 8, pv: [] }
      ];
      
      mockAIPlayer.getThinkingMoves.mockReturnValue(thinkingMoves);

      // Act
      const moves = integration.getAIThinkingMoves();

      // Assert
      expect(moves).toEqual(thinkingMoves);
      expect(moves).toHaveLength(3);
    });

    it('should track AI thinking state', async () => {
      // Arrange
      const humanMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      
      mockGameStateManager.isAITurn.mockReturnValue(true);
      mockAIPlayer.isThinking.mockReturnValue(true);

      // Act
      integration.processPlayerMove(humanMove);

      // Assert
      expect(integration.isAIThinking()).toBe(true);
      expect(mockGameStateManager.setAIThinking).toHaveBeenCalledWith(true);
    });

    it('should clear thinking state after AI move', async () => {
      // Arrange
      const humanMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      const aiMove: Move = { from: 'e7', to: 'e5', piece: 'p', color: 'b' };
      
      mockGameStateManager.isAITurn.mockReturnValue(true);
      mockAIPlayer.makeMove.mockResolvedValue(aiMove);
      mockAIPlayer.isThinking.mockReturnValueOnce(true).mockReturnValueOnce(false);

      // Act
      await integration.processPlayerMove(humanMove);

      // Assert
      expect(mockGameStateManager.setAIThinking).toHaveBeenCalledWith(false);
    });
  });

  describe('Test Scenario #26: Basic AI Move Generation', () => {
    it('should generate legal AI moves for starting position', async () => {
      // Arrange
      await integration.initialize();
      await integration.setGameMode('HUMAN_VS_AI');
      
      const humanMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      const expectedAIMove: Move = { from: 'e7', to: 'e5', piece: 'p', color: 'b' };
      
      mockGameStateManager.isAITurn.mockReturnValue(true);
      mockAIPlayer.makeMove.mockResolvedValue(expectedAIMove);
      mockGameEngine.makeMove.mockReturnValue({ isValid: true, move: expectedAIMove });

      // Act
      await integration.processPlayerMove(humanMove);

      // Assert
      expect(mockAIPlayer.makeMove).toHaveBeenCalledWith(expect.objectContaining({
        fen: expect.any(String),
        currentPlayer: 'b'
      }));
      expect(mockChessGameOrchestrator.makeMove).toHaveBeenCalledWith(expectedAIMove);
    });

    it('should validate AI moves are legal', async () => {
      // Arrange
      await integration.initialize();
      await integration.setGameMode('HUMAN_VS_AI');
      
      const humanMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      const aiMove: Move = { from: 'e7', to: 'e5', piece: 'p', color: 'b' };
      
      mockGameStateManager.isAITurn.mockReturnValue(true);
      mockAIPlayer.makeMove.mockResolvedValue(aiMove);
      mockGameEngine.validateMove.mockReturnValue({ isValid: true });

      // Act
      await integration.processPlayerMove(humanMove);

      // Assert
      expect(mockGameEngine.validateMove).toHaveBeenCalledWith(
        expect.any(String), // from
        expect.any(String), // to
        expect.any(String)  // promotion
      );
    });
  });

  describe('Test Scenario #27: AI vs Human Complete Game', () => {
    it('should maintain game flow through complete game', async () => {
      // Arrange
      await integration.initialize();
      await integration.setGameMode('HUMAN_VS_AI');
      
      const gameMoves = [
        { human: { from: 'e2', to: 'e4', piece: 'p', color: 'w' }, ai: { from: 'e7', to: 'e5', piece: 'p', color: 'b' } },
        { human: { from: 'g1', to: 'f3', piece: 'n', color: 'w' }, ai: { from: 'b8', to: 'c6', piece: 'n', color: 'b' } },
        { human: { from: 'f1', to: 'c4', piece: 'b', color: 'w' }, ai: { from: 'f8', to: 'c5', piece: 'b', color: 'b' } }
      ];

      // Act & Assert: Play through multiple moves
      for (const movePair of gameMoves) {
        mockGameStateManager.isAITurn.mockReturnValue(true);
        mockAIPlayer.makeMove.mockResolvedValue(movePair.ai);
        mockGameEngine.makeMove.mockReturnValue({ isValid: true });

        await integration.processPlayerMove(movePair.human);

        expect(mockChessGameOrchestrator.handlePlayerMove).toHaveBeenCalledWith(movePair.human);
        expect(mockAIPlayer.makeMove).toHaveBeenCalled();
        expect(mockChessGameOrchestrator.makeMove).toHaveBeenCalledWith(movePair.ai);
      }
    });

    it('should handle game ending scenarios', async () => {
      // Arrange
      await integration.initialize();
      await integration.setGameMode('HUMAN_VS_AI');
      
      const finalMove: Move = { from: 'h2', to: 'h4', piece: 'p', color: 'w' };
      const checkmateMove: Move = { from: 'd8', to: 'h4', piece: 'q', color: 'b' };
      
      mockGameStateManager.isAITurn.mockReturnValue(true);
      mockAIPlayer.makeMove.mockResolvedValue(checkmateMove);
      mockGameEngine.makeMove.mockReturnValue({ 
        isValid: true, 
        move: checkmateMove,
        gameStatus: 'checkmate',
        isGameOver: true 
      });

      // Act
      await integration.processPlayerMove(finalMove);

      // Assert
      expect(mockChessGameOrchestrator.makeMove).toHaveBeenCalledWith(checkmateMove);
      // Game should detect checkmate and end properly
    });
  });

  describe('Test Scenario #28: Engine Error Recovery', () => {
    it('should recover from engine communication errors', async () => {
      // Arrange
      await integration.initialize();
      await integration.setGameMode('HUMAN_VS_AI');
      
      const humanMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      
      mockGameStateManager.isAITurn.mockReturnValue(true);
      mockAIPlayer.makeMove
        .mockRejectedValueOnce(new Error('Engine communication error'))
        .mockResolvedValueOnce({ from: 'e7', to: 'e5', piece: 'p', color: 'b' });

      // Act: First attempt should fail, second should succeed
      await expect(integration.processPlayerMove(humanMove)).rejects.toThrow('Engine communication error');
      
      // Recovery attempt
      await integration.recoverFromError();
      await integration.processPlayerMove(humanMove);

      // Assert
      expect(mockAIPlayer.makeMove).toHaveBeenCalledTimes(2);
    });

    it('should fall back to human vs human mode on repeated failures', async () => {
      // Arrange
      await integration.initialize();
      await integration.setGameMode('HUMAN_VS_AI');
      
      const humanMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      
      mockGameStateManager.isAITurn.mockReturnValue(true);
      mockAIPlayer.makeMove.mockRejectedValue(new Error('Persistent engine failure'));

      // Act: Multiple failures should trigger fallback
      for (let i = 0; i < 3; i++) {
        try {
          await integration.processPlayerMove(humanMove);
        } catch (error) {
          // Expected to fail
        }
      }

      // Assert: Should have fallen back to human vs human
      expect(mockGameStateManager.setGameMode).toHaveBeenCalledWith('HUMAN_VS_HUMAN');
    });
  });

  describe('Test Scenario #29: AI Performance Benchmarking', () => {
    it('should complete AI moves within time limits', async () => {
      // Arrange
      await integration.initialize();
      await integration.setGameMode('HUMAN_VS_AI');
      
      const humanMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      const aiMove: Move = { from: 'e7', to: 'e5', piece: 'p', color: 'b' };
      
      mockGameStateManager.isAITurn.mockReturnValue(true);
      mockAIPlayer.makeMove.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(aiMove), 500))
      );

      // Act
      const startTime = Date.now();
      await integration.processPlayerMove(humanMove);
      const duration = Date.now() - startTime;

      // Assert: Should complete within reasonable time (< 2 seconds for test)
      expect(duration).toBeLessThan(2000);
      expect(mockAIPlayer.makeMove).toHaveBeenCalled();
    });

    it('should maintain UI responsiveness during AI calculation', () => {
      // Arrange
      const thinkingMoves: ThinkingMove[] = [
        { move: { from: 'e7', to: 'e5', piece: 'p', color: 'b' }, evaluation: 0, depth: 5, pv: [] }
      ];
      
      mockAIPlayer.getThinkingMoves.mockReturnValue(thinkingMoves);

      // Act: Multiple rapid calls should respond quickly
      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        integration.getAIThinkingMoves();
      }
      const duration = Date.now() - startTime;

      // Assert: Should remain responsive
      expect(duration).toBeLessThan(50); // Should be very fast
    });
  });

  describe('Test Scenario #30: AI Thinking Visualization', () => {
    it('should provide candidate moves during AI thinking', async () => {
      // Arrange
      await integration.initialize();
      await integration.setGameMode('HUMAN_VS_AI');
      
      const thinkingMoves: ThinkingMove[] = [
        { move: { from: 'e7', to: 'e5', piece: 'p', color: 'b' }, evaluation: 25, depth: 8, pv: [] },
        { move: { from: 'd7', to: 'd6', piece: 'p', color: 'b' }, evaluation: 15, depth: 8, pv: [] },
        { move: { from: 'g8', to: 'f6', piece: 'n', color: 'b' }, evaluation: 10, depth: 8, pv: [] }
      ];
      
      mockAIPlayer.getThinkingMoves.mockReturnValue(thinkingMoves);
      mockAIPlayer.isThinking.mockReturnValue(true);

      // Act
      const moves = integration.getAIThinkingMoves();

      // Assert
      expect(moves).toHaveLength(3);
      expect(moves[0].evaluation).toBeGreaterThan(moves[1].evaluation);
      expect(moves[1].evaluation).toBeGreaterThan(moves[2].evaluation);
      
      // Should provide moves in evaluation order (best first)
      expect(moves[0].move.from).toBe('e7');
      expect(moves[0].move.to).toBe('e5');
    });

    it('should update thinking moves progressively', async () => {
      // Arrange
      await integration.initialize();
      await integration.setGameMode('HUMAN_VS_AI');
      
      const progressiveThinking = [
        [{ move: { from: 'e7', to: 'e5', piece: 'p', color: 'b' }, evaluation: 0, depth: 1, pv: [] }],
        [
          { move: { from: 'e7', to: 'e5', piece: 'p', color: 'b' }, evaluation: 15, depth: 5, pv: [] },
          { move: { from: 'd7', to: 'd6', piece: 'p', color: 'b' }, evaluation: 10, depth: 5, pv: [] }
        ],
        [
          { move: { from: 'e7', to: 'e5', piece: 'p', color: 'b' }, evaluation: 25, depth: 8, pv: [] },
          { move: { from: 'd7', to: 'd6', piece: 'p', color: 'b' }, evaluation: 15, depth: 8, pv: [] },
          { move: { from: 'g8', to: 'f6', piece: 'n', color: 'b' }, evaluation: 10, depth: 8, pv: [] }
        ]
      ];

      // Act & Assert: Simulate progressive thinking
      for (const thinking of progressiveThinking) {
        mockAIPlayer.getThinkingMoves.mockReturnValue(thinking);
        const moves = integration.getAIThinkingMoves();
        
        expect(moves.length).toBeGreaterThan(0);
        expect(moves[0].depth).toBeGreaterThanOrEqual(1);
      }
    });

    it('should clear thinking moves after AI move completion', async () => {
      // Arrange
      await integration.initialize();
      await integration.setGameMode('HUMAN_VS_AI');
      
      const humanMove: Move = { from: 'e2', to: 'e4', piece: 'p', color: 'w' };
      const aiMove: Move = { from: 'e7', to: 'e5', piece: 'p', color: 'b' };
      
      mockGameStateManager.isAITurn.mockReturnValue(true);
      mockAIPlayer.makeMove.mockResolvedValue(aiMove);
      mockAIPlayer.isThinking
        .mockReturnValueOnce(true)  // During calculation
        .mockReturnValueOnce(false); // After completion
      mockAIPlayer.getThinkingMoves
        .mockReturnValueOnce([{ move: aiMove, evaluation: 25, depth: 8, pv: [] }])
        .mockReturnValueOnce([]); // Cleared after move

      // Act
      await integration.processPlayerMove(humanMove);
      const movesAfterCompletion = integration.getAIThinkingMoves();

      // Assert
      expect(movesAfterCompletion).toHaveLength(0);
    });
  });

  describe('Resource Management', () => {
    it('should clean up all resources on destroy', async () => {
      // Arrange
      await integration.initialize();

      // Act
      integration.destroy();

      // Assert
      expect(mockAIPlayer.destroy).toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', async () => {
      // Arrange
      await integration.initialize();

      // Act
      integration.destroy();
      integration.destroy();

      // Assert: Should not throw error
      expect(mockAIPlayer.destroy).toHaveBeenCalledTimes(1);
    });
  });
});