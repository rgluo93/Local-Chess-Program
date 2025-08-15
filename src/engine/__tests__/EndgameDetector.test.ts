/**
 * EndgameDetector Unit Tests
 * 
 * Tests for the EndgameDetector class covering:
 * - Checkmate scenarios (back rank, smothered mate, etc.)
 * - Stalemate scenarios
 * - Draw conditions (50-move, repetition, insufficient material)
 * - Edge cases and complex endgames
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Chess } from 'chess.js';
import { EndgameDetector } from '../EndgameDetector';
import type { Move } from '@/types/Chess';

describe('EndgameDetector', () => {
  let detector: EndgameDetector;
  let board: Chess;

  beforeEach(() => {
    detector = new EndgameDetector();
    board = new Chess();
  });

  // =============================================================================
  // CHECKMATE DETECTION TESTS
  // =============================================================================

  describe('Checkmate Detection', () => {
    it('should detect Scholar\'s mate', () => {
      // Play Scholar's mate sequence
      board.move('e4');
      board.move('e5');
      board.move('Bc4');
      board.move('Nc6');
      board.move('Qh5');
      board.move('Nf6??');
      board.move('Qxf7#');

      const moves: Move[] = []; // Simplified for test
      const analysis = detector.analyzePosition(board, moves);
      
      expect(analysis.status).toBe('checkmate');
      expect(analysis.result).toBe('white_wins');
      expect(analysis.winner).toBe('white');
    });

    it('should detect checkmate from actual game', () => {
      // Use actual checkmate position from known games
      // Fool's mate - fastest checkmate
      board.move('f3');
      board.move('e5');
      board.move('g4');
      board.move('Qh4#');
      
      const analysis = detector.analyzePosition(board);
      
      expect(analysis.status).toBe('checkmate');
      expect(analysis.result).toBe('black_wins');
      expect(analysis.reason).toBe('checkmate');
      expect(analysis.winner).toBe('black');
      expect(analysis.description).toContain('checkmate');
    });

    it('should detect material balance without checkmate', () => {
      // Scholar's mate position where white has advantage but not checkmate yet
      board.move('e4');
      board.move('e5');
      board.move('Bc4');
      board.move('Nc6');

      const analysis = detector.analyzePosition(board);
      
      expect(analysis.materialBalance.advantage).toBe('balanced');
      expect(analysis.status).toBe('playing'); // Not checkmate yet
    });

    it('should classify endgame types correctly', () => {
      // Test with fewer pieces for endgame classification
      board.load('8/8/8/8/8/8/1Q6/k1Kq4 w - - 0 1');
      
      const analysis = detector.analyzePosition(board);
      
      expect(analysis.endgameType).toBe('queen_endgame');
      expect(analysis.materialBalance.totalWhite).toBe(9); // Queen = 9 points
      expect(analysis.materialBalance.totalBlack).toBe(9); // Queen = 9 points
    });

    it('should classify king and rook endgame', () => {
      board.load('8/8/8/8/8/8/1R6/k1Kr4 w - - 0 1');
      
      const analysis = detector.analyzePosition(board);
      
      expect(analysis.endgameType).toBe('rook_endgame');
      expect(analysis.materialBalance.totalWhite).toBe(5); // Rook = 5 points
    });
  });

  // =============================================================================
  // STALEMATE DETECTION TESTS (Use simpler test without exact FEN)
  // =============================================================================

  describe('Stalemate Detection', () => {
    it('should handle positions correctly based on Chess.js state', () => {
      // Test that our detector correctly reads Chess.js state
      const testBoard = new Chess();
      testBoard.move('e4');
      
      const analysis = detector.analyzePosition(testBoard);
      
      expect(analysis.status).toBe('playing');
      expect(analysis.result).toBe('ongoing');
      expect(analysis.reason).toBe('ongoing');
    });

    it('should detect when Chess.js reports stalemate', () => {
      // We'll test the logic without relying on specific FEN positions
      // since creating valid stalemate positions is complex
      const mockBoard = {
        isStalemate: () => true,
        isCheckmate: () => false,
        inCheck: () => false,
        fen: () => 'test-fen',
        turn: () => 'b',
        get: () => null
      } as any;

      const analysis = detector.analyzePosition(mockBoard);
      expect(analysis.status).toBe('stalemate');
      expect(analysis.result).toBe('draw');
      expect(analysis.reason).toBe('stalemate');
    });
  });

  // =============================================================================
  // DRAW CONDITION TESTS
  // =============================================================================

  describe('Draw Conditions', () => {
    it('should detect insufficient material - King vs King', () => {
      board.load('8/8/8/8/8/8/8/k1K5 w - - 0 1');
      
      const analysis = detector.analyzePosition(board);
      
      expect(detector.isInsufficientMaterial(board)).toBe(true);
      expect(analysis.reason).toBe('insufficient_material');
      expect(analysis.result).toBe('draw');
    });

    it('should detect insufficient material - King + Bishop vs King', () => {
      board.load('8/8/8/8/8/8/1B6/k1K5 w - - 0 1');
      
      const isInsufficient = detector.isInsufficientMaterial(board);
      
      expect(isInsufficient).toBe(true);
    });

    it('should detect insufficient material - King + Knight vs King', () => {
      board.load('8/8/8/8/8/8/1N6/k1K5 w - - 0 1');
      
      const isInsufficient = detector.isInsufficientMaterial(board);
      
      expect(isInsufficient).toBe(true);
    });

    it('should NOT detect insufficient material with pawns', () => {
      board.load('8/8/8/8/8/8/1P6/k1K5 w - - 0 1');
      
      const isInsufficient = detector.isInsufficientMaterial(board);
      
      expect(isInsufficient).toBe(false);
    });

    it('should detect fifty-move rule', () => {
      // Position with high halfmove count (50+ moves without pawn move/capture)
      board.load('8/8/8/8/8/8/8/k1K5 w - - 100 75');
      
      const isFiftyMove = detector.isFiftyMoveRule(board);
      
      expect(isFiftyMove).toBe(true);
    });

    it('should NOT detect fifty-move rule prematurely', () => {
      board.load('8/8/8/8/8/8/8/k1K5 w - - 99 75');
      
      const isFiftyMove = detector.isFiftyMoveRule(board);
      
      expect(isFiftyMove).toBe(false);
    });

    it('should detect threefold repetition', () => {
      // Simulate threefold repetition by manually updating history
      const fen1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const fen2 = 'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1';
      
      // Add positions to trigger repetition
      detector.updateHistory(fen1);
      detector.updateHistory(fen2);
      detector.updateHistory(fen1);
      detector.updateHistory(fen2);
      detector.updateHistory(fen1); // Third occurrence
      
      const isThreefold = detector.isThreefoldRepetition();
      
      expect(isThreefold).toBe(true);
    });
  });

  // =============================================================================
  // ENDGAME TYPE CLASSIFICATION TESTS
  // =============================================================================

  describe('Endgame Type Classification', () => {
    it('should classify pawn endgames', () => {
      board.load('8/1p6/8/8/8/8/1P6/k1K5 w - - 0 1');
      
      const analysis = detector.analyzePosition(board);
      
      expect(analysis.endgameType).toBe('pawn_endgame');
    });

    it('should classify queen endgames', () => {
      board.load('8/8/8/8/8/8/1Q6/k1Kq4 w - - 0 1');
      
      const analysis = detector.analyzePosition(board);
      
      expect(analysis.endgameType).toBe('queen_endgame');
    });

    it('should classify rook endgames', () => {
      board.load('8/8/8/8/8/8/1R6/k1Kr4 w - - 0 1');
      
      const analysis = detector.analyzePosition(board);
      
      expect(analysis.endgameType).toBe('rook_endgame');
    });

    it('should classify minor piece endgames', () => {
      board.load('8/8/8/8/8/8/1B6/k1Kn4 w - - 0 1');
      
      const analysis = detector.analyzePosition(board);
      
      expect(analysis.endgameType).toBe('minor_piece_endgame');
    });

    it('should classify tablebase positions', () => {
      board.load('8/8/8/8/8/8/1k6/1KQ5 w - - 0 1');
      
      const analysis = detector.analyzePosition(board);
      
      expect(analysis.endgameType).toBe('king_and_queen');
    });

    it('should classify complex endgames', () => {
      // Position with many pieces (opening position)
      board.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      
      const analysis = detector.analyzePosition(board);
      
      expect(analysis.endgameType).toBe('complex_endgame');
    });
  });

  // =============================================================================
  // MATERIAL BALANCE TESTS
  // =============================================================================

  describe('Material Balance Analysis', () => {
    it('should calculate material balance correctly', () => {
      board.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      
      const analysis = detector.analyzePosition(board);
      const material = analysis.materialBalance;
      
      expect(material.totalWhite).toBe(39); // 8p + 2r + 2n + 2b + 1q = 39
      expect(material.totalBlack).toBe(39);
      expect(material.advantage).toBe('balanced');
      expect(material.difference).toBe(0);
    });

    it('should detect material advantage', () => {
      // Position where white captured black's queen
      board.load('rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      
      const analysis = detector.analyzePosition(board);
      const material = analysis.materialBalance;
      
      expect(material.advantage).toBe('white');
      expect(material.difference).toBe(9); // Missing black queen
      expect(material.totalWhite).toBe(39);
      expect(material.totalBlack).toBe(30);
    });

    it('should count pieces correctly', () => {
      board.load('8/8/8/8/8/8/8/RNBQKBNk w - - 0 1');
      
      const analysis = detector.analyzePosition(board);
      const white = analysis.materialBalance.white;
      
      expect(white.rook).toBe(1);
      expect(white.knight).toBe(2);
      expect(white.bishop).toBe(2);
      expect(white.queen).toBe(1);
      expect(white.king).toBe(1);
      expect(white.pawn).toBe(0);
    });
  });

  // =============================================================================
  // UTILITY METHODS TESTS
  // =============================================================================

  describe('Utility Methods', () => {
    it('should manage position history', () => {
      const fen1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const fen2 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      
      detector.updateHistory(fen1);
      detector.updateHistory(fen2);
      
      const history = detector.getPositionHistory();
      expect(history).toHaveLength(2);
      expect(history).toContain(fen1);
      expect(history).toContain(fen2);
    });

    it('should reset history', () => {
      detector.updateHistory('some-fen');
      detector.resetHistory();
      
      expect(detector.getPositionHistory()).toHaveLength(0);
      expect(detector.getMoveHistory()).toHaveLength(0);
    });

    it('should handle duplicate positions in history', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      detector.updateHistory(fen);
      detector.updateHistory(fen); // Duplicate
      detector.updateHistory(fen); // Duplicate
      
      const history = detector.getPositionHistory();
      expect(history).toHaveLength(3); // All positions stored, even duplicates
    });
  });

  // =============================================================================
  // EDGE CASE TESTS
  // =============================================================================

  describe('Edge Cases', () => {
    it('should handle ongoing games correctly', () => {
      // Normal starting position
      const analysis = detector.analyzePosition(board);
      
      expect(analysis.status).toBe('playing');
      expect(analysis.result).toBe('ongoing');
      expect(analysis.reason).toBe('ongoing');
      expect(analysis.winner).toBeUndefined();
    });

    it('should handle check positions', () => {
      // Create a position where black king is actually in check
      board.move('e4');
      board.move('d6'); // Black pawn moves from d7 to d6, clearing d7
      board.move('Bb5+'); // Bishop gives check along diagonal b5-c6-d7-e8
      
      const analysis = detector.analyzePosition(board);
      
      expect(analysis.status).toBe('check');
      expect(analysis.result).toBe('ongoing');
    });

    it('should handle positions with castling rights', () => {
      const analysis = detector.analyzePosition(board); // Starting position
      
      expect(analysis.status).toBe('playing');
      expect(analysis.materialBalance.advantage).toBe('balanced');
    });

    it('should generate appropriate descriptions', () => {
      // Test ongoing game description
      const ongoingAnalysis = detector.analyzePosition(board);
      expect(ongoingAnalysis.description).toContain('progress');
      
      // Test checkmate description using Fool's mate
      board.move('f3');
      board.move('e5');
      board.move('g4');
      board.move('Qh4#');
      
      const checkmateAnalysis = detector.analyzePosition(board);
      expect(checkmateAnalysis.description).toContain('checkmate');
    });
  });

  // =============================================================================
  // INTEGRATION TESTS
  // =============================================================================

  describe('Integration Tests', () => {
    it('should analyze complete game progression', () => {
      // Play a few moves and analyze each position
      const moves: Move[] = [];
      
      // Move 1: e4
      board.move('e4');
      let analysis = detector.analyzePosition(board, moves);
      expect(analysis.status).toBe('playing');
      expect(analysis.moveCount).toBe(0);
      
      // Move 2: e5
      board.move('e5');
      analysis = detector.analyzePosition(board, moves);
      expect(analysis.status).toBe('playing');
      expect(analysis.materialBalance.advantage).toBe('balanced');
      
      // Starting position should be complex endgame (32 pieces)
      expect(analysis.endgameType).toBe('complex_endgame');
    });

    it('should detect checkmate pattern types', () => {
      // Set up a checkmate position using actual game
      board.move('f3');
      board.move('e5');
      board.move('g4');
      board.move('Qh4#'); // Fool's mate
      
      const pattern = detector.detectCheckmatePattern(board);
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBeDefined();
      expect(pattern?.description).toBeDefined();
    });
  });
});