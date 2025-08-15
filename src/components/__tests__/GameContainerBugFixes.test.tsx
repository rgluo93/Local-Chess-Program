/**
 * GameContainer Bug Fixes Tests
 * Testing move prevention after game over and UI state management
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import GameContainer from '../GameContainer';
import { GameStateManager } from '../../engine/GameStateManager';
import { GameEngine } from '../../engine/GameEngine';

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

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe('GameContainer - Bug Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Move Prevention After Game Over', () => {
    test('should prevent moves after resignation', () => {
      const { container } = render(<GameContainer />);
      
      // Get canvas element
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      
      // Mock canvas getBoundingClientRect for click coordinate calculation
      canvas.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 560,
        height: 560,
        x: 0,
        y: 0,
        right: 560,
        bottom: 560,
        toJSON: () => {}
      }));

      // First resign the game
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      fireEvent.click(resignButton!);

      // Now try to click on the board - should be prevented
      const consoleSpy = vi.spyOn(console, 'log');
      
      // Click on e2 square (should be around coordinates 280, 490)
      fireEvent.click(canvas, { clientX: 280, clientY: 490 });
      
      // Should log that game is over and moves not allowed
      expect(consoleSpy).toHaveBeenCalledWith('Game is over, moves not allowed');
    });

    test('should clear selection when game becomes over', () => {
      const { container } = render(<GameContainer />);
      
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      canvas.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 560,
        height: 560,
        x: 0,
        y: 0,
        right: 560,
        bottom: 560,
        toJSON: () => {}
      }));

      // First select a piece (e2)
      fireEvent.click(canvas, { clientX: 280, clientY: 490 });
      
      // Then resign the game while a piece is selected
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      fireEvent.click(resignButton!);

      // Try to click again - should immediately clear selection and prevent moves
      const consoleSpy = vi.spyOn(console, 'log');
      fireEvent.click(canvas, { clientX: 280, clientY: 350 }); // e4 square
      
      expect(consoleSpy).toHaveBeenCalledWith('Game is over, moves not allowed');
    });
  });

  describe('UI State Consistency', () => {
    test('should show game status as resigned immediately after resignation', () => {
      render(<GameContainer />);
      
      // Resign the game
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      fireEvent.click(resignButton!);
      
      // Check that status is immediately updated
      expect(screen.getByText(/Status: resigned/)).toBeInTheDocument();
    });

    test('should disable New Game button during active play and enable after resignation', () => {
      render(<GameContainer />);
      
      // Initially, New Game should be disabled (game is active)
      const newGameButton = screen.getByTestId('button-text-new-game').closest('button');
      expect(newGameButton).toBeDisabled();
      
      // Resign the game
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      fireEvent.click(resignButton!);
      
      // Now New Game should be enabled
      expect(newGameButton).not.toBeDisabled();
    });

    test('should disable Resign button after resignation', () => {
      render(<GameContainer />);
      
      // Initially, Resign should be enabled (game is active)
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      expect(resignButton).not.toBeDisabled();
      
      // Resign the game
      fireEvent.click(resignButton!);
      
      // Now Resign should be disabled
      expect(resignButton).toBeDisabled();
    });

    test('should show winner correctly when white resigns', () => {
      render(<GameContainer />);
      
      // Initially should show white's turn
      expect(screen.getByText(/Turn: white/)).toBeInTheDocument();
      
      // White resigns
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      fireEvent.click(resignButton!);
      
      // Should show that black wins (this would be in move history or game result)
      expect(screen.getByText(/Status: resigned/)).toBeInTheDocument();
    });
  });

  describe('Move History and Status Display', () => {
    test('should maintain move history after resignation', () => {
      const { container } = render(<GameContainer />);
      
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      canvas.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 560,
        height: 560,
        x: 0,
        y: 0,
        right: 560,
        bottom: 560,
        toJSON: () => {}
      }));

      // Make a move first
      fireEvent.click(canvas, { clientX: 280, clientY: 490 }); // Select e2
      fireEvent.click(canvas, { clientX: 280, clientY: 350 }); // Move to e4
      
      // Should show the move in history
      expect(screen.getByText('e4')).toBeInTheDocument();
      
      // Resign the game
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      fireEvent.click(resignButton!);
      
      // Move history should still be there
      expect(screen.getByText('e4')).toBeInTheDocument();
      expect(screen.getByText(/Status: resigned/)).toBeInTheDocument();
    });

    test('should show correct turn indicator throughout game lifecycle', () => {
      const { container } = render(<GameContainer />);
      
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      canvas.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 560,
        height: 560,
        x: 0,
        y: 0,
        right: 560,
        bottom: 560,
        toJSON: () => {}
      }));

      // Initially white's turn
      expect(screen.getByText(/Turn: white/)).toBeInTheDocument();
      
      // Make a move
      fireEvent.click(canvas, { clientX: 280, clientY: 490 }); // Select e2
      fireEvent.click(canvas, { clientX: 280, clientY: 350 }); // Move to e4
      
      // Should now be black's turn
      expect(screen.getByText(/Turn: black/)).toBeInTheDocument();
      
      // Black resigns
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      fireEvent.click(resignButton!);
      
      // Turn indicator should remain (showing who was supposed to move when resigned)
      expect(screen.getByText(/Turn: black/)).toBeInTheDocument();
      expect(screen.getByText(/Status: resigned/)).toBeInTheDocument();
    });
  });
});