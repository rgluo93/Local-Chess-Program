/**
 * AIThinkingVisualization - Component for visualizing AI candidate moves
 * 
 * Displays arrows on the chess board showing moves the AI is considering.
 */

import React, { useEffect, useRef } from 'react';
import type { ThinkingMove } from '../ai/types/AITypes';
import './AIThinkingVisualization.css';

interface AIThinkingVisualizationProps {
  thinkingMoves: ThinkingMove[];
  isThinking: boolean;
  boardSize: number;
  squareSize: number;
  boardOffset: { x: number; y: number };
  show: boolean;
}

interface ArrowConfig {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  opacity: number;
  width: number;
}

export const AIThinkingVisualization: React.FC<AIThinkingVisualizationProps> = ({
  thinkingMoves,
  isThinking,
  boardSize,
  squareSize,
  boardOffset,
  show
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!show || !isThinking || thinkingMoves.length === 0) {
      clearCanvas();
      return;
    }

    drawThinkingArrows();
  }, [thinkingMoves, isThinking, boardSize, squareSize, show]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const squareToCoordinates = (square: string): { x: number; y: number } => {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0-7
    const rank = parseInt(square[1]) - 1; // 0-7

    return {
      x: boardOffset.x + file * squareSize + squareSize / 2,
      y: boardOffset.y + (7 - rank) * squareSize + squareSize / 2
    };
  };

  const getArrowColor = (evaluation: number, index: number): string => {
    // Color coding based on evaluation and move ranking
    if (index === 0) {
      return '#4CAF50'; // Green for best move
    } else if (index === 1) {
      return '#FF9800'; // Orange for second best
    } else if (index === 2) {
      return '#2196F3'; // Blue for third best
    } else {
      return '#9E9E9E'; // Gray for other moves
    }
  };

  const getArrowOpacity = (index: number, total: number): number => {
    // Fade out lower-ranked moves
    return Math.max(0.3, 1 - (index * 0.2));
  };

  const getArrowWidth = (index: number): number => {
    // Thicker arrows for better moves
    return Math.max(3, 8 - index * 1.5);
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, config: ArrowConfig) => {
    const { from, to, color, opacity, width } = config;
    
    // Calculate arrow vector
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length < 10) return; // Don't draw very short arrows
    
    // Normalize vector
    const unitX = dx / length;
    const unitY = dy / length;
    
    // Adjust start and end points to avoid drawing over pieces
    const adjustedFrom = {
      x: from.x + unitX * (squareSize * 0.2),
      y: from.y + unitY * (squareSize * 0.2)
    };
    
    const adjustedTo = {
      x: to.x - unitX * (squareSize * 0.2),
      y: to.y - unitY * (squareSize * 0.2)
    };
    
    // Arrow head size
    const headLength = 15;
    const headAngle = Math.PI / 6;
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw arrow shaft
    ctx.beginPath();
    ctx.moveTo(adjustedFrom.x, adjustedFrom.y);
    ctx.lineTo(adjustedTo.x, adjustedTo.y);
    ctx.stroke();
    
    // Draw arrow head
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.moveTo(adjustedTo.x, adjustedTo.y);
    ctx.lineTo(
      adjustedTo.x - headLength * Math.cos(angle - headAngle),
      adjustedTo.y - headLength * Math.sin(angle - headAngle)
    );
    ctx.lineTo(
      adjustedTo.x - headLength * Math.cos(angle + headAngle),
      adjustedTo.y - headLength * Math.sin(angle + headAngle)
    );
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  };

  const drawThinkingArrows = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sort moves by evaluation (best first)
    const sortedMoves = [...thinkingMoves].sort((a, b) => b.evaluation - a.evaluation);

    // Draw arrows for top moves (limit to 5 for clarity)
    sortedMoves.slice(0, 5).forEach((thinkingMove, index) => {
      const from = squareToCoordinates(thinkingMove.move.from);
      const to = squareToCoordinates(thinkingMove.move.to);

      const arrowConfig: ArrowConfig = {
        from,
        to,
        color: getArrowColor(thinkingMove.evaluation, index),
        opacity: getArrowOpacity(index, sortedMoves.length),
        width: getArrowWidth(index)
      };

      drawArrow(ctx, arrowConfig);
    });
  };

  if (!show) {
    return null;
  }

  return (
    <div className="ai-thinking-visualization">
      <canvas
        ref={canvasRef}
        width={boardSize}
        height={boardSize}
        className="thinking-arrows-canvas"
        style={{
          position: 'absolute',
          top: boardOffset.y,
          left: boardOffset.x,
          pointerEvents: 'none',
          zIndex: 10
        }}
        aria-hidden="true"
      />
      
      {isThinking && (
        <div className="thinking-indicator">
          <div className="thinking-spinner"></div>
          <span className="thinking-text">AI is thinking...</span>
          {thinkingMoves.length > 0 && (
            <div className="thinking-stats">
              Evaluating {thinkingMoves.length} move{thinkingMoves.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
};