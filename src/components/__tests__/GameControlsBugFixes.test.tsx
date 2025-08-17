/**
 * GameControls Bug Fixes Tests
 * Testing fixes for New Game button state, Resign functionality, and UI updates
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import GameControls from '../GameControls';
import { GameStateManager } from '../../engine/GameStateManager';
import { GameEngine } from '../../engine/GameEngine';
import type { GameState } from '../../types/Chess';
import type { GameMode } from '../../ai/types/AITypes';

// Mock HTML Image for testing
global.Image = vi.fn(() => ({
  onload: null,
  onerror: null,
  src: '',
  width: 0,
  height: 0,
  complete: true,
  naturalWidth: 100,
  naturalHeight: 100,
})) as any;

describe('GameControls - Bug Fixes', () => {
  let gameStateManager: GameStateManager;
  let gameEngine: GameEngine;
  let onGameStateChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    gameEngine = new GameEngine();
    gameStateManager = new GameStateManager(gameEngine);
    gameStateManager.startNewGame();
    onGameStateChange = vi.fn();
  });

  describe('New Game Button State Management', () => {
    test('should be enabled when no current game exists', () => {
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={null}
        />
      );
      
      const newGameButton = screen.getByTestId('button-text-new-game').closest('button');
      expect(newGameButton).not.toBeDisabled();
    });

    test('should be disabled during active game', () => {
      const activeGame = gameStateManager.getCurrentGame();
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={activeGame}
        />
      );
      
      const newGameButton = screen.getByTestId('button-text-new-game').closest('button');
      expect(newGameButton).toBeDisabled();
    });

    test('should be enabled when game is resigned', () => {
      const currentGame = gameStateManager.getCurrentGame();
      if (currentGame) {
        gameStateManager.resignGame(currentGame.currentPlayer);
        const resignedGame = gameStateManager.getCurrentGame();
        
        render(
          <GameControls 
            gameStateManager={gameStateManager}
            onGameStateChange={onGameStateChange}
            currentGame={resignedGame}
          />
        );
        
        const newGameButton = screen.getByTestId('button-text-new-game').closest('button');
        expect(newGameButton).not.toBeDisabled();
      }
    });

    test('should call onGameStateChange when New Game clicked and enabled', () => {
      const resignedGame: GameState = {
        ...gameStateManager.getCurrentGame()!,
        status: 'resigned',
        result: 'black_wins'
      };
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={resignedGame}
        />
      );
      
      const newGameButton = screen.getByTestId('button-text-new-game').closest('button');
      fireEvent.click(newGameButton!);
      
      expect(onGameStateChange).toHaveBeenCalled();
    });

    test('should not call onGameStateChange when New Game clicked and disabled', () => {
      const activeGame = gameStateManager.getCurrentGame();
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={activeGame}
        />
      );
      
      const newGameButton = screen.getByTestId('button-text-new-game').closest('button');
      fireEvent.click(newGameButton!);
      
      // Should not be called because button is disabled
      expect(onGameStateChange).not.toHaveBeenCalled();
    });
  });

  describe('Resign Button State Management', () => {
    test('should be enabled during active game', () => {
      const activeGame = gameStateManager.getCurrentGame();
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={activeGame}
        />
      );
      
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      expect(resignButton).not.toBeDisabled();
    });

    test('should be disabled when game is already over', () => {
      const resignedGame: GameState = {
        ...gameStateManager.getCurrentGame()!,
        status: 'resigned',
        result: 'black_wins'
      };
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={resignedGame}
        />
      );
      
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      expect(resignButton).toBeDisabled();
    });

    test('should call onGameStateChange when Resign clicked and game is active', () => {
      const activeGame = gameStateManager.getCurrentGame();
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={activeGame}
        />
      );
      
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      fireEvent.click(resignButton!);
      
      expect(onGameStateChange).toHaveBeenCalled();
    });

    test('should not call onGameStateChange when Resign clicked and game is over', () => {
      const resignedGame: GameState = {
        ...gameStateManager.getCurrentGame()!,
        status: 'resigned',
        result: 'black_wins'
      };
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={resignedGame}
        />
      );
      
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      fireEvent.click(resignButton!);
      
      // Should not be called because button is disabled
      expect(onGameStateChange).not.toHaveBeenCalled();
    });
  });

  describe('Resign Logic - Current Player Becomes Loser', () => {
    test('should make white the loser when white resigns', () => {
      // Ensure it's white's turn
      const currentGame = gameStateManager.getCurrentGame();
      expect(currentGame?.currentPlayer).toBe('white');
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={currentGame}
        />
      );
      
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      fireEvent.click(resignButton!);
      
      const updatedGame = gameStateManager.getCurrentGame();
      expect(updatedGame?.status).toBe('resigned');
      expect(updatedGame?.result).toBe('black_wins'); // Black wins when white resigns
    });

    test('should make black the loser when black resigns', () => {
      // Make a move so it's black's turn
      gameStateManager.makeMove('e2', 'e4');
      const currentGame = gameStateManager.getCurrentGame();
      expect(currentGame?.currentPlayer).toBe('black');
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={currentGame}
        />
      );
      
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      fireEvent.click(resignButton!);
      
      const updatedGame = gameStateManager.getCurrentGame();
      expect(updatedGame?.status).toBe('resigned');
      expect(updatedGame?.result).toBe('white_wins'); // White wins when black resigns
    });
  });

  describe('Button Tooltips and Accessibility', () => {
    test('should have appropriate title attribute for New Game button when disabled', () => {
      const activeGame = gameStateManager.getCurrentGame();
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={activeGame}
        />
      );
      
      const newGameButton = screen.getByTestId('button-text-new-game').closest('button');
      expect(newGameButton).toHaveAttribute('title', 'Finish current game first');
    });

    test('should have appropriate title attribute for New Game button when enabled', () => {
      const resignedGame: GameState = {
        ...gameStateManager.getCurrentGame()!,
        status: 'resigned',
        result: 'black_wins'
      };
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={resignedGame}
        />
      );
      
      const newGameButton = screen.getByTestId('button-text-new-game').closest('button');
      expect(newGameButton).toHaveAttribute('title', 'Start a new game');
    });

    test('should have appropriate title attribute for Resign button when enabled', () => {
      const activeGame = gameStateManager.getCurrentGame();
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={activeGame}
        />
      );
      
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      expect(resignButton).toHaveAttribute('title', 'Resign current game');
    });

    test('should have appropriate title attribute for Resign button when disabled', () => {
      const resignedGame: GameState = {
        ...gameStateManager.getCurrentGame()!,
        status: 'resigned',
        result: 'black_wins'
      };
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={resignedGame}
        />
      );
      
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      expect(resignButton).toHaveAttribute('title', 'No active game to resign');
    });
  });

  describe('AI Integration Features', () => {
    test('should render GameModeSelector when onGameModeChange prop is provided', () => {
      const onGameModeChange = vi.fn();
      const activeGame = gameStateManager.getCurrentGame();
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={activeGame}
          gameMode="HUMAN_VS_HUMAN"
          onGameModeChange={onGameModeChange}
          aiEngineStatus="ready"
        />
      );
      
      expect(screen.getByText('Game Mode')).toBeInTheDocument();
      expect(screen.getByText('Human vs Human')).toBeInTheDocument();
      expect(screen.getByText('Human vs AI')).toBeInTheDocument();
    });

    test('should not render GameModeSelector when onGameModeChange prop is not provided', () => {
      const activeGame = gameStateManager.getCurrentGame();
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={activeGame}
        />
      );
      
      expect(screen.queryByText('Game Mode')).not.toBeInTheDocument();
    });

    test('should disable buttons when AI is thinking', () => {
      const onGameModeChange = vi.fn();
      const activeGame = gameStateManager.getCurrentGame();
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={activeGame}
          gameMode="HUMAN_VS_AI"
          onGameModeChange={onGameModeChange}
          aiEngineStatus="thinking"
          isAIThinking={true}
        />
      );
      
      const newGameButton = screen.getByTestId('button-text-new-game').closest('button');
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      const pgnButton = screen.getByTestId('button-text-pgn').closest('button');
      const fenButton = screen.getByTestId('button-text-fen').closest('button');
      
      expect(newGameButton).toBeDisabled();
      expect(resignButton).toBeDisabled();
      expect(pgnButton).toBeDisabled();
      expect(fenButton).toBeDisabled();
    });

    test('should enable buttons when AI is not thinking', () => {
      const onGameModeChange = vi.fn();
      const activeGame = gameStateManager.getCurrentGame();
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={activeGame}
          gameMode="HUMAN_VS_AI"
          onGameModeChange={onGameModeChange}
          aiEngineStatus="ready"
          isAIThinking={false}
        />
      );
      
      const resignButton = screen.getByTestId('button-text-resign').closest('button');
      const pgnButton = screen.getByTestId('button-text-pgn').closest('button');
      const fenButton = screen.getByTestId('button-text-fen').closest('button');
      
      expect(resignButton).not.toBeDisabled();
      expect(pgnButton).not.toBeDisabled();
      expect(fenButton).not.toBeDisabled();
    });

    test('should disable GameModeSelector when game is active', () => {
      const onGameModeChange = vi.fn();
      const activeGame = gameStateManager.getCurrentGame();
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={activeGame}
          gameMode="HUMAN_VS_HUMAN"
          onGameModeChange={onGameModeChange}
          aiEngineStatus="ready"
        />
      );
      
      const humanVsHumanButton = screen.getByLabelText('Human vs Human mode');
      const humanVsAIButton = screen.getByLabelText('Human vs AI mode');
      
      expect(humanVsHumanButton).toBeDisabled();
      expect(humanVsAIButton).toBeDisabled();
    });

    test('should pass correct AI status to GameModeSelector', () => {
      const onGameModeChange = vi.fn();
      const resignedGame: GameState = {
        ...gameStateManager.getCurrentGame()!,
        status: 'resigned',
        result: 'black_wins'
      };
      
      render(
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={onGameStateChange}
          currentGame={resignedGame}
          gameMode="HUMAN_VS_AI"
          onGameModeChange={onGameModeChange}
          aiEngineStatus="error"
        />
      );
      
      expect(screen.getByText('AI Error')).toBeInTheDocument();
    });
  });
});