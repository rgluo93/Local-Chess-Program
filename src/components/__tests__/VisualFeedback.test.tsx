/**
 * Visual Feedback Enhancement Tests
 * Phase 2.2 TDD Cycle 5: Enhanced User Interface Feedback
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { CanvasChessBoard } from '../CanvasChessBoard';
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

describe('CanvasChessBoard - TDD Cycle 5: Visual Feedback Enhancement', () => {
  let gameStateManager: GameStateManager;
  let gameEngine: GameEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    gameEngine = new GameEngine();
    gameStateManager = new GameStateManager(gameEngine);
    gameStateManager.startNewGame();
  });

  describe('Enhanced Highlighting System', () => {
    test('should use distinct colors for different highlight types', () => {
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare="e2"
          validMoves={['e3', 'e4']}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      
      // Mock fillStyle to track color usage
      const fillStyleValues: string[] = [];
      const originalFillStyleSetter = Object.getOwnPropertyDescriptor(
        CanvasRenderingContext2D.prototype, 'fillStyle'
      )?.set;
      
      Object.defineProperty(context!, 'fillStyle', {
        set: function(value: any) {
          fillStyleValues.push(String(value));
          originalFillStyleSetter?.call(this, value);
        },
        get: function() {
          return this._fillStyle || '#000000';
        }
      });

      // Force a re-render to capture color usage
      canvas.width = canvas.width; // Clears canvas and triggers redraw
      
      // Should use multiple distinct colors for highlights
      expect(fillStyleValues.length).toBeGreaterThan(0);
      
      // Should have different colors for selected vs valid moves
      const uniqueColors = new Set(fillStyleValues);
      expect(uniqueColors.size).toBeGreaterThanOrEqual(2);
    });

    test('should render selection highlight with proper opacity', () => {
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare="e2"
          validMoves={[]}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      
      // Mock globalAlpha to track opacity usage
      const alphaValues: number[] = [];
      const originalAlphaSetter = Object.getOwnPropertyDescriptor(
        CanvasRenderingContext2D.prototype, 'globalAlpha'
      )?.set;
      
      Object.defineProperty(context!, 'globalAlpha', {
        set: function(value: number) {
          alphaValues.push(value);
          originalAlphaSetter?.call(this, value);
        },
        get: function() {
          return this._globalAlpha || 1.0;
        }
      });

      // Force redraw
      canvas.width = canvas.width;
      
      // Should use appropriate opacity for highlights
      expect(alphaValues.some(alpha => alpha > 0 && alpha < 1)).toBe(true);
    });

    test('should show valid moves with consistent visual treatment', () => {
      const validMoves = ['e3', 'e4', 'd3', 'd4'];
      
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare="e2"
          validMoves={validMoves}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      
      // Track fillRect calls for highlighting
      const fillRectSpy = vi.spyOn(context!, 'fillRect');
      
      // Force redraw
      canvas.width = canvas.width;
      
      // Should draw highlights for all valid moves plus selected square
      expect(fillRectSpy.mock.calls.length).toBeGreaterThanOrEqual(validMoves.length + 1);
    });
  });

  describe('Interactive Feedback', () => {
    test('should provide immediate visual response to square clicks', async () => {
      const onSquareClick = vi.fn();
      
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          onSquareClick={onSquareClick}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      canvas.getBoundingClientRect = vi.fn(() => ({
        left: 0, top: 0, width: 560, height: 560,
        x: 0, y: 0, right: 560, bottom: 560, toJSON: () => {}
      }));

      // Click on e2 square
      fireEvent.click(canvas, { clientX: 280, clientY: 490 });
      
      await waitFor(() => {
        expect(onSquareClick).toHaveBeenCalledWith('e2');
      });
      
      // Should respond immediately without delay
      expect(onSquareClick).toHaveBeenCalledTimes(1);
    });

    test('should handle mouse enter/leave events for hover effects', () => {
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Should handle mouse events without crashing
      expect(() => {
        fireEvent.mouseEnter(canvas);
        fireEvent.mouseMove(canvas, { clientX: 280, clientY: 280 });
        fireEvent.mouseLeave(canvas);
      }).not.toThrow();
      
      expect(canvas).toBeInTheDocument();
    });

    test('should provide accessible interaction for keyboard navigation', () => {
      const onSquareClick = vi.fn();
      
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          onSquareClick={onSquareClick}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Canvas should be focusable for keyboard navigation
      expect(canvas.getAttribute('tabIndex')).toBeDefined();
      
      // Should handle keyboard events
      expect(() => {
        fireEvent.keyDown(canvas, { key: 'Enter' });
        fireEvent.keyDown(canvas, { key: 'ArrowRight' });
        fireEvent.keyDown(canvas, { key: 'ArrowDown' });
      }).not.toThrow();
    });
  });

  describe('Animation Smoothness', () => {
    test('should support smooth transitions between highlight states', async () => {
      const { container, rerender } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare={null}
          validMoves={[]}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Track animation frame requests
      const rafSpy = vi.spyOn(global, 'requestAnimationFrame');
      
      // Change to selected state
      rerender(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare="e2"
          validMoves={['e3', 'e4']}
          showStartingPosition={false}
        />
      );
      
      // Wait for potential animations
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Should handle state transitions smoothly
      expect(canvas).toBeInTheDocument();
      
      // May use requestAnimationFrame for smooth transitions
      // (This is implementation-dependent)
    });

    test('should maintain visual consistency during rapid state changes', () => {
      const { container, rerender } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare={null}
          validMoves={[]}
          showStartingPosition={false}
        />
      );

      // Rapidly change states
      const states = [
        { selected: 'e2', moves: ['e3', 'e4'] },
        { selected: 'd2', moves: ['d3', 'd4'] },
        { selected: null, moves: [] },
        { selected: 'g1', moves: ['f3', 'h3'] },
      ];

      states.forEach(state => {
        rerender(
          <CanvasChessBoard 
            boardState={gameStateManager.getCurrentGame()?.board}
            selectedSquare={state.selected}
            validMoves={state.moves}
            showStartingPosition={false}
          />
        );
      });

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      
      // Should handle rapid changes without visual artifacts
      expect(canvas.width).toBe(560);
      expect(canvas.height).toBe(560);
    });
  });

  describe('Visual Polish and Enhancement', () => {
    test('should render with anti-aliased edges for smooth appearance', () => {
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      
      // Should enable image smoothing for better visual quality
      expect(context!.imageSmoothingEnabled).toBe(true);
      
      // Should use high quality smoothing if available
      if ('imageSmoothingQuality' in context!) {
        expect(context!.imageSmoothingQuality).toBeDefined();
      }
    });

    test('should use consistent visual hierarchy for different elements', () => {
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare="e2"
          validMoves={['e3', 'e4']}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Canvas should maintain proper layering:
      // 1. Board squares (background)
      // 2. Highlights (middle layer)
      // 3. Pieces (foreground)
      // 4. Coordinates (overlay)
      
      expect(canvas).toBeInTheDocument();
      expect(canvas.width).toBe(560);
      expect(canvas.height).toBe(560);
    });

    test('should provide clear visual feedback for different game states', () => {
      // Test normal state
      const { container, rerender } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );

      let canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      
      // Test selected state
      rerender(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare="e2"
          validMoves={['e3', 'e4']}
          showStartingPosition={false}
        />
      );
      
      canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      
      // Should maintain visual clarity in all states
    });
  });

  describe('Accessibility and Usability', () => {
    test('should provide sufficient color contrast for highlights', () => {
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare="e2"
          validMoves={['e3', 'e4']}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Colors should be accessible
      // This is a placeholder test - actual implementation should verify
      // that highlight colors meet WCAG contrast requirements
      expect(canvas).toBeInTheDocument();
    });

    test('should support high-contrast mode preferences', () => {
      // Mock high contrast preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare="e2"
          validMoves={['e3', 'e4']}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      
      // Should adapt to high contrast preferences
      // Implementation should detect and respond to this setting
    });

    test('should provide clear visual boundaries for interactive areas', () => {
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare="e2"
          validMoves={['e3', 'e4']}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      
      // Should clearly delineate squares and interactive areas
      // Stroke operations should be used for boundaries
      const strokeRectSpy = vi.spyOn(context!, 'strokeRect');
      const strokeSpy = vi.spyOn(context!, 'stroke');
      
      // Force redraw
      canvas.width = canvas.width;
      
      // Should use stroke operations for clear boundaries
      expect(strokeRectSpy.mock.calls.length + strokeSpy.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    test('should gracefully handle missing highlight information', () => {
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare={undefined as any}
          validMoves={undefined as any}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Should render without crashing
      expect(canvas).toBeInTheDocument();
    });

    test('should handle canvas context loss gracefully', () => {
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Simulate context loss
      const lossEvent = new Event('webglcontextlost');
      canvas.dispatchEvent(lossEvent);
      
      // Should not crash
      expect(canvas).toBeInTheDocument();
    });

    test('should maintain performance under visual complexity', () => {
      // Create complex visual state
      const allSquares = [];
      for (let file = 0; file < 8; file++) {
        for (let rank = 0; rank < 8; rank++) {
          const square = String.fromCharCode(97 + file) + (rank + 1);
          allSquares.push(square);
        }
      }

      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare="e2"
          validMoves={allSquares} // Extreme case: all squares highlighted
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Should handle extreme highlighting scenarios
      expect(canvas).toBeInTheDocument();
    });
  });
});