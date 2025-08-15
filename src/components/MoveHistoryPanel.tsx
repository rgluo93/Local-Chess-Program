/**
 * MoveHistoryPanel Component - Display move history with GameState integration
 * Phase 2.2 TDD Cycle 4: GameStateManager Integration
 */

import React from 'react';
import { GameStateManager } from '../engine/GameStateManager';
import type { GameState } from '../types/Chess';
import './MoveHistoryPanel.css';

interface MoveHistoryPanelProps {
  gameStateManager: GameStateManager;
  gameState: GameState | null;
}

const MoveHistoryPanel: React.FC<MoveHistoryPanelProps> = ({ gameStateManager, gameState }) => {
  const moves = gameState?.moves || [];
  
  return (
    <div className="move-history-panel" data-testid="move-history-panel">
      <h3 className="panel-title">Move History</h3>
      <div className="moves-list">
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
                  <span className="white-move">{whiteMove.notation}</span>
                  {blackMove && <span className="black-move">{blackMove.notation}</span>}
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