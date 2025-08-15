/**
 * GameContainer Component - Main game wrapper with GameState integration
 * Phase 2.2 TDD Cycle 4: GameStateManager Integration
 */

import React, { useState, useCallback } from 'react';
import { CanvasChessBoard } from './CanvasChessBoard';
import GameControls from './GameControls';
import MoveHistoryPanel from './MoveHistoryPanel';
import { GameStateManager } from '../engine/GameStateManager';
import { GameEngine } from '../engine/GameEngine';
import type { Square } from '../types/Chess';
import './GameContainer.css';

const GameContainer: React.FC = () => {
  // Initialize GameStateManager
  const [gameStateManager] = useState(() => {
    const gameEngine = new GameEngine();
    const manager = new GameStateManager(gameEngine);
    manager.startNewGame();
    return manager;
  });

  // UI state
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [gameState, setGameState] = useState(() => gameStateManager.getCurrentGame());

  // Update game state when it changes
  const updateGameState = useCallback(() => {
    setGameState(gameStateManager.getCurrentGame());
  }, [gameStateManager]);

  // Helper function to check if there's a piece at a square
  const hasPieceAt = (square: Square): boolean => {
    const currentGameState = gameStateManager.getCurrentGame();
    if (!currentGameState?.board) return false;
    
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // a=0, b=1, etc.
    const rank = 8 - parseInt(square[1]); // 8=0, 7=1, etc.
    
    return currentGameState.board.squares[rank][file] !== null;
  };

  // Helper function to get the square of the king in check (if any)
  const getCheckSquare = (): Square | null => {
    try {
      // Access the game engine through the manager to check for check
      const gameEngine = (gameStateManager as any).gameEngine;
      if (gameEngine && gameEngine.isInCheck && gameEngine.getKingPosition) {
        return gameEngine.isInCheck() ? gameEngine.getKingPosition() : null;
      }
    } catch (error) {
      console.warn('Error checking for check state:', error);
    }
    return null;
  };

  // Handle square selection and moves (including promotion)
  const handleSquareClick = (square: Square) => {
    console.log('Clicked square:', square);
    
    // Prevent moves if game is over
    const currentGameState = gameStateManager.getCurrentGame();
    const isGameOver = currentGameState && ['checkmate', 'stalemate', 'draw', 'resigned'].includes(currentGameState.status);
    
    if (isGameOver) {
      console.log('Game is over, moves not allowed');
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }
    
    if (selectedSquare === square) {
      // Deselect if clicking same square
      setSelectedSquare(null);
      setValidMoves([]);
    } else if (selectedSquare && validMoves.includes(square)) {
      // Check if this is a promotion move
      const currentGameState = gameStateManager.getCurrentGame();
      const fromFile = selectedSquare.charCodeAt(0) - 'a'.charCodeAt(0);
      const fromRank = 8 - parseInt(selectedSquare[1]);
      const toRank = parseInt(square[1]);
      
      const piece = currentGameState?.board.squares[fromRank][fromFile];
      const isPromotion = piece?.type === 'pawn' && 
        ((piece.color === 'white' && toRank === 8) || (piece.color === 'black' && toRank === 1));

      if (isPromotion) {
        // Trigger promotion dialog via canvas component - we'll pass the move to the canvas
        // For now, just execute with Queen as default (can be enhanced)
        const moveResult = gameStateManager.makeMove(selectedSquare, square, 'queen');
        if (moveResult) {
          console.log(`Promotion move executed: ${selectedSquare} → ${square} (promoted to queen)`);
          setSelectedSquare(null);
          setValidMoves([]);
          updateGameState();
        } else {
          console.log(`Invalid promotion move: ${selectedSquare} → ${square}`);
        }
      } else {
        // Execute normal move
        const moveResult = gameStateManager.makeMove(selectedSquare, square);
        if (moveResult) {
          console.log(`Move executed: ${selectedSquare} → ${square}`);
          setSelectedSquare(null);
          setValidMoves([]);
          updateGameState();
        } else {
          console.log(`Invalid move: ${selectedSquare} → ${square}`);
          // Keep selection for retry
        }
      }
    } else {
      // Select new square - allow selection of any piece, even with no legal moves
      if (hasPieceAt(square)) {
        const moves = gameStateManager.getValidMoves(square);
        setSelectedSquare(square);
        setValidMoves(moves);
        console.log(`Selected ${square}, valid moves:`, moves);
      } else {
        // Clicked on empty square - deselect
        setSelectedSquare(null);
        setValidMoves([]);
        console.log(`Clicked empty square ${square} - deselecting`);
      }
    }
  };


  return (
    <div className="game-container" data-testid="game-container">
      <div className="game-main">
        <CanvasChessBoard 
          gameState={gameState}
          boardState={gameState?.board}
          onSquareClick={handleSquareClick}
          selectedSquare={selectedSquare}
          validMoves={validMoves}
          checkSquare={getCheckSquare()}
          showStartingPosition={false} // Use actual game state instead
        />
        <GameControls 
          gameStateManager={gameStateManager}
          onGameStateChange={updateGameState}
          currentGame={gameState}
        />
      </div>
      <MoveHistoryPanel 
        gameStateManager={gameStateManager}
        gameState={gameState}
      />
    </div>
  );
};

export default GameContainer;