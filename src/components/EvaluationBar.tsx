/**
 * EvaluationBar Component - Shows position evaluation in main game interface
 */

import React from 'react';
import type { GameState } from '../types/Chess';
import './EvaluationBar.css';

interface EvaluationBarProps {
  evaluation: number | null;
  mateInMoves: number | null;
  currentDepth: number;
  isEvaluating: boolean;
  gameState: GameState | null;
  gameResult?: string;
  gameStatus?: string;
  drawReason?: string;
  isAtFinalPosition?: boolean;
}

const EvaluationBar: React.FC<EvaluationBarProps> = ({
  evaluation,
  mateInMoves,
  currentDepth,
  isEvaluating,
  gameState,
  gameResult,
  gameStatus,
  drawReason,
  isAtFinalPosition = false
}) => {
  // Format evaluation for display
  const formatEvaluation = (evaluation: number | null, mateIn: number | null = null): string => {
    if (evaluation === null) return "...";
    
    // Check for mate scores
    if (mateIn !== null) {
      return `M${mateIn}`;
    } else if (Math.abs(evaluation) >= 999999) {
      return 'M#';
    } else {
      // Regular centipawn evaluation
      const pawns = (evaluation / 100).toFixed(2);
      return evaluation >= 0 ? `+${pawns}` : pawns.toString();
    }
  };

  // Get game over state from current position
  const getGameOverState = (): { isGameOver: boolean; type: 'checkmate' | 'stalemate' | null; winner: 'white' | 'black' | null } => {
    if (!gameState) return { isGameOver: false, type: null, winner: null };
    
    if (gameState.status === 'checkmate') {
      return {
        isGameOver: true,
        type: 'checkmate',
        winner: gameState.currentPlayer === 'white' ? 'black' : 'white' // Current turn lost
      };
    }
    if (gameState.status === 'stalemate') {
      return {
        isGameOver: true,
        type: 'stalemate',
        winner: null
      };
    }
    return { isGameOver: false, type: null, winner: null };
  };

  // Get specific game ending text for the evaluation bar
  const getGameEndingText = (): string | null => {
    const gameOverState = getGameOverState();
    
    // If we're at a position that's naturally game over (checkmate/stalemate) - always show these
    if (gameOverState.isGameOver) {
      if (gameOverState.type === 'checkmate') {
        return 'CHECKMATE';
      }
      if (gameOverState.type === 'stalemate') {
        return 'STALEMATE';
      }
    }
    
    // Only show resignation and draw endings when at the final position
    if (!isAtFinalPosition) {
      return null;
    }
    
    // If game ended by resignation (passed from main game)
    if (gameStatus === 'resigned') {
      if (gameResult === 'white_wins' || gameResult === '1-0') {
        return 'BLACK RESIGNS';
      }
      if (gameResult === 'black_wins' || gameResult === '0-1') {
        return 'WHITE RESIGNS';
      }
    }
    
    // If game ended by draw (passed from main game) - only check actual draw reasons, not current position
    if (gameStatus === 'draw' && gameResult !== 'ongoing') {
      if (drawReason === 'threefold_repetition') {
        return '3-FOLD REPETITION';
      }
      if (drawReason === 'fifty_move_rule') {
        return '50-MOVE RULE';
      }
      if (drawReason === 'insufficient_material') {
        return 'INSUFFICIENT MATERIAL';
      }
      // Fallback for other draw types
      return 'DRAW';
    }
    
    return null;
  };

  // Calculate evaluation bar percentage (0-100, where 50 is equal position)
  const getEvaluationPercentage = (evaluation: number | null): number => {
    const gameOverState = getGameOverState();
    
    // Handle game over states
    if (gameOverState.isGameOver) {
      if (gameOverState.type === 'checkmate') {
        return gameOverState.winner === 'white' ? 100 : 0;
      }
      if (gameOverState.type === 'stalemate') {
        return 50; // Draw - equal bar
      }
    }
    
    if (evaluation === null) return 50;
    
    // For mate scores, fill entire bar
    if (Math.abs(evaluation) >= 999999) {
      return evaluation > 0 ? 100 : 0;
    }
    
    // Convert centipawns to percentage
    // Use a logarithmic scale for better visual representation
    // Cap at +/- 500 centipawns (5 pawns) for reasonable display
    const clampedEval = Math.max(-500, Math.min(500, evaluation));
    const percentage = 50 + (clampedEval / 500) * 45; // 5-95% range
    return Math.max(5, Math.min(95, percentage));
  };

  const gameOverState = getGameOverState();
  const evalPercentage = getEvaluationPercentage(evaluation);
  const gameEndingText = getGameEndingText();

  return (
    <div className="evaluation-bar-container">
      <h4>Position Evaluation</h4>
      <div className="evaluation-bar">
        <div className="eval-bar-bg">
          <div className="black-section"></div>
          <div 
            className="white-section" 
            style={{ 
              height: `${evalPercentage}%`,
              minHeight: evalPercentage === 0 ? '0px' : '20px'
            }}
          >
            {(() => {
              if (gameOverState.isGameOver) {
                // Show game result in bottom eval text area
                // Only show if white section has some height (not black mate)
                if (evalPercentage > 0) {
                  if (gameOverState.type === 'checkmate') {
                    const resultText = gameOverState.winner === 'white' ? '1-0' : '0-1';
                    return (
                      <div className="eval-score-text game-result">
                        {resultText}
                      </div>
                    );
                  } else if (gameOverState.type === 'stalemate') {
                    return (
                      <div className="eval-score-text game-result stalemate-result">
                        <span className="fraction">
                          <span className="numerator">1</span>
                          <span className="denominator">2</span>
                        </span>
                        <span className="dash">-</span>
                        <span className="fraction">
                          <span className="numerator">1</span>
                          <span className="denominator">2</span>
                        </span>
                      </div>
                    );
                  }
                }
                return null;
              } else {
                return (
                  <div className="eval-score-text">
                    {isEvaluating && evaluation === null ? (
                      "..."
                    ) : (
                      formatEvaluation(evaluation, mateInMoves)
                    )}
                  </div>
                );
              }
            })()}
          </div>
          {(() => {
            // Show specific ending reason text
            if (gameEndingText) {
              return (
                <div className="game-over-text-overlay">
                  {gameEndingText}
                </div>
              );
            }
            return null;
          })()}
          <div className="eval-bar-midline"></div>
          {(() => {
            // Show game result at bottom for black checkmate (when white section is 0%)
            if (gameOverState.isGameOver && evalPercentage === 0) {
              if (gameOverState.type === 'checkmate') {
                return (
                  <div className="eval-score-text game-result black-mate-result">
                    0-1
                  </div>
                );
              }
            }
            return null;
          })()}
        </div>
      </div>
      <div className="evaluation-info">
        {isEvaluating ? (
          <small>Analyzing depth: {currentDepth}/20</small>
        ) : (
          <small>Depth: {currentDepth}</small>
        )}
      </div>
    </div>
  );
};

export default EvaluationBar;