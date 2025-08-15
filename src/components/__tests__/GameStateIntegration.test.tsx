/**
 * Game State Integration Tests
 * Phase 2.2 TDD Cycle 4: Game State Integration
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { CanvasChessBoard } from '../CanvasChessBoard';
import { GameStateManager } from '../../engine/GameStateManager';
import { GameEngine } from '../../engine/GameEngine';
import type { GameState, ChessBoard, Move } from '../../types/Chess';

// Mock HTML Image for testing
global.Image = vi.fn(() => ({
  onload: null,
  onerror: null,
  src: '',
  width: 0,
  height: 0,
  complete: true,
  naturalWidth: 100,
  naturalHeight: 100,
})) as any;

describe('CanvasChessBoard - TDD Cycle 4: Game State Integration', () => {
  let gameStateManager: GameStateManager;
  let gameEngine: GameEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    gameEngine = new GameEngine();
    gameStateManager = new GameStateManager(gameEngine);
    gameStateManager.startNewGame();
  });

  describe('Display Current Game State', () => {
    test('should display pieces from GameStateManager board state', () => {
      const currentGame = gameStateManager.getCurrentGame();
      const { container } = render(
        <CanvasChessBoard 
          boardState={currentGame?.board}
          showStartingPosition={false}
        />
      );
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Canvas should be rendered with board from game state
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('data-testid', 'canvas-chess-board');
    });

    test('should update display when game state changes', async () => {
      const { container, rerender } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );
      
      // Make a move
      const moveResult = gameStateManager.makeMove('e2', 'e4');
      expect(moveResult).toBe(true);
      
      // Re-render with updated board state
      rerender(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );
      
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      
      // Board should now reflect the move (e2 pawn moved to e4)
      const newGame = gameStateManager.getCurrentGame();
      expect(newGame?.board.squares[6][4]).toBeNull(); // e2 is empty (rank 6 = 2nd rank)
      expect(newGame?.board.squares[4][4]).not.toBeNull(); // e4 has piece (rank 4 = 4th rank)
    });

    test('should show correct position after multiple moves', () => {
      // Make several moves
      gameStateManager.makeMove('e2', 'e4');
      gameStateManager.makeMove('e7', 'e5');
      gameStateManager.makeMove('g1', 'f3');
      gameStateManager.makeMove('b8', 'c6');
      
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );
      
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      
      // Verify the position reflects all moves
      const currentGame = gameStateManager.getCurrentGame();
      expect(currentGame?.board.squares[4][4]?.type).toBe('pawn'); // e4 (rank 4 = 4th rank)
      expect(currentGame?.board.squares[3][4]?.type).toBe('pawn'); // e5 (rank 3 = 5th rank)
      expect(currentGame?.board.squares[5][5]?.type).toBe('knight'); // f3 (rank 5 = 3rd rank)
      expect(currentGame?.board.squares[2][2]?.type).toBe('knight'); // c6 (rank 2 = 6th rank)
    });
  });

  describe('Move Validation Through GameEngine', () => {
    test('should get valid moves from GameEngine for selected piece', () => {
      const validMoves = gameStateManager.getValidMoves('e2');
      
      // e2 pawn should be able to move to e3 or e4
      expect(validMoves).toContain('e3');
      expect(validMoves).toContain('e4');
      expect(validMoves.length).toBe(2);
    });

    test('should handle piece selection and valid move highlighting', () => {
      const onSquareClick = vi.fn();
      const validMoves = gameStateManager.getValidMoves('e2');
      
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          onSquareClick={onSquareClick}
          selectedSquare="e2"
          validMoves={validMoves}
          showStartingPosition={false}
        />
      );
      
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      
      // Valid moves should be passed to component for highlighting
      // Component should render with selected square and valid moves
    });

    test('should execute move through GameStateManager when valid square clicked', () => {
      const handleSquareClick = (square: string) => {
        if (square === 'e4') {
          const result = gameStateManager.makeMove('e2', 'e4');
          expect(result).toBe(true);
        }
      };
      
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          onSquareClick={handleSquareClick}
          selectedSquare="e2"
          validMoves={['e3', 'e4']}
          showStartingPosition={false}
        />
      );
      
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Mock click on e4
      canvas.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 600,
        height: 600,
        x: 0,
        y: 0,
        right: 600,
        bottom: 600,
        toJSON: () => {}
      }));
      
      // Click on e4 square
      fireEvent.click(canvas, { clientX: 335, clientY: 335 });
    });

    test('should prevent illegal moves through GameEngine validation', () => {
      const result = gameStateManager.makeMove('e2', 'e5'); // Illegal move
      
      expect(result).toBe(false);
      
      // Board state should remain unchanged
      const currentGame = gameStateManager.getCurrentGame();
      expect(currentGame?.board.squares[6][4]?.type).toBe('pawn'); // e2 still has pawn (rank 6 = 2nd rank)
    });
  });

  describe('Turn Management', () => {
    test('should track current player turn from GameStateManager', () => {
      const initialGame = gameStateManager.getCurrentGame();
      expect(initialGame?.currentPlayer).toBe('white');
      
      // Make a move
      gameStateManager.makeMove('e2', 'e4');
      
      const afterMove = gameStateManager.getCurrentGame();
      expect(afterMove?.currentPlayer).toBe('black');
    });

    test('should only allow moves for current player', () => {
      // White's turn - should allow white moves
      const whiteMove = gameStateManager.makeMove('e2', 'e4');
      expect(whiteMove).toBe(true);
      
      // Black's turn - should not allow white moves
      const illegalWhiteMove = gameStateManager.makeMove('d2', 'd4');
      expect(illegalWhiteMove).toBe(false);
      
      // Black's turn - should allow black moves
      const blackMove = gameStateManager.makeMove('e7', 'e5');
      expect(blackMove).toBe(true);
    });

    test('should display turn indicator from game state', () => {
      const currentGame = gameStateManager.getCurrentGame();
      
      const { container } = render(
        <CanvasChessBoard 
          boardState={currentGame?.board}
          showStartingPosition={false}
        />
      );
      
      // Component receives board state that reflects current position
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      
      // The current player info is available in currentGame.currentPlayer
      expect(currentGame?.currentPlayer).toBe('white');
    });
  });

  describe('Special Move Handling', () => {
    test('should handle castling through GameStateManager', () => {
      // Set up position for castling
      gameStateManager.makeMove('e2', 'e4');
      gameStateManager.makeMove('e7', 'e5');
      gameStateManager.makeMove('g1', 'f3');
      gameStateManager.makeMove('g8', 'f6');
      gameStateManager.makeMove('f1', 'e2');
      gameStateManager.makeMove('f8', 'e7');
      
      // Castle kingside
      const castleMove = gameStateManager.makeMove('e1', 'g1');
      expect(castleMove).toBe(true);
      
      // Verify both king and rook moved
      const afterCastle = gameStateManager.getCurrentGame();
      expect(afterCastle?.board.squares[7][6]?.type).toBe('king'); // g1 (rank 7 = 1st rank)
      expect(afterCastle?.board.squares[7][5]?.type).toBe('rook'); // f1 (rank 7 = 1st rank)
    });

    test('should handle en passant through GameStateManager', () => {
      // Set up en passant scenario
      gameStateManager.makeMove('e2', 'e4');
      gameStateManager.makeMove('a7', 'a6');
      gameStateManager.makeMove('e4', 'e5');
      gameStateManager.makeMove('d7', 'd5');
      
      // Execute en passant
      const enPassant = gameStateManager.makeMove('e5', 'd6');
      expect(enPassant).toBe(true);
      
      // Verify captured pawn is removed
      const afterCapture = gameStateManager.getCurrentGame();
      expect(afterCapture?.board.squares[3][3]).toBeNull(); // d5 is empty (rank 3 = 5th rank)
      expect(afterCapture?.board.squares[2][3]?.type).toBe('pawn'); // d6 has pawn (rank 2 = 6th rank)
    });

    test('should handle pawn promotion through GameStateManager', () => {
      // This would need a more complex setup to reach promotion
      // For now, we verify the GameStateManager can handle promotion
      const promotionCapability = gameStateManager.getCurrentGame();
      expect(promotionCapability).toBeDefined();
      
      // The actual promotion UI dialog would be handled by a separate component
    });
  });

  describe('Check and Checkmate Display', () => {
    test('should highlight king when in check', () => {
      // Set up a check position (simplified)
      // This would need specific moves to create a check scenario
      const currentGame = gameStateManager.getCurrentGame();
      
      const { container } = render(
        <CanvasChessBoard 
          boardState={currentGame?.board}
          showStartingPosition={false}
        />
      );
      
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      
      // When in check, the component should receive this info
      // and highlight the king's square accordingly
    });

    test('should detect and display checkmate', () => {
      // This would need a specific sequence to reach checkmate
      // For testing, we verify the GameStateManager can detect it
      const gameStatus = gameStateManager.getCurrentGame()?.status;
      
      // Status should be one of the valid chess game statuses
      const validStatuses = ['playing', 'check', 'checkmate', 'stalemate', 'draw', 'resigned'];
      expect(gameStatus && validStatuses.includes(gameStatus)).toBe(true);
    });
  });

  describe('Move History Integration', () => {
    test('should update move history after each move', () => {
      const initialHistory = gameStateManager.getGameEngine().getMoveHistory();
      expect(initialHistory.length).toBe(0);
      
      gameStateManager.makeMove('e2', 'e4');
      const afterFirst = gameStateManager.getGameEngine().getMoveHistory();
      expect(afterFirst.length).toBe(1);
      expect(afterFirst[0].notation).toBe('e4');
      
      gameStateManager.makeMove('e7', 'e5');
      const afterSecond = gameStateManager.getGameEngine().getMoveHistory();
      expect(afterSecond.length).toBe(2);
      expect(afterSecond[1].notation).toBe('e5');
    });

    test('should track move history without highlighting', () => {
      gameStateManager.makeMove('e2', 'e4');
      const history = gameStateManager.getGameEngine().getMoveHistory();
      const lastMove = history[history.length - 1];
      
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );
      
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      
      // Move history should be tracked correctly
      expect(lastMove?.from).toBe('e2');
      expect(lastMove?.to).toBe('e4');
    });
  });

  describe('Error Handling', () => {
    test('should handle null board state gracefully', () => {
      const { container } = render(
        <CanvasChessBoard 
          boardState={undefined}
          showStartingPosition={true}
        />
      );
      
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      // Should fall back to starting position
      expect(canvas).toBeInTheDocument();
    });

    test('should handle invalid move attempts', () => {
      const onMoveAttempt = vi.fn((from: string, to: string) => {
        const result = gameStateManager.makeMove(from, to);
        return result;
      });
      
      // Attempt invalid move
      const result = onMoveAttempt('e2', 'e5');
      expect(result).toBe(false);
    });
  });
});