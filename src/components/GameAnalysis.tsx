/**
 * GameAnalysis Component - Simple PGN navigation interface
 */

import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { CanvasChessBoard } from './CanvasChessBoard';
import type { GameState, Move } from '../types/Chess';
import './GameAnalysis.css';

interface GameAnalysisProps {
  pgn: string;
  onClose: () => void;
}

const GameAnalysis: React.FC<GameAnalysisProps> = ({ pgn, onClose }) => {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [chess] = useState(() => new Chess());
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);

  // Initialize chess game from PGN
  useEffect(() => {
    try {
      chess.reset();
      chess.loadPgn(pgn);
      
      const history = chess.history({ verbose: true });
      const gameHistory = history.map((move: any): Move => ({
        from: move.from,
        to: move.to,
        piece: move.piece === 'p' ? 'pawn' :
               move.piece === 'r' ? 'rook' :
               move.piece === 'n' ? 'knight' :
               move.piece === 'b' ? 'bishop' :
               move.piece === 'q' ? 'queen' :
               move.piece === 'k' ? 'king' : 'pawn',
        color: move.color === 'w' ? 'white' : 'black',
        captured: move.captured ? (
          move.captured === 'p' ? 'pawn' :
          move.captured === 'r' ? 'rook' :
          move.captured === 'n' ? 'knight' :
          move.captured === 'b' ? 'bishop' :
          move.captured === 'q' ? 'queen' :
          move.captured === 'k' ? 'king' : 'pawn'
        ) : undefined,
        promotion: move.promotion ? (
          move.promotion === 'q' ? 'queen' :
          move.promotion === 'r' ? 'rook' :
          move.promotion === 'b' ? 'bishop' :
          move.promotion === 'n' ? 'knight' : 'queen'
        ) : undefined,
        san: move.san,
        notation: move.san
      }));
      
      setMoves(gameHistory);
      
      // Set to starting position
      chess.reset();
      updateGameState();
    } catch (error) {
      console.error('Error loading PGN:', error);
    }
  }, [pgn, chess]);

  // Convert chess.js board state to our GameState format
  const updateGameState = () => {
    const board = chess.board();
    console.log('Chess.js board:', board); // Debug log
    
    const squares = board.map(row => 
      row.map(piece => piece ? {
        type: piece.type === 'p' ? 'pawn' :
              piece.type === 'r' ? 'rook' :
              piece.type === 'n' ? 'knight' :
              piece.type === 'b' ? 'bishop' :
              piece.type === 'q' ? 'queen' :
              piece.type === 'k' ? 'king' : 'pawn',
        color: piece.color === 'w' ? 'white' : 'black',
        hasMoved: false
      } : null)
    );

    console.log('Converted squares:', squares); // Debug log

    const newGameState: GameState = {
      board: { squares },
      currentPlayer: chess.turn() === 'w' ? 'white' : 'black',
      status: chess.isCheckmate() ? 'checkmate' : 
              chess.isStalemate() ? 'stalemate' : 
              chess.isDraw() ? 'draw' :
              chess.inCheck() ? 'check' : 'playing',
      moves: moves.slice(0, currentMoveIndex),
      fen: chess.fen(),
      pgn: chess.pgn(),
      result: chess.isGameOver() ? 
              (chess.isCheckmate() ? 
                (chess.turn() === 'w' ? 'black_wins' : 'white_wins') : 'draw') : 'ongoing',
      moveHistory: moves.slice(0, currentMoveIndex).map(move => move.notation)
    };

    console.log('New game state:', newGameState); // Debug log
    setGameState(newGameState);
  };

  // Navigate to specific move
  const goToMove = (moveIndex: number) => {
    if (moveIndex < 0 || moveIndex > moves.length) return;
    
    console.log(`Going to move ${moveIndex} of ${moves.length}`); // Debug log
    
    chess.reset();
    for (let i = 0; i < moveIndex; i++) {
      console.log(`Playing move ${i + 1}: ${moves[i].san}`); // Debug log
      chess.move(moves[i].san);
    }
    
    setCurrentMoveIndex(moveIndex);
    updateGameState();
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        goToMove(currentMoveIndex - 1);
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        goToMove(currentMoveIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMoveIndex, moves.length]);


  return (
    <div className="game-analysis-overlay">
      <div className="game-analysis-container">
        <div className="analysis-header">
          <h2>Game Analysis</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="analysis-content">
          <div className="board-section">
            <CanvasChessBoard 
              gameState={gameState}
              boardState={gameState?.board}
              onSquareClick={() => {}} // No interaction in analysis mode
              selectedSquare={null}
              validMoves={[]}
              checkSquare={null}
              aiMoveSquare={null}
              showStartingPosition={false}
            />
          </div>
          
          <div className="move-history-section">
            <h3>Move History</h3>
            <div className="moves-list">
              <div 
                className={`move-pair ${currentMoveIndex === 0 ? 'current' : ''}`}
                onClick={() => goToMove(0)}
              >
                <span className="move-number">—</span>
                <span className="starting-position">Starting position</span>
              </div>
              {(() => {
                const pairedMoves = [];
                for (let i = 0; i < moves.length; i += 2) {
                  const whiteMove = moves[i];
                  const blackMove = moves[i + 1];
                  const moveNumber = Math.floor(i / 2) + 1;
                  
                  pairedMoves.push(
                    <div key={moveNumber} className="move-pair">
                      <span className="move-number">{moveNumber}.</span>
                      <span 
                        className={`white-move ${currentMoveIndex === i + 1 ? 'current' : ''}`}
                        onClick={() => goToMove(i + 1)}
                      >
                        {whiteMove.notation}
                      </span>
                      {blackMove && (
                        <span 
                          className={`black-move ${currentMoveIndex === i + 2 ? 'current' : ''}`}
                          onClick={() => goToMove(i + 2)}
                        >
                          {blackMove.notation}
                        </span>
                      )}
                    </div>
                  );
                }
                return pairedMoves;
              })()}
            </div>
            {/* Always show result if game has ended */}
            {(() => {
              // Check if we have moves and determine final result
              if (moves.length === 0) return null;
              
              // Create temp chess instance to get final result
              const tempChess = new Chess();
              try {
                tempChess.loadPgn(pgn);
                let resultText = null;
                
                if (tempChess.isCheckmate()) {
                  resultText = tempChess.turn() === 'w' ? '0-1 (Black Wins)' : '1-0 (White Wins)';
                } else if (tempChess.isStalemate()) {
                  resultText = '½-½ (Stalemate)';
                } else if (tempChess.isDraw()) {
                  resultText = '½-½ (Draw)';
                } else if (tempChess.isGameOver()) {
                  resultText = '½-½ (Draw)';
                }
                
                return resultText ? (
                  <div className="game-status">
                    <div className="status-item result-display">
                      Result: {resultText}
                    </div>
                  </div>
                ) : null;
              } catch (error) {
                return null;
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameAnalysis;