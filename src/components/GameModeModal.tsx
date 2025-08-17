/**
 * GameModeModal - Modal for selecting game mode when starting a new game
 */

import React from 'react';
import { GameMode } from '../ai/types/AITypes';
import './GameModeModal.css';

interface GameModeModalProps {
  isOpen: boolean;
  onModeSelect: (mode: GameMode) => void;
  onClose: () => void;
  aiEngineStatus?: 'ready' | 'thinking' | 'error' | 'offline';
}

export const GameModeModal: React.FC<GameModeModalProps> = ({
  isOpen,
  onModeSelect,
  onClose,
  aiEngineStatus = 'offline'
}) => {
  if (!isOpen) return null;

  const handleModeSelect = (mode: GameMode) => {
    onModeSelect(mode);
    onClose();
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
        return 'AI Engine Online';
      case 'thinking':
        return 'AI Initializing...';
      case 'error':
        return 'AI Engine Error';
      case 'offline':
      default:
        return 'AI Engine Offline';
    }
  };

  const isAIDisabled = aiEngineStatus === 'error';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Select Game Mode</h2>
        
        <div className="mode-buttons">
          <button
            className="mode-button positive-action"
            onClick={() => handleModeSelect(GameMode.HUMAN_VS_HUMAN)}
          >
            <div className="mode-icon">👥</div>
            <div className="mode-info">
              <div className="mode-title">Human vs Human</div>
              <div className="mode-description">Play against another person</div>
            </div>
          </button>

          <button
            className="mode-button positive-action"
            onClick={() => handleModeSelect(GameMode.HUMAN_VS_AI)}
            disabled={isAIDisabled}
          >
            <div className="mode-icon">🤖</div>
            <div className="mode-info">
              <div className="mode-title">Human vs AI</div>
              <div className="mode-description">Play against Stockfish engine</div>
              <div className="ai-status">
                <span className={`ai-status-icon ${aiEngineStatus === 'thinking' ? 'thinking' : ''}`}>
                  {getAIStatusIcon()}
                </span>
                <span className="ai-status-text">{getAIStatusText()}</span>
              </div>
            </div>
          </button>
        </div>

        <button className="modal-close-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};