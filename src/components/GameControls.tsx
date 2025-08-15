/**
 * GameControls Component - Game control buttons with GameState integration
 * Phase 2.2 TDD Cycle 4: GameStateManager Integration
 */

import React from 'react';
import { GameStateManager } from '../engine/GameStateManager';
import type { GameState } from '../types/Chess';
import './GameControls.css';

interface GameControlsProps {
  gameStateManager: GameStateManager;
  onGameStateChange: () => void;
  currentGame: GameState | null;
}

const GameControls: React.FC<GameControlsProps> = ({ gameStateManager, onGameStateChange, currentGame }) => {
  
  // Check if game is over (only allow new game when current game is finished)
  const isGameOver = currentGame && ['checkmate', 'stalemate', 'draw', 'resigned'].includes(currentGame.status);
  const isGameActive = currentGame && currentGame.status === 'playing';
  // Allow resign when game is active OR in check (but not when game is already over)
  const canResign = currentGame && !isGameOver && (currentGame.status === 'playing' || currentGame.status === 'check');

  const handleNewGame = () => {
    if (isGameOver || !currentGame) {
      gameStateManager.startNewGame();
      onGameStateChange();
    }
  };

  const handleResign = () => {
    if (canResign) {
      gameStateManager.resignGame(currentGame.currentPlayer);
      onGameStateChange();
    }
  };

  const handleCopyPGN = async () => {
    if (currentGame && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(currentGame.pgn);
        console.log('PGN copied to clipboard');
      } catch (error) {
        console.error('Failed to copy PGN:', error);
      }
    }
  };

  const handleCopyFEN = async () => {
    if (currentGame && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(currentGame.fen);
        console.log('FEN copied to clipboard');
      } catch (error) {
        console.error('Failed to copy FEN:', error);
      }
    }
  };

  return (
    <div className="game-controls" data-testid="game-controls">
      <button 
        className="positive-action" 
        onClick={handleNewGame}
        disabled={!isGameOver && currentGame !== null}
        title={isGameOver || !currentGame ? "Start a new game" : "Finish current game first"}
      >
        <span data-testid="button-text-new-game">New Game</span>
      </button>
      <button 
        className="negative-action" 
        onClick={handleResign}
        disabled={!canResign}
        title={canResign ? "Resign current game" : "No active game to resign"}
      >
        <span data-testid="button-text-resign">Resign</span>
      </button>
      <button className="primary-bg" data-testid="pgn-button" onClick={handleCopyPGN}>
        <span data-testid="button-text-pgn">Copy PGN</span>
      </button>
      <button className="primary-bg" data-testid="fen-button" onClick={handleCopyFEN}>
        <span data-testid="button-text-fen">Copy FEN</span>
      </button>
    </div>
  );
};

export default GameControls;