/**
 * GameControls Component - Game control buttons with GameState integration
 * Phase 2.2 TDD Cycle 4: GameStateManager Integration
 */

import React from 'react';
import type { GameState } from '../types/Chess';
import { GameMode } from '../ai/types/AITypes';
import './GameControls.css';

interface GameControlsProps {
  currentGame: GameState | null;
  onNewGameClick?: () => void;
  isAIThinking?: boolean;
  onResign?: () => void;
  onAnalyze?: () => void;
  gameMode?: GameMode | null;
  aiEngineStatus?: 'ready' | 'thinking' | 'error' | 'offline';
}

const GameControls: React.FC<GameControlsProps> = ({ 
  currentGame,
  onNewGameClick,
  isAIThinking = false,
  onResign,
  onAnalyze,
  gameMode = null,
  aiEngineStatus = 'offline'
}) => {
  
  // Check if game is over (only allow new game when current game is finished)
  const isGameOver = currentGame && ['checkmate', 'stalemate', 'draw', 'resigned'].includes(currentGame.status);
  const isGameActive = currentGame && currentGame.status === 'playing';
  
  // Resign button logic:
  // - In human vs AI mode: always allow resign when game is active (human can always resign)
  // - In human vs human mode: allow resign when game is active OR in check (but not when game is already over)
  // - In sandbox mode: never allow resign (analysis only)
  // - Never allow resign when AI is thinking (to prevent conflicts)
  const canResign = currentGame && !isGameOver && gameMode !== GameMode.SANDBOX && (currentGame.status === 'playing' || currentGame.status === 'check');
  const resignDisabled = !canResign || isAIThinking;

  const handleNewGame = () => {
    if (isGameOver || !currentGame || gameMode === GameMode.SANDBOX) {
      if (onNewGameClick) {
        onNewGameClick();
      }
    }
  };

  const handleResign = () => {
    if (onResign) {
      onResign();
    }
  };

  const handleAnalyze = () => {
    if (onAnalyze) {
      onAnalyze();
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

  const getAIStatusDisplay = () => {
    if (gameMode !== GameMode.HUMAN_VS_AI) return null;
    
    const statusConfig = {
      ready: { icon: '🟢', text: 'AI Ready', className: 'ai-ready' },
      thinking: { icon: '🟡', text: 'AI Thinking...', className: 'ai-thinking' },
      error: { icon: '🔴', text: 'AI Error', className: 'ai-error' },
      offline: { icon: '⚫', text: 'AI Offline', className: 'ai-offline' }
    };

    const config = statusConfig[aiEngineStatus];
    
    return (
      <div className={`ai-status-display ${config.className}`}>
        <span className="ai-status-icon">{config.icon}</span>
        <span className="ai-status-text">{config.text}</span>
      </div>
    );
  };

  return (
    <div className="game-controls" data-testid="game-controls">
      {getAIStatusDisplay()}
      <div className="control-buttons">
        <button 
          className="positive-action" 
          onClick={handleNewGame}
          disabled={(!isGameOver && currentGame !== null && gameMode !== GameMode.SANDBOX) || isAIThinking}
          title={isGameOver || !currentGame || gameMode === GameMode.SANDBOX ? "Start a new game" : "Finish current game first"}
        >
          <span data-testid="button-text-new-game">New Game</span>
        </button>
        {isGameOver ? (
          <button 
            className="analyze-action" 
            onClick={handleAnalyze}
            disabled={isAIThinking}
            title="Analyze the completed game"
          >
            <span data-testid="button-text-analyze">Analyze</span>
          </button>
        ) : (
          <button 
            className="negative-action" 
            onClick={handleResign}
            disabled={resignDisabled}
            title={gameMode === GameMode.SANDBOX ? "Resign disabled in sandbox mode" : !canResign ? "Cannot resign when game is not active" : isAIThinking ? "Cannot resign while AI is thinking" : gameMode === GameMode.HUMAN_VS_AI ? "Resign as human player" : "Resign the current game"}
          >
            <span data-testid="button-text-resign">Resign</span>
          </button>
        )}
        <button 
          className="primary-bg" 
          data-testid="pgn-button" 
          onClick={handleCopyPGN}
          disabled={isAIThinking}
        >
          <span data-testid="button-text-pgn">Copy PGN</span>
        </button>
        <button 
          className="primary-bg" 
          data-testid="fen-button" 
          onClick={handleCopyFEN}
          disabled={isAIThinking}
        >
          <span data-testid="button-text-fen">Copy FEN</span>
        </button>
      </div>
    </div>
  );
};

export default GameControls;