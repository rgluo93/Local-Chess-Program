/**
 * GameAnalysis Component - Simple PGN navigation interface
 */

import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { CanvasChessBoard } from './CanvasChessBoard';
import { StockfishEngine } from '../ai/StockfishEngine';
import type { GameState, Move } from '../types/Chess';
import './GameAnalysis.css';

// Analysis depth configuration - can be adjusted as needed
const ANALYSIS_DEPTH = 20;

interface GameAnalysisProps {
  pgn: string;
  onClose: () => void;
}

const GameAnalysis: React.FC<GameAnalysisProps> = ({ pgn, onClose }) => {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [chess] = useState(() => new Chess());
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [evaluation, setEvaluation] = useState<number | null>(null);
  const [currentDepth, setCurrentDepth] = useState<number>(0);
  const [finalEvaluation, setFinalEvaluation] = useState<number | null>(null);
  const [mateInMoves, setMateInMoves] = useState<number | null>(null);
  const [finalMateInMoves, setFinalMateInMoves] = useState<number | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [moveFens, setMoveFens] = useState<string[]>([]);
  const engineRef = useRef<StockfishEngine | null>(null);

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
      
      // Calculate FEN for each position
      chess.reset();
      const fens: string[] = [];
      
      // Starting position FEN
      fens.push(chess.fen());
      
      // FEN after each move
      for (const move of history) {
        chess.move(move.san);
        fens.push(chess.fen());
      }
      
      setMoves(gameHistory);
      setMoveFens(fens);
      
      // Set to starting position
      chess.reset();
      updateGameState();
    } catch (error) {
      console.error('Error loading PGN:', error);
    }
  }, [pgn, chess]);

  // Initialize Stockfish engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        const engine = new StockfishEngine();
        await engine.initialize();
        
        // Set up real-time evaluation callback
        engine.setEvaluationCallback((evaluation: number, depth: number, mateIn?: number) => {
          console.log('📊 Received real-time evaluation:', evaluation, 'at depth:', depth, 'mate in:', mateIn);
          setEvaluation(evaluation);
          setCurrentDepth(depth);
          setMateInMoves(mateIn || null);
          
          // Store final evaluation when we reach target depth
          if (depth === ANALYSIS_DEPTH) {
            setFinalEvaluation(evaluation);
            setFinalMateInMoves(mateIn || null);
            console.log(`🏁 Final depth ${ANALYSIS_DEPTH} evaluation:`, evaluation, 'mate in:', mateIn);
          }
        });
        
        engineRef.current = engine;
        console.log('Stockfish engine initialized for analysis');
      } catch (error) {
        console.error('Failed to initialize Stockfish engine:', error);
      }
    };

    initEngine();

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.terminate();
        engineRef.current = null;
      }
    };
  }, []);

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

  // Evaluate specific position with Stockfish at depth 20
  const evaluatePosition = async (fen: string) => {
    if (!engineRef.current || !fen) return;

    try {
      setIsEvaluating(true);
      
      // Reset evaluation state
      setEvaluation(null);
      setCurrentDepth(0);
      setFinalEvaluation(null);
      setMateInMoves(null);
      setFinalMateInMoves(null);
      
      console.log(`Evaluating position at depth ${ANALYSIS_DEPTH}:`, fen);
      await engineRef.current.setPosition(fen);
      
      // Start evaluation - results will come via callback in real-time
      await engineRef.current.evaluatePosition(ANALYSIS_DEPTH);
      
    } catch (error) {
      console.error('Error evaluating position:', error);
      setEvaluation(null);
      setCurrentDepth(0);
      setFinalEvaluation(null);
      setMateInMoves(null);
      setFinalMateInMoves(null);
    } finally {
      setIsEvaluating(false);
    }
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
    
    // Evaluate the new position using the specific FEN
    if (moveFens[moveIndex]) {
      evaluatePosition(moveFens[moveIndex]);
    }
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

  // Evaluate initial position when engine is ready
  useEffect(() => {
    if (engineRef.current && moveFens.length > 0) {
      // Evaluate starting position
      evaluatePosition(moveFens[0]);
    }
  }, [engineRef.current, moveFens.length]); // Evaluate when engine is ready and FENs are loaded

  // Format evaluation for display
  const formatEvaluation = (evaluation: number | null, mateIn: number | null = null): string => {
    console.log('Formatting evaluation:', evaluation, 'mate in:', mateIn); // Debug
    if (evaluation === null) return "...";
    
    // Check for mate scores
    if (mateIn !== null) {
      // This is a mate score - display as M# format
      return `M${mateIn}`;
    } else if (Math.abs(evaluation) >= 999999) {
      // Fallback for mate scores without mateIn info
      return 'M#';
    } else {
      // Regular centipawn evaluation
      const pawns = (evaluation / 100).toFixed(2);
      const result = evaluation >= 0 ? `+${pawns}` : pawns.toString();
      console.log('Formatted result:', result); // Debug
      return result;
    }
  };

  return (
    <div className="game-analysis-overlay">
      <div className="game-analysis-container">
        <div className="analysis-header">
          <h2>Game Analysis</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="analysis-content">
          <div className="evaluation-section">
            <div className="evaluation-box">
              <h4>Position Evaluation</h4>
              <div className="evaluation-score">
                {isEvaluating && evaluation === null ? (
                  <span className="evaluating">Starting...</span>
                ) : (
                  <span className={`score ${evaluation !== null && evaluation > 0 ? 'positive' : evaluation !== null && evaluation < 0 ? 'negative' : ''}`}>
                    {formatEvaluation(evaluation, mateInMoves)}
                  </span>
                )}
              </div>
              <div className="evaluation-info">
                {isEvaluating ? (
                  <small>Analyzing depth: {currentDepth}/{ANALYSIS_DEPTH}</small>
                ) : (
                  <small>Depth: {currentDepth}</small>
                )}
                {finalEvaluation !== null && (
                  <div className="final-eval-indicator">
                    <small>✓ Final: {formatEvaluation(finalEvaluation, finalMateInMoves)}</small>
                  </div>
                )}
              </div>
            </div>
          </div>
          
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