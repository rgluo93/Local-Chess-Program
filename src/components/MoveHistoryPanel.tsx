/**
 * MoveHistoryPanel Component - Display move history with GameState integration
 * Phase 2.2 TDD Cycle 4: GameStateManager Integration
 */

import React from 'react';
import type { GameState } from '../types/Chess';
import './MoveHistoryPanel.css';

interface MoveHistoryPanelProps {
  gameState: GameState | null;
  isPostGameAnalysis?: boolean;
  currentMoveIndex?: number;
  onMoveClick?: (moveIndex: number) => void;
}

const MoveHistoryPanel: React.FC<MoveHistoryPanelProps> = ({ 
  gameState, 
  isPostGameAnalysis = false, 
  currentMoveIndex = 0, 
  onMoveClick 
}) => {
  const moves = gameState?.moves || [];
  
  return (
    <div className="move-history-panel" data-testid="move-history-panel">
      <h3 className="panel-title">Move History</h3>
      <div className="moves-list">
        {isPostGameAnalysis && onMoveClick && (
          <div 
            className={`move-pair ${currentMoveIndex === 0 ? 'current' : ''}`}
            onClick={() => onMoveClick(0)}
            style={{ cursor: 'pointer' }}
          >
            <span className="move-number">—</span>
            <span className="starting-position">Starting position</span>
          </div>
        )}
        {moves.length === 0 ? (
          <div className="no-moves">No moves yet</div>
        ) : (
          (() => {
            const pairedMoves = [];
            for (let i = 0; i < moves.length; i += 2) {
              const whiteMove = moves[i];
              const blackMove = moves[i + 1];
              const moveNumber = Math.floor(i / 2) + 1;
              
              pairedMoves.push(
                <div key={moveNumber} className="move-pair">
                  <span className="move-number">{moveNumber}.</span>
                  <span 
                    className={`white-move ${isPostGameAnalysis && currentMoveIndex === i + 1 ? 'current' : ''}`}
                    onClick={isPostGameAnalysis && onMoveClick ? () => onMoveClick(i + 1) : undefined}
                    style={isPostGameAnalysis ? { cursor: 'pointer' } : {}}
                  >
                    {whiteMove.notation}
                  </span>
                  {blackMove && (
                    <span 
                      className={`black-move ${isPostGameAnalysis && currentMoveIndex === i + 2 ? 'current' : ''}`}
                      onClick={isPostGameAnalysis && onMoveClick ? () => onMoveClick(i + 2) : undefined}
                      style={isPostGameAnalysis ? { cursor: 'pointer' } : {}}
                    >
                      {blackMove.notation}
                    </span>
                  )}
                </div>
              );
            }
            return pairedMoves;
          })()
        )}
      </div>
      {gameState && (
        <div className="game-status">
          <div className="status-item">Status: {gameState.status}</div>
          <div className="status-item">Turn: {gameState.currentPlayer}</div>
          {gameState.result !== 'ongoing' && (
            <div className="status-item result-display">
              Result: {gameState.result === 'white_wins' ? '1-0 (White Wins)' : 
                      gameState.result === 'black_wins' ? '0-1 (Black Wins)' : 
                      gameState.result === 'draw' ? '½-½ (Draw)' : 
                      gameState.result}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MoveHistoryPanel;