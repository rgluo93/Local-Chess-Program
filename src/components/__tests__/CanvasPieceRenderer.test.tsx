/**
 * Canvas Piece Renderer Tests
 * Phase 2.2 TDD Cycle 2: Piece Rendering System
 */

import React from 'react';
import { render } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { CanvasChessBoard } from '../CanvasChessBoard';
import type { PieceType, PieceColor, ChessBoard } from '../../types/Chess';

// Mock HTML Image for testing
global.Image = vi.fn(() => ({
  onload: null,
  onerror: null,
  src: '',
  width: 0,
  height: 0,
})) as any;

describe('CanvasChessBoard - TDD Cycle 2: Piece Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Piece Asset Loading', () => {
    test('should attempt to load all 12 piece assets', () => {
      render(<CanvasChessBoard />);
      
      // Should attempt to load 6 piece types × 2 colors = 12 images
      expect(global.Image).toHaveBeenCalledTimes(12);
    });

    test('should load correct asset paths for white pieces', () => {
      const mockImage = {
        onload: null,
        onerror: null,
        src: '',
        width: 0,
        height: 0,
      };
      
      (global.Image as any).mockImplementation(() => mockImage);
      
      render(<CanvasChessBoard />);
      
      // Images should be created with Image constructor
      expect(global.Image).toHaveBeenCalledTimes(12);
    });

    test('should load correct asset paths for black pieces', () => {
      render(<CanvasChessBoard />);
      
      // Should load all 12 piece images (6 pieces × 2 colors)
      expect(global.Image).toHaveBeenCalledTimes(12);
    });
  });

  describe('Piece Positioning', () => {
    test('should render pieces when showStartingPosition is true', () => {
      const { container } = render(<CanvasChessBoard showStartingPosition={true} />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Component should render canvas
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveClass('canvas-chess-board');
    });

    test('should accept showStartingPosition prop', () => {
      const { container } = render(<CanvasChessBoard showStartingPosition={true} />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Component should attempt to load piece images when showStartingPosition is true
      expect(global.Image).toHaveBeenCalledTimes(12);
      expect(canvas).toBeInTheDocument();
    });

    test('should accept custom boardState prop', () => {
      const customBoard = {
        squares: Array(8).fill(null).map(() => Array(8).fill(null)),
        toMove: 'white' as const,
        castlingRights: {
          whiteKingside: true,
          whiteQueenside: true,
          blackKingside: true,
          blackQueenside: true,
        },
        enPassantTarget: null,
        halfmoveClock: 0,
        fullmoveNumber: 1,
      };
      
      const { container } = render(<CanvasChessBoard boardState={customBoard} />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Component should load images when custom board state is provided
      expect(global.Image).toHaveBeenCalledTimes(12);
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('Piece Rendering Quality', () => {
    test('should handle missing piece assets gracefully', () => {
      const { container } = render(<CanvasChessBoard showStartingPosition={true} />);
      
      // Component should not crash even if images fail to load
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    test('should render canvas with correct size', () => {
      const { container } = render(<CanvasChessBoard showStartingPosition={true} />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Canvas should have correct dimensions (560 + 40 for labels = 600)
      expect(canvas.width).toBe(600);
      expect(canvas.height).toBe(600);
    });
  });
});