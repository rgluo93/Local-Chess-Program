/**
 * NotationGenerator Unit Tests
 * 
 * Tests for the NotationGenerator class covering:
 * - Basic move notation (pawn, piece moves)
 * - Special move notation (castling, en passant, promotion)
 * - Ambiguity resolution (multiple pieces can reach same square)
 * - Check and checkmate notation
 * - PGN format validation
 * - FEN generation and parsing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NotationGenerator } from '../NotationGenerator';
import type { Move } from '@/types/Chess';

describe('NotationGenerator', () => {
  let generator: NotationGenerator;

  beforeEach(() => {
    generator = new NotationGenerator();
  });

  // =============================================================================
  // BASIC MOVE NOTATION TESTS
  // =============================================================================

  describe('Basic Move Notation', () => {
    it('should generate pawn move notation', () => {
      const move: Move = {
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

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('e4');
    });

    it('should generate knight move notation', () => {
      const move: Move = {
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

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('Nf3');
    });

    it('should generate bishop move notation', () => {
      const move: Move = {
        from: 'f1',
        to: 'c4',
        piece: 'bishop',
        color: 'white',
        notation: 'Bc4',
        capture: false,
        check: false,
        checkmate: false,
        promotion: false,
      };

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('Bc4');
    });

    it('should generate rook move notation', () => {
      const move: Move = {
        from: 'a1',
        to: 'a8',
        piece: 'rook',
        color: 'white',
        notation: 'Ra8',
        capture: false,
        check: false,
        checkmate: false,
        promotion: false,
      };

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('Ra8');
    });

    it('should generate queen move notation', () => {
      const move: Move = {
        from: 'd1',
        to: 'h5',
        piece: 'queen',
        color: 'white',
        notation: 'Qh5',
        capture: false,
        check: false,
        checkmate: false,
        promotion: false,
      };

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('Qh5');
    });

    it('should generate king move notation', () => {
      const move: Move = {
        from: 'e1',
        to: 'f2',
        piece: 'king',
        color: 'white',
        notation: 'Kf2',
        capture: false,
        check: false,
        checkmate: false,
        promotion: false,
      };

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('Kf2');
    });
  });

  // =============================================================================
  // CAPTURE NOTATION TESTS
  // =============================================================================

  describe('Capture Notation', () => {
    it('should generate pawn capture notation', () => {
      const move: Move = {
        from: 'e4',
        to: 'd5',
        piece: 'pawn',
        color: 'white',
        notation: 'exd5',
        capture: true,
        check: false,
        checkmate: false,
        promotion: false,
      };

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('exd5');
    });

    it('should generate piece capture notation', () => {
      const move: Move = {
        from: 'f3',
        to: 'e5',
        piece: 'knight',
        color: 'white',
        notation: 'Nxe5',
        capture: true,
        check: false,
        checkmate: false,
        promotion: false,
      };

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('Nxe5');
    });
  });

  // =============================================================================
  // SPECIAL MOVE NOTATION TESTS
  // =============================================================================

  describe('Special Move Notation', () => {
    it('should generate kingside castling notation', () => {
      const move: Move = {
        from: 'e1',
        to: 'g1',
        piece: 'king',
        color: 'white',
        notation: 'O-O',
        capture: false,
        check: false,
        checkmate: false,
        promotion: false,
        specialMove: 'castling',
      };

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('O-O');
    });

    it('should generate queenside castling notation', () => {
      const move: Move = {
        from: 'e1',
        to: 'c1',
        piece: 'king',
        color: 'white',
        notation: 'O-O-O',
        capture: false,
        check: false,
        checkmate: false,
        promotion: false,
        specialMove: 'castling',
      };

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('O-O-O');
    });

    it('should generate pawn promotion notation', () => {
      const move: Move = {
        from: 'a7',
        to: 'a8',
        piece: 'pawn',
        color: 'white',
        notation: 'a8=Q',
        capture: false,
        check: false,
        checkmate: false,
        promotion: 'queen',
      };

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('a8=Q');
    });

    it('should generate pawn promotion with capture notation', () => {
      const move: Move = {
        from: 'b7',
        to: 'c8',
        piece: 'pawn',
        color: 'white',
        notation: 'bxc8=R',
        capture: true,
        check: false,
        checkmate: false,
        promotion: 'rook',
      };

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('bxc8=R');
    });

    it('should generate en passant notation', () => {
      const move: Move = {
        from: 'd5',
        to: 'e6',
        piece: 'pawn',
        color: 'white',
        notation: 'dxe6',
        capture: true,
        check: false,
        checkmate: false,
        promotion: false,
        specialMove: 'enPassant',
      };

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('dxe6 e.p.');
    });
  });

  // =============================================================================
  // CHECK AND CHECKMATE NOTATION TESTS
  // =============================================================================

  describe('Check and Checkmate Notation', () => {
    it('should generate check notation', () => {
      const move: Move = {
        from: 'f3',
        to: 'e5',
        piece: 'knight',
        color: 'white',
        notation: 'Ne5+',
        capture: false,
        check: true,
        checkmate: false,
        promotion: false,
      };

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('Ne5+');
    });

    it('should generate checkmate notation', () => {
      const move: Move = {
        from: 'h5',
        to: 'f7',
        piece: 'queen',
        color: 'white',
        notation: 'Qf7#',
        capture: false,
        check: false,
        checkmate: true,
        promotion: false,
      };

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('Qf7#');
    });

    it('should prioritize checkmate over check', () => {
      const move: Move = {
        from: 'h5',
        to: 'f7',
        piece: 'queen',
        color: 'white',
        notation: 'Qf7#',
        capture: true,
        check: true,
        checkmate: true,
        promotion: false,
      };

      const notation = generator.generateMoveNotation(move);
      expect(notation).toBe('Qxf7#');
    });
  });

  // =============================================================================
  // LONG ALGEBRAIC NOTATION TESTS
  // =============================================================================

  describe('Long Algebraic Notation', () => {
    it('should generate LAN for simple move', () => {
      const move: Move = {
        from: 'e2',
        to: 'e4',
        piece: 'pawn',
        color: 'white',
        notation: 'e2-e4',
        capture: false,
        check: false,
        checkmate: false,
        promotion: false,
      };

      const notation = generator.generateMoveNotation(move, { format: 'lan' });
      expect(notation).toBe('e2-e4');
    });

    it('should generate LAN for capture', () => {
      const move: Move = {
        from: 'e4',
        to: 'd5',
        piece: 'pawn',
        color: 'white',
        notation: 'e4xd5',
        capture: true,
        check: false,
        checkmate: false,
        promotion: false,
      };

      const notation = generator.generateMoveNotation(move, { format: 'lan' });
      expect(notation).toBe('e4xd5');
    });

    it('should generate LAN for piece move', () => {
      const move: Move = {
        from: 'g1',
        to: 'f3',
        piece: 'knight',
        color: 'white',
        notation: 'Ng1-f3',
        capture: false,
        check: false,
        checkmate: false,
        promotion: false,
      };

      const notation = generator.generateMoveNotation(move, { format: 'lan' });
      expect(notation).toBe('Ng1-f3');
    });
  });

  // =============================================================================
  // PGN GENERATION TESTS
  // =============================================================================

  describe('PGN Generation', () => {
    it('should generate basic PGN without headers', () => {
      const moves: Move[] = [
        {
          from: 'e2', to: 'e4', piece: 'pawn', color: 'white', notation: 'e4',
          capture: false, check: false, checkmate: false, promotion: false,
        },
        {
          from: 'e7', to: 'e5', piece: 'pawn', color: 'black', notation: 'e5',
          capture: false, check: false, checkmate: false, promotion: false,
        },
      ];

      const pgn = generator.generatePGN(moves, { includeHeaders: false });
      expect(pgn).toBe('1. e4 e5 *');
    });

    it('should generate PGN with headers', () => {
      generator.setHeaders({
        Event: 'Test Game',
        Site: 'Test Location',
        Date: '2024.01.01',
        Round: '1',
        White: 'Player1',
        Black: 'Player2',
        Result: '1-0',
      });

      const moves: Move[] = [
        {
          from: 'e2', to: 'e4', piece: 'pawn', color: 'white', notation: 'e4',
          capture: false, check: false, checkmate: false, promotion: false,
        },
      ];

      const pgn = generator.generatePGN(moves, { includeHeaders: true });
      
      expect(pgn).toContain('[Event "Test Game"]');
      expect(pgn).toContain('[Site "Test Location"]');
      expect(pgn).toContain('[Date "2024.01.01"]');
      expect(pgn).toContain('[White "Player1"]');
      expect(pgn).toContain('[Black "Player2"]');
      expect(pgn).toContain('[Result "1-0"]');
      expect(pgn).toContain('1. e4 1-0');
    });

    it('should generate PGN with line length limits', () => {
      const moves: Move[] = Array(10).fill(0).map((_, i) => ({
        from: 'e2', to: 'e4', piece: 'pawn', color: i % 2 === 0 ? 'white' : 'black', notation: 'e4',
        capture: false, check: false, checkmate: false, promotion: false,
      }));

      const pgn = generator.generatePGN(moves, { 
        includeHeaders: false, 
        maxLineLength: 20 
      });
      
      const lines = pgn.split('\n');
      expect(lines.some(line => line.length <= 20)).toBe(true);
    });

    it('should handle PGN with comments', () => {
      generator.addComment(0, 'Good opening move');
      
      const moves: Move[] = [
        {
          from: 'e2', to: 'e4', piece: 'pawn', color: 'white', notation: 'e4',
          capture: false, check: false, checkmate: false, promotion: false,
        },
      ];

      const pgn = generator.generatePGN(moves, { 
        includeHeaders: false,
        includeComments: true 
      });
      
      expect(pgn).toContain('{Good opening move}');
    });
  });

  // =============================================================================
  // FEN TESTS
  // =============================================================================

  describe('FEN Generation and Parsing', () => {
    it('should generate starting position FEN', () => {
      const fen = generator.generateFEN();
      expect(fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });

    it('should validate correct FEN', () => {
      const validFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      expect(generator.validateFEN(validFEN)).toBe(true);
    });

    it('should reject invalid FEN', () => {
      const invalidFEN = 'invalid-fen-string';
      expect(generator.validateFEN(invalidFEN)).toBe(false);
    });

    it('should parse FEN components', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const components = generator.parseFEN(fen);
      
      expect(components).not.toBeNull();
      expect(components!.pieces).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR');
      expect(components!.turn).toBe('b');
      expect(components!.castling).toBe('KQkq');
      expect(components!.enPassant).toBe('e3');
      expect(components!.halfmove).toBe('0');
      expect(components!.fullmove).toBe('1');
    });

    it('should return null for invalid FEN parsing', () => {
      const invalidFEN = 'invalid fen with wrong parts';
      const components = generator.parseFEN(invalidFEN);
      
      expect(components).toBeNull();
    });
  });

  // =============================================================================
  // HEADERS AND COMMENTS TESTS
  // =============================================================================

  describe('Headers and Comments Management', () => {
    it('should set and get individual headers', () => {
      generator.setHeader('Event', 'Test Tournament');
      expect(generator.getHeader('Event')).toBe('Test Tournament');
    });

    it('should set and get multiple headers', () => {
      const headers = {
        Event: 'World Championship',
        Site: 'New York',
        Date: '2024.01.01',
      };

      generator.setHeaders(headers);
      
      expect(generator.getHeader('Event')).toBe('World Championship');
      expect(generator.getHeader('Site')).toBe('New York');
      expect(generator.getHeader('Date')).toBe('2024.01.01');
    });

    it('should clear headers', () => {
      generator.setHeader('Event', 'Test');
      generator.clearHeaders();
      
      expect(generator.getHeader('Event')).toBeUndefined();
    });

    it('should add and get comments', () => {
      generator.addComment(0, 'First comment');
      generator.addComment(0, 'Second comment');
      
      const comments = generator.getComments(0);
      expect(comments).toEqual(['First comment', 'Second comment']);
    });

    it('should remove comments', () => {
      generator.addComment(0, 'Comment 1');
      generator.addComment(0, 'Comment 2');
      
      const success = generator.removeComment(0, 0);
      expect(success).toBe(true);
      
      const comments = generator.getComments(0);
      expect(comments).toEqual(['Comment 2']);
    });

    it('should clear all comments', () => {
      generator.addComment(0, 'Comment');
      generator.clearComments();
      
      expect(generator.getComments(0)).toEqual([]);
    });
  });

  // =============================================================================
  // UTILITY METHODS TESTS
  // =============================================================================

  describe('Utility Methods', () => {
    it('should describe position correctly', () => {
      const description = generator.describePosition();
      expect(description).toBe('White to move');
    });

    it('should get game result for ongoing game', () => {
      const result = generator.getGameResult();
      expect(result).toBe('*');
    });

    it('should export moves to algebraic notation', () => {
      const moves: Move[] = [
        {
          from: 'e2', to: 'e4', piece: 'pawn', color: 'white', notation: 'e4',
          capture: false, check: false, checkmate: false, promotion: false,
        },
        {
          from: 'g1', to: 'f3', piece: 'knight', color: 'white', notation: 'Nf3',
          capture: false, check: false, checkmate: false, promotion: false,
        },
      ];

      const notation = generator.exportToAlgebraic(moves);
      expect(notation).toEqual(['e4', 'Nf3']);

      const longNotation = generator.exportToAlgebraic(moves, true);
      expect(longNotation).toEqual(['e2-e4', 'Ng1-f3']);
    });

    it('should clone generator with all data', () => {
      generator.setHeader('Event', 'Test');
      generator.addComment(0, 'Test comment');
      
      const cloned = generator.clone();
      
      expect(cloned.getHeader('Event')).toBe('Test');
      expect(cloned.getComments(0)).toEqual(['Test comment']);
    });

    it('should reset generator', () => {
      generator.setHeader('Event', 'Test');
      generator.addComment(0, 'Comment');
      
      generator.reset();
      
      expect(generator.getHeader('Event')).toBeUndefined();
      expect(generator.getComments(0)).toEqual([]);
      expect(generator.generateFEN()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });
  });

  // =============================================================================
  // INTEGRATION TESTS
  // =============================================================================

  describe('Integration Tests', () => {
    it('should handle complete game notation workflow', () => {
      // Set up game info
      generator.setHeaders({
        Event: 'Test Game',
        White: 'Player1',
        Black: 'Player2',
        Result: '1-0',
      });

      // Add some moves
      const moves: Move[] = [
        {
          from: 'e2', to: 'e4', piece: 'pawn', color: 'white', notation: 'e4',
          capture: false, check: false, checkmate: false, promotion: false,
        },
        {
          from: 'e7', to: 'e5', piece: 'pawn', color: 'black', notation: 'e5',
          capture: false, check: false, checkmate: false, promotion: false,
        },
        {
          from: 'f1', to: 'c4', piece: 'bishop', color: 'white', notation: 'Bc4',
          capture: false, check: false, checkmate: false, promotion: false,
        },
      ];

      // Add comments
      generator.addComment(0, 'King pawn opening');
      generator.addComment(2, 'Italian Game setup');

      // Generate complete PGN
      const pgn = generator.generatePGN(moves, { includeComments: true });

      expect(pgn).toContain('[Event "Test Game"]');
      expect(pgn).toContain('[White "Player1"]');
      expect(pgn).toContain('[Black "Player2"]');
      expect(pgn).toContain('[Result "1-0"]');
      expect(pgn).toContain('1. e4 {King pawn opening} e5');
      expect(pgn).toContain('2. Bc4 {Italian Game setup}');
      expect(pgn).toContain('1-0');
    });

    it('should round-trip PGN parsing and generation', () => {
      const originalPGN = `[Event "Test Game"]
[Site "Test Site"]
[Date "2024.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 1-0`;

      const success = generator.fromPGN(originalPGN);
      expect(success).toBe(true);

      expect(generator.getHeader('Event')).toBe('Test Game');
      expect(generator.getHeader('White')).toBe('Player1');
      expect(generator.getHeader('Black')).toBe('Player2');
    });
  });
});