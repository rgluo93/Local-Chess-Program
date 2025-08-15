/**
 * MoveHistoryManager Unit Tests
 * 
 * Tests for the MoveHistoryManager class covering:
 * - Move addition and retrieval
 * - History navigation (undo/redo)
 * - Move metadata tracking
 * - History serialization
 * - Replay functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MoveHistoryManager } from '../MoveHistoryManager';
import type { Move, MoveAnalysis } from '@/types/Chess';
import type { MoveHistoryEntry } from '@/types/GameState';

describe('MoveHistoryManager', () => {
  let manager: MoveHistoryManager;
  let sampleMove1: Move;
  let sampleMove2: Move;
  let sampleMove3: Move;

  beforeEach(() => {
    manager = new MoveHistoryManager();
    
    sampleMove1 = {
      from: 'e2',
      to: 'e4',
      piece: 'pawn',
      color: 'white',
      notation: 'e4',
      capture: false,
      check: false,
      checkmate: false,
      promotion: false,
    };

    sampleMove2 = {
      from: 'e7',
      to: 'e5',
      piece: 'pawn',
      color: 'black',
      notation: 'e5',
      capture: false,
      check: false,
      checkmate: false,
      promotion: false,
    };

    sampleMove3 = {
      from: 'g1',
      to: 'f3',
      piece: 'knight',
      color: 'white',
      notation: 'Nf3',
      capture: false,
      check: false,
      checkmate: false,
      promotion: false,
    };
  });

  afterEach(() => {
    manager.clear();
  });

  // =============================================================================
  // INITIALIZATION TESTS
  // =============================================================================

  describe('Initialization', () => {
    it('should initialize with empty history', () => {
      expect(manager.getTotalMoves()).toBe(0);
      expect(manager.getCurrentIndex()).toBe(-1);
      expect(manager.getAllMoves()).toEqual([]);
    });

    it('should initialize with custom options', () => {
      const customManager = new MoveHistoryManager({
        enableAnalysis: true,
        enableTiming: false,
        maxHistorySize: 500,
      });

      expect(customManager.getTotalMoves()).toBe(0);
    });
  });

  // =============================================================================
  // MOVE MANAGEMENT TESTS
  // =============================================================================

  describe('Move Management', () => {
    it('should add moves correctly', () => {
      manager.addMove(sampleMove1, 'position1');
      manager.addMove(sampleMove2, 'position2');

      expect(manager.getTotalMoves()).toBe(2);
      expect(manager.getCurrentIndex()).toBe(1);
      
      const lastMove = manager.getLastMove();
      expect(lastMove?.move).toEqual(sampleMove2);
      expect(lastMove?.position).toBe('position2');
    });

    it('should retrieve moves by index', () => {
      manager.addMove(sampleMove1, 'position1');
      manager.addMove(sampleMove2, 'position2');

      const move0 = manager.getMove(0);
      expect(move0?.move).toEqual(sampleMove1);
      expect(move0?.position).toBe('position1');

      const move1 = manager.getMove(1);
      expect(move1?.move).toEqual(sampleMove2);
      expect(move1?.position).toBe('position2');

      const invalidMove = manager.getMove(5);
      expect(invalidMove).toBeNull();
    });

    it('should get current move correctly', () => {
      manager.addMove(sampleMove1, 'position1');
      manager.addMove(sampleMove2, 'position2');

      const currentMove = manager.getCurrentMove();
      expect(currentMove?.move).toEqual(sampleMove2);
      expect(currentMove?.position).toBe('position2');
    });

    it('should handle move metadata', () => {
      // Create manager with analysis enabled
      const analysisManager = new MoveHistoryManager({
        enableAnalysis: true,
        enableTiming: true,
        enableComments: true,
      });

      const analysis: MoveAnalysis = {
        isBlunder: false,
        isMistake: false,
        isInaccuracy: false,
        isBrilliant: true,
        evaluation: 50,
      };

      analysisManager.addMove(sampleMove1, 'position1', analysis, 5000, ['Great opening move!']);

      const move = analysisManager.getMove(0);
      expect(move?.analysis).toEqual(analysis);
      expect(move?.timeSpent).toBe(5000);
      expect(move?.comments).toEqual(['Great opening move!']);
    });

    it('should truncate future moves when adding from middle of history', () => {
      manager.addMove(sampleMove1, 'position1');
      manager.addMove(sampleMove2, 'position2');
      manager.addMove(sampleMove3, 'position3');

      expect(manager.getTotalMoves()).toBe(3);

      // Go back to move 1
      manager.goToMove(0);
      expect(manager.getCurrentIndex()).toBe(0);

      // Add a new move - should truncate moves 2 and 3
      const newMove: Move = {
        from: 'd2',
        to: 'd4',
        piece: 'pawn',
        color: 'white',
        notation: 'd4',
        capture: false,
        check: false,
        checkmate: false,
        promotion: false,
      };

      manager.addMove(newMove, 'newPosition');

      expect(manager.getTotalMoves()).toBe(2);
      expect(manager.getCurrentIndex()).toBe(1);
      
      const lastMove = manager.getLastMove();
      expect(lastMove?.move.notation).toBe('d4');
    });
  });

  // =============================================================================
  // NAVIGATION TESTS
  // =============================================================================

  describe('History Navigation', () => {
    beforeEach(() => {
      manager.addMove(sampleMove1, 'position1');
      manager.addMove(sampleMove2, 'position2');
      manager.addMove(sampleMove3, 'position3');
    });

    it('should navigate to start', () => {
      const result = manager.goToStart();
      expect(result.success).toBe(true);
      expect(result.currentIndex).toBe(-1);
      expect(manager.getCurrentIndex()).toBe(-1);
    });

    it('should navigate to end', () => {
      manager.goToStart();
      
      const result = manager.goToEnd();
      expect(result.success).toBe(true);
      expect(result.currentIndex).toBe(2);
      expect(result.move).toEqual(sampleMove3);
    });

    it('should navigate to specific move', () => {
      const result = manager.goToMove(1);
      expect(result.success).toBe(true);
      expect(result.currentIndex).toBe(1);
      expect(result.move).toEqual(sampleMove2);

      const invalidResult = manager.goToMove(10);
      expect(invalidResult.success).toBe(false);
    });

    it('should navigate forward', () => {
      manager.goToStart();

      const result1 = manager.goForward();
      expect(result1.success).toBe(true);
      expect(result1.currentIndex).toBe(0);
      expect(result1.move).toEqual(sampleMove1);

      const result2 = manager.goForward();
      expect(result2.success).toBe(true);
      expect(result2.currentIndex).toBe(1);
      expect(result2.move).toEqual(sampleMove2);

      // Should fail when at end
      manager.goToEnd();
      const failResult = manager.goForward();
      expect(failResult.success).toBe(false);
    });

    it('should navigate backward', () => {
      const result1 = manager.goBackward();
      expect(result1.success).toBe(true);
      expect(result1.currentIndex).toBe(1);
      expect(result1.move).toEqual(sampleMove2);

      const result2 = manager.goBackward();
      expect(result2.success).toBe(true);
      expect(result2.currentIndex).toBe(0);
      expect(result2.move).toEqual(sampleMove1);

      // Should fail when at start
      manager.goToStart();
      const failResult = manager.goBackward();
      expect(failResult.success).toBe(false);
    });

    it('should check navigation availability', () => {
      manager.goToStart();
      expect(manager.canGoBackward()).toBe(false);
      expect(manager.canGoForward()).toBe(true);

      manager.goToEnd();
      expect(manager.canGoBackward()).toBe(true);
      expect(manager.canGoForward()).toBe(false);

      manager.goToMove(1);
      expect(manager.canGoBackward()).toBe(true);
      expect(manager.canGoForward()).toBe(true);
    });
  });

  // =============================================================================
  // ANALYSIS AND ANNOTATION TESTS
  // =============================================================================

  describe('Analysis and Annotations', () => {
    beforeEach(() => {
      manager.addMove(sampleMove1, 'position1');
      manager.addMove(sampleMove2, 'position2');
      manager.addMove(sampleMove3, 'position3');
    });

    it('should add analysis to moves', () => {
      const analysis: MoveAnalysis = {
        isBlunder: false,
        isMistake: false,
        isInaccuracy: false,
        isBrilliant: true,
        evaluation: 75,
      };

      const success = manager.addAnalysis(1, analysis);
      expect(success).toBe(true);

      const move = manager.getMove(1);
      expect(move?.analysis).toEqual(analysis);

      const failureResult = manager.addAnalysis(10, analysis);
      expect(failureResult).toBe(false);
    });

    it('should add comments to moves', () => {
      const success1 = manager.addComment(0, 'Good opening move');
      const success2 = manager.addComment(0, 'Controls center');
      
      expect(success1).toBe(true);
      expect(success2).toBe(true);

      const move = manager.getMove(0);
      expect(move?.comments).toEqual(['Good opening move', 'Controls center']);

      const failureResult = manager.addComment(10, 'Invalid');
      expect(failureResult).toBe(false);
    });

    it('should remove comments', () => {
      manager.addComment(0, 'First comment');
      manager.addComment(0, 'Second comment');

      const success = manager.removeComment(0, 0);
      expect(success).toBe(true);

      const move = manager.getMove(0);
      expect(move?.comments).toEqual(['Second comment']);

      const failureResult = manager.removeComment(0, 5);
      expect(failureResult).toBe(false);
    });

    it('should filter moves by analysis type', () => {
      manager.addAnalysis(0, { isBlunder: false, isMistake: false, isInaccuracy: false, isBrilliant: true });
      manager.addAnalysis(1, { isBlunder: true, isMistake: false, isInaccuracy: false, isBrilliant: false });

      const brilliant = manager.getBrilliantMoves();
      expect(brilliant).toHaveLength(1);
      expect(brilliant[0].move).toEqual(sampleMove1);

      const blunders = manager.getBlunders();
      expect(blunders).toHaveLength(1);
      expect(blunders[0].move).toEqual(sampleMove2);
    });

    it('should filter moves with comments', () => {
      manager.addComment(0, 'Has comment');
      manager.addComment(2, 'Also has comment');

      const movesWithComments = manager.getMovesWithComments();
      expect(movesWithComments).toHaveLength(2);
    });
  });

  // =============================================================================
  // REPLAY TESTS
  // =============================================================================

  describe('Replay Functionality', () => {
    beforeEach(() => {
      manager.addMove(sampleMove1, 'position1');
      manager.addMove(sampleMove2, 'position2');
      manager.addMove(sampleMove3, 'position3');
    });

    it('should start replay', () => {
      const success = manager.startReplay({ autoPlay: false });
      expect(success).toBe(true);

      const replayState = manager.getReplayState();
      expect(replayState.isReplaying).toBe(true);
      expect(replayState.moves).toHaveLength(3);
      expect(manager.getCurrentIndex()).toBe(-1);
    });

    it('should step through replay manually', () => {
      manager.startReplay({ autoPlay: false });

      const step1 = manager.replayNextMove();
      expect(step1?.success).toBe(true);
      expect(step1?.currentIndex).toBe(0);
      expect(step1?.move).toEqual(sampleMove1);

      const step2 = manager.replayNextMove();
      expect(step2?.success).toBe(true);
      expect(step2?.currentIndex).toBe(1);
      expect(step2?.move).toEqual(sampleMove2);
    });

    it('should stop replay', () => {
      manager.startReplay();
      manager.stopReplay();

      const replayState = manager.getReplayState();
      expect(replayState.isReplaying).toBe(false);
    });

    it('should set replay speed', () => {
      manager.setReplaySpeed(2.5);
      
      const replayState = manager.getReplayState();
      expect(replayState.playbackSpeed).toBe(2.5);

      // Test clamping
      manager.setReplaySpeed(0.01); // Too slow
      expect(manager.getReplayState().playbackSpeed).toBe(0.1);

      manager.setReplaySpeed(15); // Too fast
      expect(manager.getReplayState().playbackSpeed).toBe(10.0);
    });

    it('should handle empty history replay', () => {
      const emptyManager = new MoveHistoryManager();
      const success = emptyManager.startReplay();
      expect(success).toBe(false);
    });
  });

  // =============================================================================
  // STATISTICS TESTS
  // =============================================================================

  describe('Statistics', () => {
    beforeEach(() => {
      manager.addMove(sampleMove1, 'position1', undefined, 1000);
      manager.addMove(sampleMove2, 'position2', undefined, 2000);
      manager.addMove(sampleMove3, 'position3', undefined, 1500);
    });

    it('should calculate total time', () => {
      expect(manager.getTotalTime()).toBe(4500);
    });

    it('should calculate average time per move', () => {
      expect(manager.getAverageTimePerMove()).toBe(1500);
    });

    it('should filter moves by color', () => {
      const whiteMoves = manager.getMovesByColor('white');
      expect(whiteMoves).toHaveLength(2);
      expect(whiteMoves[0].move).toEqual(sampleMove1);
      expect(whiteMoves[1].move).toEqual(sampleMove3);

      const blackMoves = manager.getMovesByColor('black');
      expect(blackMoves).toHaveLength(1);
      expect(blackMoves[0].move).toEqual(sampleMove2);
    });
  });

  // =============================================================================
  // SERIALIZATION TESTS
  // =============================================================================

  describe('Serialization', () => {
    beforeEach(() => {
      manager.addMove(sampleMove1, 'position1');
      manager.addMove(sampleMove2, 'position2');
      manager.goToMove(0);
    });

    it('should serialize to JSON', () => {
      const json = manager.toJSON();
      expect(json).toBeDefined();
      
      const parsed = JSON.parse(json);
      expect(parsed.history).toHaveLength(2);
      expect(parsed.currentIndex).toBe(0);
    });

    it('should deserialize from JSON', () => {
      const json = manager.toJSON();
      const newManager = new MoveHistoryManager();
      
      const success = newManager.fromJSON(json);
      expect(success).toBe(true);
      
      expect(newManager.getTotalMoves()).toBe(2);
      expect(newManager.getCurrentIndex()).toBe(0);
      
      const currentMove = newManager.getCurrentMove();
      expect(currentMove?.move).toEqual(sampleMove1);
    });

    it('should handle invalid JSON', () => {
      const newManager = new MoveHistoryManager();
      const success = newManager.fromJSON('invalid json');
      expect(success).toBe(false);
    });

    it('should handle malformed data', () => {
      const newManager = new MoveHistoryManager();
      const success = newManager.fromJSON('{"history": "not an array"}');
      expect(success).toBe(false);
    });
  });

  // =============================================================================
  // UTILITY TESTS
  // =============================================================================

  describe('Utility Methods', () => {
    beforeEach(() => {
      manager.addMove(sampleMove1, 'position1');
      manager.addMove(sampleMove2, 'position2');
      manager.addMove(sampleMove3, 'position3');
    });

    it('should clear history', () => {
      expect(manager.getTotalMoves()).toBe(3);
      
      manager.clear();
      
      expect(manager.getTotalMoves()).toBe(0);
      expect(manager.getCurrentIndex()).toBe(-1);
      expect(manager.getAllMoves()).toEqual([]);
    });

    it('should return correct history length', () => {
      expect(manager.getHistoryLength()).toBe(3);
    });

    it('should handle history size limits', () => {
      const limitedManager = new MoveHistoryManager({ maxHistorySize: 2 });
      
      limitedManager.addMove(sampleMove1, 'position1');
      limitedManager.addMove(sampleMove2, 'position2');
      limitedManager.addMove(sampleMove3, 'position3');
      
      // Should only keep the last 2 moves
      expect(limitedManager.getTotalMoves()).toBe(2);
      expect(limitedManager.getMove(0)?.move).toEqual(sampleMove2);
      expect(limitedManager.getMove(1)?.move).toEqual(sampleMove3);
    });
  });
});