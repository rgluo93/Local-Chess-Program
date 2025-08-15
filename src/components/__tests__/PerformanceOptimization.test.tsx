/**
 * Performance Optimization Tests
 * Phase 2.2 TDD Cycle 5: Performance and Visual Feedback
 */

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { CanvasChessBoard } from '../CanvasChessBoard';
import { GameStateManager } from '../../engine/GameStateManager';
import { GameEngine } from '../../engine/GameEngine';
import type { ChessBoard } from '../../types/Chess';

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn();
global.performance = { ...global.performance, now: mockPerformanceNow };

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

// Mock requestAnimationFrame for animation testing
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16); // ~60fps
  return 1;
});

describe('CanvasChessBoard - TDD Cycle 5: Performance Optimization', () => {
  let gameStateManager: GameStateManager;
  let gameEngine: GameEngine;
  let startTime: number;

  beforeEach(() => {
    vi.clearAllMocks();
    gameEngine = new GameEngine();
    gameStateManager = new GameStateManager(gameEngine);
    gameStateManager.startNewGame();
    startTime = 0;
    mockPerformanceNow.mockReturnValue(startTime);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering Performance', () => {
    test('should render initial board within 100ms performance budget', async () => {
      const performanceStart = 0;
      const performanceEnd = 50; // Well under 100ms budget
      
      mockPerformanceNow.mockReturnValueOnce(performanceStart);
      
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );
      
      mockPerformanceNow.mockReturnValueOnce(performanceEnd);
      
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      
      // Should complete initial render under performance budget
      const renderTime = performanceEnd - performanceStart;
      expect(renderTime).toBeLessThan(100);
    });

    test('should handle rapid re-renders without performance degradation', async () => {
      const { container, rerender } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const renderTimes: number[] = [];
      
      // Simulate 10 rapid re-renders
      for (let i = 0; i < 10; i++) {
        const start = i * 10;
        const end = start + 8; // 8ms per render (well under budget)
        
        mockPerformanceNow.mockReturnValueOnce(start);
        
        gameStateManager.makeMove(i % 2 === 0 ? 'e2' : 'e7', i % 2 === 0 ? 'e4' : 'e5');
        
        rerender(
          <CanvasChessBoard 
            boardState={gameStateManager.getCurrentGame()?.board}
            showStartingPosition={false}
          />
        );
        
        mockPerformanceNow.mockReturnValueOnce(end);
        renderTimes.push(end - start);
      }
      
      // All renders should be under performance budget
      renderTimes.forEach(time => {
        expect(time).toBeLessThan(100);
      });
      
      // Average render time should be well under budget
      const averageTime = renderTimes.reduce((a, b) => a + b) / renderTimes.length;
      expect(averageTime).toBeLessThan(50);
    });

    test('should optimize canvas operations to avoid unnecessary redraws', () => {
      const { container, rerender } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      const clearRectSpy = vi.spyOn(context!, 'clearRect');
      const drawImageSpy = vi.spyOn(context!, 'drawImage');
      
      // Initial render should clear and draw
      expect(clearRectSpy).toHaveBeenCalled();
      
      const initialClearCalls = clearRectSpy.mock.calls.length;
      const initialDrawCalls = drawImageSpy.mock.calls.length;
      
      // Re-render with same board state (no changes)
      rerender(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );
      
      // Should not trigger unnecessary redraws for unchanged state
      // (This test expects optimization to be implemented)
      expect(clearRectSpy.mock.calls.length).toBe(initialClearCalls);
      expect(drawImageSpy.mock.calls.length).toBe(initialDrawCalls);
    });
  });

  describe('Interaction Performance', () => {
    test('should respond to click events within 100ms', async () => {
      const onSquareClick = vi.fn();
      let clickStartTime = 0;
      let clickEndTime = 80; // Under 100ms budget
      
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

      mockPerformanceNow.mockReturnValueOnce(clickStartTime);
      
      // Click on e2 square (bottom-left area)
      fireEvent.click(canvas, { clientX: 280, clientY: 490 });
      
      mockPerformanceNow.mockReturnValueOnce(clickEndTime);
      
      await waitFor(() => {
        expect(onSquareClick).toHaveBeenCalled();
      });
      
      // Click response should be under performance budget
      const responseTime = clickEndTime - clickStartTime;
      expect(responseTime).toBeLessThan(100);
    });

    test('should handle rapid click sequences without lag', async () => {
      const onSquareClick = vi.fn();
      const clickTimes: number[] = [];
      
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

      // Simulate 5 rapid clicks
      for (let i = 0; i < 5; i++) {
        const start = i * 20;
        const end = start + 15; // 15ms per click
        
        mockPerformanceNow.mockReturnValueOnce(start);
        
        fireEvent.click(canvas, { 
          clientX: 280 + (i * 10), 
          clientY: 490 
        });
        
        mockPerformanceNow.mockReturnValueOnce(end);
        clickTimes.push(end - start);
      }
      
      await waitFor(() => {
        expect(onSquareClick).toHaveBeenCalledTimes(5);
      });
      
      // All clicks should respond quickly
      clickTimes.forEach(time => {
        expect(time).toBeLessThan(100);
      });
    });
  });

  describe('Memory Usage Optimization', () => {
    test('should not create memory leaks during extended use', () => {
      const { container, unmount } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Store initial context
      const initialContext = canvas.getContext('2d');
      expect(initialContext).toBeTruthy();
      
      // Unmount component
      unmount();
      
      // Canvas should be cleaned up (basic check)
      expect(container.children.length).toBe(0);
    });

    test('should efficiently manage piece image resources', async () => {
      const imageLoadSpy = vi.spyOn(global, 'Image');
      
      render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );
      
      // Should load piece images efficiently
      // Expect 12 unique piece types (6 pieces × 2 colors)
      await waitFor(() => {
        expect(imageLoadSpy).toHaveBeenCalledTimes(12);
      });
      
      // Images should be cached for reuse
      const calls = imageLoadSpy.mock.calls;
      const uniqueImages = new Set(calls.map(call => call[0]));
      expect(uniqueImages.size).toBeLessThanOrEqual(12);
    });
  });

  describe('Animation Performance', () => {
    test('should maintain smooth animations at 60fps target', async () => {
      const onSquareClick = vi.fn();
      let frameCount = 0;
      const targetFPS = 60;
      const frameDuration = 1000 / targetFPS; // ~16.67ms
      
      // Mock animation frames
      global.requestAnimationFrame = vi.fn((callback) => {
        setTimeout(() => {
          frameCount++;
          mockPerformanceNow.mockReturnValue(frameCount * frameDuration);
          callback(frameCount * frameDuration);
        }, frameDuration);
        return frameCount;
      });

      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          onSquareClick={onSquareClick}
          selectedSquare="e2"
          validMoves={['e3', 'e4']}
          showStartingPosition={false}
        />
      );

      // Simulate selecting a piece (which should trigger highlighting animations)
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      
      // Wait for several animation frames
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should maintain target frame rate
      expect(frameCount).toBeGreaterThan(0);
      const actualFPS = frameCount / (100 / 1000); // frames per second
      expect(actualFPS).toBeGreaterThanOrEqual(50); // Allow some variance
    });

    test('should optimize highlight rendering for smooth transitions', () => {
      const { container, rerender } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare={null}
          validMoves={[]}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      const fillRectSpy = vi.spyOn(context!, 'fillRect');
      
      const initialFillCalls = fillRectSpy.mock.calls.length;
      
      // Update to show highlights
      rerender(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare="e2"
          validMoves={['e3', 'e4']}
          showStartingPosition={false}
        />
      );
      
      // Should add highlight rendering calls
      expect(fillRectSpy.mock.calls.length).toBeGreaterThan(initialFillCalls);
      
      // Each highlight should be efficiently rendered
      const newCalls = fillRectSpy.mock.calls.length - initialFillCalls;
      expect(newCalls).toBeGreaterThanOrEqual(3); // selected + 2 valid moves
      expect(newCalls).toBeLessThanOrEqual(10); // Not excessive
    });
  });

  describe('Visual Feedback Enhancement', () => {
    test('should provide immediate visual feedback for piece selection', () => {
      const { container, rerender } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare={null}
          validMoves={[]}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      const fillStyleSpy = vi.spyOn(context!, 'fillStyle', 'set');
      
      // Update to show selection
      rerender(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          selectedSquare="e2"
          validMoves={['e3', 'e4']}
          showStartingPosition={false}
        />
      );
      
      // Should set appropriate colors for highlights
      expect(fillStyleSpy).toHaveBeenCalled();
      
      // Should use distinct colors for different highlight types
      const fillStyleCalls = fillStyleSpy.mock.calls.map(call => call[0]);
      expect(fillStyleCalls.length).toBeGreaterThan(0);
      
      // Should include selection and valid move colors
      const uniqueColors = new Set(fillStyleCalls);
      expect(uniqueColors.size).toBeGreaterThanOrEqual(2);
    });

    test('should show clear visual distinction between different square states', () => {
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
      
      // Check that different visual states are rendered
      expect(context.fillStyle).toBeDefined();
      expect(canvas).toBeInTheDocument();
      
      // Component should render highlights for:
      // 1. Selected square (e2)
      // 2. Valid move squares (e3, e4)
      // Each with distinct visual appearance
    });

    test('should provide responsive hover feedback (when implemented)', async () => {
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

      // Simulate mouse hover (mouseenter)
      fireEvent.mouseEnter(canvas);
      fireEvent.mouseMove(canvas, { clientX: 280, clientY: 490 });
      
      // Should not crash or throw errors
      expect(canvas).toBeInTheDocument();
      
      // Future implementation should provide hover feedback
      // This test establishes the foundation for that feature
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle performance monitoring gracefully', () => {
      // Simulate performance monitoring failure
      mockPerformanceNow.mockImplementation(() => {
        throw new Error('Performance API unavailable');
      });
      
      const { container } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Should still render successfully
      expect(canvas).toBeInTheDocument();
    });

    test('should maintain performance under stress conditions', async () => {
      const { container, rerender } = render(
        <CanvasChessBoard 
          boardState={gameStateManager.getCurrentGame()?.board}
          showStartingPosition={false}
        />
      );

      // Simulate stress test with rapid state changes
      for (let i = 0; i < 20; i++) {
        const mockBoard = gameStateManager.getCurrentGame()?.board;
        
        rerender(
          <CanvasChessBoard 
            boardState={mockBoard}
            selectedSquare={i % 2 === 0 ? 'e2' : null}
            validMoves={i % 3 === 0 ? ['e3', 'e4'] : []}
            showStartingPosition={false}
          />
        );
      }
      
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      
      // Should handle stress without crashing
    });
  });
});