/**
 * GameAnalysis Component - Simple PGN navigation interface
 */

import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { CanvasChessBoard } from './CanvasChessBoard';
import { StockfishEngine } from '../ai/StockfishEngine';
import BestMoveDisplay from './BestMoveDisplay';
import type { GameState, Move } from '../types/Chess';
import './GameAnalysis.css';

// Analysis depth configuration - can be adjusted as needed
const ANALYSIS_DEPTH = 20;

interface GameAnalysisProps {
  pgn: string;
  gameResult?: string; // Add optional game result from main game
  gameStatus?: string; // Add optional game status for specific ending reasons
  drawReason?: string; // Add optional draw reason for specific draw types
  onClose: () => void;
}

const GameAnalysis: React.FC<GameAnalysisProps> = ({ pgn, gameResult, gameStatus, drawReason, onClose }) => {
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
  const [bestMove, setBestMove] = useState<string | null>(null);
  const engineRef = useRef<StockfishEngine | null>(null);
  const [engineReady, setEngineReady] = useState<boolean>(false);
  const needsInitialAnalysis = useRef<boolean>(true);

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
      
      console.log('📋 PGN loaded, FENs calculated:', fens.length, 'positions');
      console.log('📋 First FEN (starting position):', fens[0]);
      
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
        engine.setEvaluationCallback((evaluation: number, depth: number, mateIn?: number, bestMoveUci?: string) => {
          console.log('📊 Received real-time evaluation:', evaluation, 'at depth:', depth, 'mate in:', mateIn);
          setEvaluation(evaluation);
          setCurrentDepth(depth);
          setMateInMoves(mateIn || null);
          setBestMove(bestMoveUci || null);
          
          // Store final evaluation when we reach target depth
          if (depth === ANALYSIS_DEPTH) {
            setFinalEvaluation(evaluation);
            setFinalMateInMoves(mateIn || null);
            console.log(`🏁 Final depth ${ANALYSIS_DEPTH} evaluation:`, evaluation, 'mate in:', mateIn);
          }
        });
        
        engineRef.current = engine;
        setEngineReady(true);
        console.log('🔧 Stockfish engine initialized for analysis');
        console.log('🔧 Engine ref set:', !!engineRef.current);
        console.log('🔧 Engine ready state set to true');
        
        // Mark that we need to trigger initial analysis when FENs are ready
        needsInitialAnalysis.current = true;
        console.log('🔧 needsInitialAnalysis set to true');
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
    console.log('📢 evaluatePosition called with FEN:', fen);
    console.log('📢 Engine available:', !!engineRef.current);
    
    if (!engineRef.current || !fen) {
      console.log('❌ Cannot evaluate - missing engine or FEN');
      return;
    }

    try {
      console.log('✅ Starting evaluation process');
      setIsEvaluating(true);
      
      // Reset evaluation state
      setEvaluation(null);
      setCurrentDepth(0);
      setFinalEvaluation(null);
      setMateInMoves(null);
      setFinalMateInMoves(null);
      setBestMove(null);
      
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

  // Trigger initial analysis when both engine and FENs are ready
  useEffect(() => {
    console.log('🔍 Checking auto-trigger conditions:', {
      engineReady,
      fensLength: moveFens.length,
      needsAnalysis: needsInitialAnalysis.current,
      currentMoveIndex
    });
    
    if (engineReady && moveFens.length > 0 && needsInitialAnalysis.current) {
      console.log('🎯 Both engine and FENs ready - triggering initial analysis of starting position');
      console.log('🎯 Starting position FEN:', moveFens[0]);
      needsInitialAnalysis.current = false; // Prevent multiple triggers
      
      // Use setTimeout to ensure all state updates are processed
      setTimeout(() => {
        console.log('🚀 Executing evaluatePosition for starting position');
        evaluatePosition(moveFens[0]);
      }, 50);
    }
  }, [engineReady, moveFens.length, currentMoveIndex]); // Use engineReady state instead of ref

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

  // Get game over state from current position
  const getGameOverState = (): { isGameOver: boolean; type: 'checkmate' | 'stalemate' | null; winner: 'white' | 'black' | null } => {
    if (chess.isCheckmate()) {
      return {
        isGameOver: true,
        type: 'checkmate',
        winner: chess.turn() === 'w' ? 'black' : 'white' // Current turn lost
      };
    }
    if (chess.isStalemate()) {
      return {
        isGameOver: true,
        type: 'stalemate',
        winner: null
      };
    }
    return { isGameOver: false, type: null, winner: null };
  };

  // Get specific game ending text for the evaluation bar
  const getGameEndingText = (): string | null => {
    const gameOverState = getGameOverState();
    
    // If we're at a position that's naturally game over (checkmate/stalemate)
    if (gameOverState.isGameOver) {
      if (gameOverState.type === 'checkmate') {
        return 'CHECKMATE';
      }
      if (gameOverState.type === 'stalemate') {
        return 'STALEMATE';
      }
    }
    
    // If game ended by resignation (passed from main game)
    if (gameStatus === 'resigned') {
      if (gameResult === 'white_wins' || gameResult === '1-0') {
        return 'BLACK RESIGNS';
      }
      if (gameResult === 'black_wins' || gameResult === '0-1') {
        return 'WHITE RESIGNS';
      }
    }
    
    // If game ended by draw (passed from main game)
    if (gameStatus === 'draw' || gameResult === 'draw' || gameResult === '1/2-1/2') {
      if (drawReason === 'threefold_repetition') {
        return '3-FOLD REPETITION';
      }
      if (drawReason === 'fifty_move_rule') {
        return '50-MOVE RULE';
      }
      if (drawReason === 'insufficient_material') {
        return 'INSUFFICIENT MATERIAL';
      }
      // Fallback for other draw types
      return 'DRAW';
    }
    
    return null;
  };

  // Calculate evaluation bar percentage (0-100, where 50 is equal position)
  const getEvaluationPercentage = (evaluation: number | null): number => {
    const gameOverState = getGameOverState();
    
    // Handle game over states
    if (gameOverState.isGameOver) {
      if (gameOverState.type === 'checkmate') {
        return gameOverState.winner === 'white' ? 100 : 0;
      }
      if (gameOverState.type === 'stalemate') {
        return 50; // Draw - equal bar
      }
    }
    
    if (evaluation === null) return 50;
    
    // For mate scores, fill entire bar
    if (Math.abs(evaluation) >= 999999) {
      return evaluation > 0 ? 100 : 0;
    }
    
    // Convert centipawns to percentage
    // Use a logarithmic scale for better visual representation
    // Cap at +/- 500 centipawns (5 pawns) for reasonable display
    const clampedEval = Math.max(-500, Math.min(500, evaluation));
    const percentage = 50 + (clampedEval / 500) * 45; // 5-95% range
    return Math.max(5, Math.min(95, percentage));
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
            <div className="evaluation-bar-container">
              <h4>Position Evaluation</h4>
              <div className="evaluation-bar">
                <div className="eval-bar-bg">
                  <div className="black-section"></div>
                  <div 
                    className="white-section" 
                    style={{ 
                      height: `${getEvaluationPercentage(evaluation)}%`,
                      minHeight: getEvaluationPercentage(evaluation) === 0 ? '0px' : '20px'
                    }}
                  >
                    {(() => {
                      const gameOverState = getGameOverState();
                      const evalPercentage = getEvaluationPercentage(evaluation);
                      
                      if (gameOverState.isGameOver) {
                        // Show game result in bottom eval text area
                        // Only show if white section has some height (not black mate)
                        if (evalPercentage > 0) {
                          if (gameOverState.type === 'checkmate') {
                            const resultText = gameOverState.winner === 'white' ? '1-0' : '0-1';
                            return (
                              <div className="eval-score-text game-result">
                                {resultText}
                              </div>
                            );
                          } else if (gameOverState.type === 'stalemate') {
                            return (
                              <div className="eval-score-text game-result stalemate-result">
                                <span className="fraction">
                                  <span className="numerator">1</span>
                                  <span className="denominator">2</span>
                                </span>
                                <span className="dash">-</span>
                                <span className="fraction">
                                  <span className="numerator">1</span>
                                  <span className="denominator">2</span>
                                </span>
                              </div>
                            );
                          }
                        }
                        return null;
                      } else {
                        return (
                          <div className="eval-score-text">
                            {isEvaluating && evaluation === null ? (
                              "..."
                            ) : (
                              formatEvaluation(evaluation, mateInMoves)
                            )}
                          </div>
                        );
                      }
                    })()}
                  </div>
                  {(() => {
                    const gameOverState = getGameOverState();
                    const isAtFinalPosition = currentMoveIndex === moves.length;
                    const gameEndingText = getGameEndingText();
                    
                    // If we're at the final position and have a specific ending reason, show that
                    if (isAtFinalPosition && gameEndingText && (gameResult !== 'ongoing' && gameResult !== '*')) {
                      return (
                        <div className="game-over-text-overlay">
                          {gameEndingText}
                        </div>
                      );
                    }
                    
                    // Otherwise, show current position analysis (checkmate/stalemate)
                    if (gameOverState.isGameOver) {
                      return (
                        <div className="game-over-text-overlay">
                          {gameOverState.type === 'checkmate' ? 'CHECKMATE' : 'STALEMATE'}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div className="eval-bar-midline"></div>
                  {(() => {
                    const gameOverState = getGameOverState();
                    const evalPercentage = getEvaluationPercentage(evaluation);
                    
                    // Show game result at bottom for black checkmate (when white section is 0%)
                    if (gameOverState.isGameOver && evalPercentage === 0) {
                      if (gameOverState.type === 'checkmate') {
                        return (
                          <div className="eval-score-text game-result black-mate-result">
                            0-1
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
              </div>
              <div className="evaluation-info">
                {isEvaluating ? (
                  <small>Analyzing depth: {currentDepth}/{ANALYSIS_DEPTH}</small>
                ) : (
                  <small>Depth: {currentDepth}</small>
                )}
              </div>
            </div>
            <BestMoveDisplay
              bestMoveUci={bestMove}
              currentFen={moveFens[currentMoveIndex] || null}
              className="analysis"
            />
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
              arrows={bestMove ? [{ 
                from: bestMove.substring(0, 2) as any, 
                to: bestMove.substring(2, 4) as any, 
                color: '#3498db' 
              }] : []}
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
              // Use the exact same result formatting as displayed in the main game interface
              if (gameResult && gameResult !== 'ongoing') {
                return (
                  <div className="game-status">
                    <div className="status-item result-display">
                      Result: {gameResult === 'white_wins' ? '1-0 (White Wins)' : 
                              gameResult === 'black_wins' ? '0-1 (Black Wins)' : 
                              gameResult === 'draw' ? '½-½ (Draw)' : 
                              gameResult}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameAnalysis;