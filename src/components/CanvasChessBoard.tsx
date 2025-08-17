/**
 * CanvasChessBoard Component - Canvas-based 8x8 chess board
 * Phase 2.2 TDD Cycle 1: Canvas Board Foundation
 */

import React, { useEffect, useRef, useState } from 'react';
import { COLORS } from '../styles/theme';
import type { ChessBoard, PieceType, PieceColor, Square } from '../types/Chess';
import type { GameState } from '../types/Chess';
import './CanvasChessBoard.css';

export interface CanvasBoardProps {
  size?: number;
  showStartingPosition?: boolean;
  boardState?: ChessBoard;
  gameState?: GameState | null;
  onSquareClick?: (square: Square) => void;
  selectedSquare?: Square | null;
  validMoves?: Square[];
  checkSquare?: Square | null;
}


interface PieceImages {
  [key: string]: HTMLImageElement;
}

export const CanvasChessBoard = React.forwardRef<HTMLCanvasElement, CanvasBoardProps>(({ 
  size = 560, 
  showStartingPosition = false, 
  boardState,
  gameState,
  onSquareClick,
  selectedSquare,
  validMoves = [],
  checkSquare = null
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const actualRef = ref || canvasRef;
  const squareSize = size / 8;
  const labelOffset = 20;
  const canvasSize = size + labelOffset * 2; // Add space for labels
  const [pieceImages, setPieceImages] = useState<PieceImages>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // Load piece images
  useEffect(() => {
    const loadPieceImages = () => {
      const pieces: PieceType[] = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
      const colors: PieceColor[] = ['white', 'black'];
      const images: PieceImages = {};
      let loadedCount = 0;
      const totalImages = pieces.length * colors.length;

      pieces.forEach(piece => {
        colors.forEach(color => {
          const img = new Image();
          const key = `${color}_${piece}`;
          const colorDir = color === 'white' ? 'White Pieces' : 'Black Pieces';
          img.src = `/Visual Assets/Piece Set/${colorDir}/${color}_${piece}.png`;
          
          img.onload = () => {
            images[key] = img;
            loadedCount++;
            if (loadedCount === totalImages) {
              setPieceImages(images);
              setImagesLoaded(true);
            }
          };
          
          img.onerror = () => {
            console.warn(`Failed to load piece image: ${img.src}`);
            loadedCount++;
            if (loadedCount === totalImages) {
              setPieceImages(images);
              setImagesLoaded(true);
            }
          };
        });
      });
    };

    loadPieceImages();
  }, []);

  // Helper function to parse square notation
  const parseSquare = (square: Square): { file: number, rank: number } => {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // a=0, b=1, etc.
    const rank = 8 - parseInt(square[1]); // 8=0, 7=1, 6=2, etc. (top to bottom)
    return { file, rank };
  };


  // Enhanced square highlighting with better visual feedback
  const drawSquareHighlights = (ctx: CanvasRenderingContext2D, boardSize: number, offset: number) => {
    const squareSize = boardSize / 8;
    
    // Save current state for performance
    ctx.save();
    
    // Draw check highlight with soft orange glow (drawn first, behind other highlights)
    if (checkSquare) {
      const { file, rank } = parseSquare(checkSquare);
      const centerX = file * squareSize + squareSize / 2 + offset;
      const centerY = rank * squareSize + squareSize / 2 + offset;
      
      // Create a soft glow effect
      ctx.fillStyle = COLORS.FEEDBACK.CHECK;
      ctx.globalAlpha = 0.4;
      
      // Larger radius for glow effect
      const glowRadius = squareSize * 0.6;
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Inner highlight
      ctx.globalAlpha = 0.6;
      const innerRadius = squareSize * 0.4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Draw selected square highlight with enhanced visual feedback
    if (selectedSquare) {
      const { file, rank } = parseSquare(selectedSquare);
      const x = file * squareSize + offset;
      const y = rank * squareSize + offset;
      
      // Multi-layer highlight for better visual feedback
      ctx.fillStyle = COLORS.FEEDBACK.SELECTED;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x, y, squareSize, squareSize);
      
      // Add border for clarity (fallback for test environments)
      ctx.strokeStyle = COLORS.FEEDBACK.SELECTED;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      if (ctx.strokeRect) {
        ctx.strokeRect(x + 1, y + 1, squareSize - 2, squareSize - 2);
      } else {
        // Fallback for environments without strokeRect
        ctx.beginPath();
        ctx.rect(x + 1, y + 1, squareSize - 2, squareSize - 2);
        ctx.stroke();
      }
    }
    
    // Draw valid move highlights with distinct visual treatment
    const currentValidMoves = validMoves;
    
    currentValidMoves.forEach(square => {
      const { file, rank } = parseSquare(square);
      const x = file * squareSize + offset;
      const y = rank * squareSize + offset;
      
      // Use circles for valid move indicators
      ctx.fillStyle = COLORS.FEEDBACK.VALID_MOVE;
      ctx.globalAlpha = 0.7;
      
      const centerX = x + squareSize / 2;
      const centerY = y + squareSize / 2;
      const radius = squareSize * 0.15;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Restore context state
    ctx.restore();
  };

  // Draw the canvas
  useEffect(() => {
    const canvas = actualRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = canvasSize + 'px';
    canvas.style.height = canvasSize + 'px';
    
    ctx.scale(dpr, dpr);
    
    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in ctx) {
      ctx.imageSmoothingQuality = 'high';
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw the 8x8 board (offset by labelOffset to leave room for labels)
    drawBoard(ctx, size, labelOffset);
    
    // Draw coordinate labels
    drawCoordinateLabels(ctx, size, labelOffset);
    
    // Draw square highlights (including drag valid moves)
    drawSquareHighlights(ctx, size, labelOffset);
    
    // Draw pieces if images are loaded
    if (imagesLoaded) {
      if (gameState?.board) {
        drawGameState(ctx, size, labelOffset, gameState);
      } else if (showStartingPosition) {
        drawStartingPosition(ctx, size, labelOffset);
      } else if (boardState) {
        drawBoardState(ctx, size, labelOffset, boardState);
      }
    }

  }, [size, squareSize, labelOffset, canvasSize, imagesLoaded, showStartingPosition, boardState, gameState, selectedSquare, validMoves, checkSquare]);


  const drawBoard = (ctx: CanvasRenderingContext2D, boardSize: number, offset: number) => {
    const squareSize = boardSize / 8;
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const x = file * squareSize + offset;
        const y = rank * squareSize + offset;
        
        // Determine square color - a1 should be light (bottom-left)
        // rank 0 = 8th rank, rank 7 = 1st rank
        // file 0 = a-file, file 7 = h-file
        const isLightSquare = (file + rank) % 2 === 1;
        
        ctx.fillStyle = isLightSquare 
          ? COLORS.BOARD.LIGHT_SQUARE 
          : COLORS.BOARD.DARK_SQUARE;
          
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }
  };

  const drawCoordinateLabels = (ctx: CanvasRenderingContext2D, boardSize: number, offset: number) => {
    const squareSize = boardSize / 8;
    
    ctx.fillStyle = COLORS.PRIMARY.DEEP_WALNUT_BROWN;
    ctx.font = `bold ${COLORS.TYPOGRAPHY.SIZE_COORDINATES} ${COLORS.TYPOGRAPHY.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // File labels (a-h) at bottom
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (let file = 0; file < 8; file++) {
      const x = file * squareSize + squareSize / 2 + offset;
      const y = boardSize + offset + 10; // Below the board
      ctx.fillText(files[file], x, y);
    }
    
    // Rank labels (1-8) at left
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    for (let rank = 0; rank < 8; rank++) {
      const x = 10; // To the left of the board
      const y = rank * squareSize + squareSize / 2 + offset;
      ctx.fillText(ranks[rank], x, y);
    }
  };

  const drawPiece = (
    ctx: CanvasRenderingContext2D, 
    piece: PieceType, 
    color: PieceColor, 
    x: number, 
    y: number, 
    size: number
  ) => {
    const key = `${color}_${piece}`;
    const image = pieceImages[key];
    if (image && image.complete && image.naturalWidth > 0) {
      // Calculate proper aspect ratio and centering
      const imageAspectRatio = image.naturalWidth / image.naturalHeight;
      
      // Use 95% of square size with proper aspect ratio
      const maxPieceSize = size * 0.95;
      let pieceWidth, pieceHeight;
      
      if (imageAspectRatio > 1) {
        // Image is wider than tall
        pieceWidth = maxPieceSize;
        pieceHeight = maxPieceSize / imageAspectRatio;
      } else {
        // Image is taller than wide or square
        pieceHeight = maxPieceSize;
        pieceWidth = maxPieceSize * imageAspectRatio;
      }
      
      // Center the piece in the square
      const pieceX = x + (size - pieceWidth) / 2;
      const pieceY = y + (size - pieceHeight) / 2;
      
      ctx.drawImage(image, pieceX, pieceY, pieceWidth, pieceHeight);
    }
  };

  const drawStartingPosition = (ctx: CanvasRenderingContext2D, boardSize: number, offset: number) => {
    const squareSize = boardSize / 8;
    
    // Starting position pieces
    const backRank: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    
    // Draw white pieces (bottom two ranks)
    for (let file = 0; file < 8; file++) {
      // Back rank (rank 1)
      const x1 = file * squareSize + offset;
      const y1 = 7 * squareSize + offset;
      drawPiece(ctx, backRank[file], 'white', x1, y1, squareSize);
      
      // Pawn rank (rank 2)
      const x2 = file * squareSize + offset;
      const y2 = 6 * squareSize + offset;
      drawPiece(ctx, 'pawn', 'white', x2, y2, squareSize);
    }
    
    // Draw black pieces (top two ranks)
    for (let file = 0; file < 8; file++) {
      // Back rank (rank 8)
      const x8 = file * squareSize + offset;
      const y8 = 0 * squareSize + offset;
      drawPiece(ctx, backRank[file], 'black', x8, y8, squareSize);
      
      // Pawn rank (rank 7)
      const x7 = file * squareSize + offset;
      const y7 = 1 * squareSize + offset;
      drawPiece(ctx, 'pawn', 'black', x7, y7, squareSize);
    }
  };

  const drawBoardState = (
    ctx: CanvasRenderingContext2D, 
    boardSize: number, 
    offset: number, 
    board: ChessBoard
  ) => {
    const squareSize = boardSize / 8;
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board.squares[rank][file];
        if (piece) {
          const x = file * squareSize + offset;
          const y = rank * squareSize + offset;
          drawPiece(ctx, piece.type, piece.color, x, y, squareSize);
        }
      }
    }
  };

  const drawGameState = (
    ctx: CanvasRenderingContext2D, 
    boardSize: number, 
    offset: number, 
    gameState: GameState
  ) => {
    const squareSize = boardSize / 8;
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = gameState.board.squares[rank][file];
        if (piece) {
          const x = file * squareSize + offset;
          const y = rank * squareSize + offset;
          drawPiece(ctx, piece.type, piece.color, x, y, squareSize);
        }
      }
    }
  };


  const getSquareFromClick = (event: React.MouseEvent<HTMLCanvasElement>): Square | null => {
    const canvas = actualRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to board coordinates (subtract label offset)
    const boardX = x - labelOffset;
    const boardY = y - labelOffset;
    
    // Check if click is within board bounds
    if (boardX < 0 || boardX >= size || boardY < 0 || boardY >= size) {
      return null;
    }
    
    // Calculate file and rank
    const file = Math.floor(boardX / squareSize);
    const rank = Math.floor(boardY / squareSize);
    
    // Convert to chess notation
    const fileChar = String.fromCharCode('a'.charCodeAt(0) + file);
    const rankChar = (8 - rank).toString();
    
    return `${fileChar}${rankChar}` as Square;
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const square = getSquareFromClick(event);
    if (square && onSquareClick) {
      onSquareClick(square);
    }
  };

  // Keyboard navigation support for accessibility
  const handleKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (!onSquareClick) return;
    
    // Basic keyboard navigation (can be expanded)
    if (event.key === 'Enter' && selectedSquare) {
      // Could trigger action on selected square
    }
  };

  return (
    <canvas
      ref={actualRef}
      width={canvasSize}
      height={canvasSize}
      className="canvas-chess-board"
      data-testid="canvas-chess-board"
      onClick={handleCanvasClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="grid"
      aria-label="Chess board"
      style={{ 
        width: canvasSize + 'px', 
        height: canvasSize + 'px',
        cursor: 'pointer'
      }}
    />
  );
});

CanvasChessBoard.displayName = 'CanvasChessBoard';