/**
 * GameModeSelector - Component for selecting game mode
 * 
 * Allows users to switch between Human vs Human and Human vs AI gameplay.
 */

import React, { useState } from 'react';
import { GameMode } from '../ai/types/AITypes';
import './GameModeSelector.css';

interface GameModeSelectorProps {
  currentMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  disabled?: boolean;
  aiEngineStatus?: 'ready' | 'thinking' | 'error' | 'offline';
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({
  currentMode,
  onModeChange,
  disabled = false,
  aiEngineStatus = 'offline'
}) => {
  const [isChanging, setIsChanging] = useState(false);

  const handleModeChange = async (mode: GameMode) => {
    if (disabled || isChanging || mode === currentMode) return;

    setIsChanging(true);
    try {
      await onModeChange(mode);
    } finally {
      setIsChanging(false);
    }
  };

  const getAIStatusIcon = () => {
    switch (aiEngineStatus) {
      case 'ready':
        return '🟢';
      case 'thinking':
        return '🟡';
      case 'error':
        return '🔴';
      case 'offline':
      default:
        return '⚫';
    }
  };

  const getAIStatusText = () => {
    switch (aiEngineStatus) {
      case 'ready':
        return 'AI Ready';
      case 'thinking':
        return 'AI Thinking...';
      case 'error':
        return 'AI Error';
      case 'offline':
      default:
        return 'AI Offline';
    }
  };

  return (
    <div className="game-mode-selector">
      <h3 className="game-mode-title">Game Mode</h3>
      
      <div className="game-mode-options">
        <button
          className={`game-mode-option ${currentMode === GameMode.HUMAN_VS_HUMAN ? 'active' : ''}`}
          onClick={() => handleModeChange(GameMode.HUMAN_VS_HUMAN)}
          disabled={disabled || isChanging}
          aria-label="Human vs Human mode"
        >
          <div className="mode-icon">👥</div>
          <div className="mode-title">Human vs Human</div>
          <div className="mode-description">Play against another person</div>
        </button>

        <button
          className={`game-mode-option ${currentMode === GameMode.HUMAN_VS_AI ? 'active' : ''}`}
          onClick={() => handleModeChange(GameMode.HUMAN_VS_AI)}
          disabled={disabled || isChanging || aiEngineStatus === 'error'}
          aria-label="Human vs AI mode"
        >
          <div className="mode-icon">🤖</div>
          <div className="mode-title">Human vs AI</div>
          <div className="mode-description">Play against Stockfish engine</div>
          <div className="ai-status">
            <span className="ai-status-icon">{getAIStatusIcon()}</span>
            <span className="ai-status-text">{getAIStatusText()}</span>
          </div>
        </button>

        <button
          className={`game-mode-option ${currentMode === GameMode.SANDBOX ? 'active' : ''}`}
          onClick={() => handleModeChange(GameMode.SANDBOX)}
          disabled={disabled || isChanging}
          aria-label="Sandbox mode"
        >
          <div className="mode-icon">🔬</div>
          <div className="mode-title">Sandbox</div>
          <div className="mode-description">Analyze positions with full engine support</div>
        </button>
      </div>

      {isChanging && (
        <div className="mode-changing-indicator">
          <div className="spinner"></div>
          <span>Switching game mode...</span>
        </div>
      )}

      {aiEngineStatus === 'error' && (
        <div className="ai-error-message">
          ⚠️ AI engine is currently unavailable. Please try refreshing the page.
        </div>
      )}
    </div>
  );
};