/**
 * GameEngine Tests
 * 
 * Unit tests for the GameEngine class to validate chess logic
 * and integration with Chess.js library.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../GameEngine';
import { STARTING_FEN } from '@/types/Chess';

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  describe('Initialization', () => {
    it('should initialize with standard starting position', () => {
      expect(engine.getFEN()).toBe(STARTING_FEN);
    });

    it('should initialize with custom FEN if provided', () => {
      const customFEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
      const customEngine = new GameEngine(customFEN);
      expect(customEngine.getFEN()).toBe(customFEN);
    });

    it('should have white to move initially', () => {
      expect(engine.getCurrentPlayer()).toBe('white');
    });
  });

  describe('Basic Move Making', () => {
    it('should make valid pawn double move e2-e4', () => {
      const result = engine.makeMove('e2', 'e4');
      
      expect(result.isValid).toBe(true);
      expect(result.move?.from).toBe('e2');
      expect(result.move?.to).toBe('e4');
      expect(result.move?.piece).toBe('pawn');
      expect(result.move?.color).toBe('white');
      expect(result.move?.notation).toBe('e4');
      expect(result.gameStatus).toBe('playing');
    });

    it('should reject invalid knight move g1-g3', () => {
      const result = engine.makeMove('g1', 'g3');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should allow valid knight move g1-f3', () => {
      const result = engine.makeMove('g1', 'f3');
      
      expect(result.isValid).toBe(true);
      expect(result.move?.piece).toBe('knight');
      expect(result.move?.notation).toBe('Nf3');
    });

    it('should prevent moves when not player turn', () => {
      // Make white move first
      engine.makeMove('e2', 'e4');
      
      // Try to make another white move
      const result = engine.makeMove('d2', 'd4');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('wrongTurn');
    });
  });

  describe('Move Validation', () => {
    it('should get valid moves for a piece', () => {
      const validMoves = engine.getValidMoves('e2');
      
      expect(validMoves).toContain('e3');
      expect(validMoves).toContain('e4');
      expect(validMoves.length).toBe(2);
    });

    it('should validate moves without making them', () => {
      const validation = engine.validateMove('e2', 'e4');
      
      expect(validation.isValid).toBe(true);
      expect(engine.getFEN()).toBe(STARTING_FEN); // Position unchanged
    });

    it('should detect invalid moves', () => {
      const validation = engine.validateMove('e2', 'e5');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errorType).toBeDefined();
    });
  });

  describe('Game State', () => {
    it('should track move history', () => {
      engine.makeMove('e2', 'e4');
      engine.makeMove('e7', 'e5');
      
      const history = engine.getMoveHistory();
      expect(history.length).toBe(2);
      expect(history[0].notation).toBe('e4');
      expect(history[1].notation).toBe('e5');
    });

    it('should generate PGN', () => {
      engine.makeMove('e2', 'e4');
      engine.makeMove('e7', 'e5');
      
      const pgn = engine.getPGN();
      expect(pgn).toContain('1. e4 e5');
    });

    it('should detect check conditions', () => {
      // Scholar's mate threatening position
      engine.makeMove('e2', 'e4');
      engine.makeMove('e7', 'e5');
      engine.makeMove('f1', 'c4');
      engine.makeMove('b8', 'c6');
      engine.makeMove('d1', 'h5');
      engine.makeMove('g8', 'f6');
      engine.makeMove('h5', 'f7'); // Check!
      
      expect(engine.isInCheck('black')).toBe(true);
      expect(engine.getGameStatus()).toBe('checkmate');
    });

    it('should get board state', () => {
      const board = engine.getBoard();
      
      expect(board.toMove).toBe('white');
      expect(board.squares[7][0]?.type).toBe('rook'); // White rook on a1 (rank 7, file 0)
      expect(board.squares[7][0]?.color).toBe('white');
      expect(board.squares[0][7]?.type).toBe('rook'); // Black rook on h8 (rank 0, file 7)
      expect(board.squares[0][7]?.color).toBe('black');
    });
  });

  describe('Game Control', () => {
    it('should undo moves', () => {
      engine.makeMove('e2', 'e4');
      expect(engine.getMoveHistory().length).toBe(1);
      
      const undoSuccess = engine.undo();
      expect(undoSuccess).toBe(true);
      expect(engine.getMoveHistory().length).toBe(0);
      expect(engine.getFEN()).toBe(STARTING_FEN);
    });

    it('should reset to starting position', () => {
      engine.makeMove('e2', 'e4');
      engine.makeMove('e7', 'e5');
      
      engine.reset();
      
      expect(engine.getFEN()).toBe(STARTING_FEN);
      expect(engine.getMoveHistory().length).toBe(0);
      expect(engine.getCurrentPlayer()).toBe('white');
    });

    it('should load FEN positions', () => {
      const customFEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
      const success = engine.loadFEN(customFEN);
      
      expect(success).toBe(true);
      expect(engine.getFEN()).toBe(customFEN);
      expect(engine.getCurrentPlayer()).toBe('black');
    });
  });
});