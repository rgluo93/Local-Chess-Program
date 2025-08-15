/**
 * Canvas ChessBoard Component Tests
 * Phase 2.2 TDD Cycle 1: Canvas Board Foundation
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { CanvasChessBoard } from '../CanvasChessBoard';

describe('CanvasChessBoard - TDD Cycle 1: Board Foundation', () => {
  describe('Canvas Element Creation', () => {
    test('should render a canvas element', () => {
      render(<CanvasChessBoard />);
      const canvas = screen.getByTestId('canvas-chess-board');
      expect(canvas).toBeInTheDocument();
      expect(canvas.tagName).toBe('CANVAS');
    });

    test('should have correct canvas dimensions', () => {
      render(<CanvasChessBoard />);
      const canvas = screen.getByTestId('canvas-chess-board') as HTMLCanvasElement;
      
      // Default board size should be 560x560 (8 squares × 70px each) + 40px for labels
      expect(canvas.width).toBe(600); // 560 + 20*2 for labels
      expect(canvas.height).toBe(600);
    });

    test('should have canvas styling classes', () => {
      render(<CanvasChessBoard />);
      const canvas = screen.getByTestId('canvas-chess-board');
      expect(canvas).toHaveClass('canvas-chess-board');
    });
  });

  describe('Board Layout Structure', () => {
    test('should render 64 squares in 8x8 grid', () => {
      const { container } = render(<CanvasChessBoard />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      
      // Mock the canvas context to track drawing calls
      const fillRectSpy = vi.spyOn(ctx, 'fillRect');
      
      // Force a re-render to trigger canvas drawing
      render(<CanvasChessBoard />);
      
      // Should have 64 fillRect calls (one for each square)
      expect(fillRectSpy).toHaveBeenCalledTimes(64);
    });

    test('should have alternating square colors', () => {
      const { container } = render(<CanvasChessBoard />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      
      // Mock context properties
      const fillStyleSetter = vi.fn();
      Object.defineProperty(ctx, 'fillStyle', {
        set: fillStyleSetter
      });
      
      render(<CanvasChessBoard />);
      
      // Should set both light and dark square colors
      expect(fillStyleSetter).toHaveBeenCalledWith('#F0D9B5'); // Light squares
      expect(fillStyleSetter).toHaveBeenCalledWith('#B58863'); // Dark squares
    });

    test('should render coordinate labels', () => {
      const { container } = render(<CanvasChessBoard />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      
      const fillTextSpy = vi.spyOn(ctx, 'fillText');
      
      render(<CanvasChessBoard />);
      
      // Should render file labels (a-h) and rank labels (1-8)
      expect(fillTextSpy).toHaveBeenCalledWith('a', expect.any(Number), expect.any(Number));
      expect(fillTextSpy).toHaveBeenCalledWith('h', expect.any(Number), expect.any(Number));
      expect(fillTextSpy).toHaveBeenCalledWith('1', expect.any(Number), expect.any(Number));
      expect(fillTextSpy).toHaveBeenCalledWith('8', expect.any(Number), expect.any(Number));
    });
  });

  describe('Board Color Scheme', () => {
    test('should use correct light square color from theme', () => {
      const { container } = render(<CanvasChessBoard />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      
      const fillStyleSetter = vi.fn();
      Object.defineProperty(ctx, 'fillStyle', {
        set: fillStyleSetter
      });
      
      render(<CanvasChessBoard />);
      
      // Light squares should use theme color
      expect(fillStyleSetter).toHaveBeenCalledWith('#F0D9B5');
    });

    test('should use correct dark square color from theme', () => {
      const { container } = render(<CanvasChessBoard />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      
      const fillStyleSetter = vi.fn();
      Object.defineProperty(ctx, 'fillStyle', {
        set: fillStyleSetter
      });
      
      render(<CanvasChessBoard />);
      
      // Dark squares should use theme color
      expect(fillStyleSetter).toHaveBeenCalledWith('#B58863');
    });
  });

  describe('Coordinate System', () => {
    test('should place a1 square in bottom-left position', () => {
      const { container } = render(<CanvasChessBoard />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      
      const fillRectSpy = vi.spyOn(ctx, 'fillRect');
      
      render(<CanvasChessBoard />);
      
      // a1 should be at bottom-left: x=20 (offset), y=510 (7*70 + 20 offset)
      expect(fillRectSpy).toHaveBeenCalledWith(20, 510, 70, 70);
    });

    test('should place h8 square in top-right position', () => {
      const { container } = render(<CanvasChessBoard />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      
      const fillRectSpy = vi.spyOn(ctx, 'fillRect');
      
      render(<CanvasChessBoard />);
      
      // h8 should be at top-right: x=510 (7*70 + 20 offset), y=20 (offset)
      expect(fillRectSpy).toHaveBeenCalledWith(510, 20, 70, 70);
    });
  });
});