/**
 * Canvas Click Detection Tests
 * Phase 2.2 TDD Cycle 3: Interactive Click Detection
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { CanvasChessBoard } from '../CanvasChessBoard';

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

describe('CanvasChessBoard - TDD Cycle 3: Click Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Click Event Handling', () => {
    test('should respond to click events on canvas', () => {
      const onSquareClick = vi.fn();
      const { container } = render(
        <CanvasChessBoard onSquareClick={onSquareClick} showStartingPosition={true} />
      );
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Click on canvas
      fireEvent.click(canvas, { clientX: 100, clientY: 100 });
      
      expect(onSquareClick).toHaveBeenCalled();
    });

    test('should calculate correct square coordinates from click position', () => {
      const onSquareClick = vi.fn();
      const { container } = render(
        <CanvasChessBoard onSquareClick={onSquareClick} showStartingPosition={true} />
      );
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Mock getBoundingClientRect to simulate canvas position
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
      
      // Click on square a8 (top-left): x=20+35, y=20+35 (center of first square)
      fireEvent.click(canvas, { clientX: 55, clientY: 55 });
      
      expect(onSquareClick).toHaveBeenCalledWith('a8');
    });

    test('should handle clicks on different squares correctly', () => {
      const onSquareClick = vi.fn();
      const { container } = render(
        <CanvasChessBoard onSquareClick={onSquareClick} showStartingPosition={true} />
      );
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
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
      
      // Click on square e4 (center of board): x=300+35, y=300+35
      fireEvent.click(canvas, { clientX: 335, clientY: 335 });
      
      expect(onSquareClick).toHaveBeenCalledWith('e4');
    });

    test('should handle clicks on square h1 (bottom-right)', () => {
      const onSquareClick = vi.fn();
      const { container } = render(
        <CanvasChessBoard onSquareClick={onSquareClick} showStartingPosition={true} />
      );
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
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
      
      // Click on square h1 (bottom-right): x=510+35, y=510+35
      fireEvent.click(canvas, { clientX: 545, clientY: 545 });
      
      expect(onSquareClick).toHaveBeenCalledWith('h1');
    });
  });

  describe('Click Boundary Handling', () => {
    test('should ignore clicks outside the board area', () => {
      const onSquareClick = vi.fn();
      const { container } = render(
        <CanvasChessBoard onSquareClick={onSquareClick} showStartingPosition={true} />
      );
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
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
      
      // Click outside board area (on coordinate labels)
      fireEvent.click(canvas, { clientX: 10, clientY: 10 });
      
      expect(onSquareClick).not.toHaveBeenCalled();
    });

    test('should ignore clicks on coordinate labels area', () => {
      const onSquareClick = vi.fn();
      const { container } = render(
        <CanvasChessBoard onSquareClick={onSquareClick} showStartingPosition={true} />
      );
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
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
      
      // Click on bottom coordinate label area
      fireEvent.click(canvas, { clientX: 300, clientY: 590 });
      
      expect(onSquareClick).not.toHaveBeenCalled();
    });

    test('should handle edge case clicks at square boundaries', () => {
      const onSquareClick = vi.fn();
      const { container } = render(
        <CanvasChessBoard onSquareClick={onSquareClick} showStartingPosition={true} />
      );
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
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
      
      // Click exactly at the boundary between a8 and b8
      fireEvent.click(canvas, { clientX: 90, clientY: 55 });
      
      // Should register as b8 (since we're on the right edge)
      expect(onSquareClick).toHaveBeenCalledWith('b8');
    });
  });

  describe('Selected Square Highlighting', () => {
    test('should support selectedSquare prop for highlighting', () => {
      const { container } = render(
        <CanvasChessBoard 
          selectedSquare="e4" 
          showStartingPosition={true} 
        />
      );
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Component should render without errors when selectedSquare is provided
      expect(canvas).toBeInTheDocument();
    });

    test('should support validMoves prop for move highlighting', () => {
      const { container } = render(
        <CanvasChessBoard 
          selectedSquare="e2"
          validMoves={['e3', 'e4']}
          showStartingPosition={true} 
        />
      );
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Component should render without errors when validMoves are provided
      expect(canvas).toBeInTheDocument();
    });

    test('should handle click with selection state', () => {
      const onSquareClick = vi.fn();
      const { container } = render(
        <CanvasChessBoard 
          onSquareClick={onSquareClick}
          selectedSquare="e2"
          validMoves={['e3', 'e4']}
          showStartingPosition={true} 
        />
      );
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
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
      
      // Click on a valid move square
      fireEvent.click(canvas, { clientX: 335, clientY: 405 }); // e3
      
      expect(onSquareClick).toHaveBeenCalledWith('e3');
    });
  });

  describe('High-DPI Click Detection', () => {
    test('should handle high-DPI displays correctly', () => {
      // Mock high-DPI scenario
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        value: 2
      });
      
      const onSquareClick = vi.fn();
      const { container } = render(
        <CanvasChessBoard onSquareClick={onSquareClick} showStartingPosition={true} />
      );
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
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
      
      // Click should still work correctly on high-DPI
      fireEvent.click(canvas, { clientX: 55, clientY: 55 });
      
      expect(onSquareClick).toHaveBeenCalledWith('a8');
      
      // Reset devicePixelRatio
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        value: 1
      });
    });
  });
});