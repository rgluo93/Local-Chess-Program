/**
 * GameContainer Component - Main game wrapper with GameState integration
 * Phase 2.2 TDD Cycle 4: GameStateManager Integration
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { CanvasChessBoard } from './CanvasChessBoard';
import GameControls from './GameControls';
import MoveHistoryPanel from './MoveHistoryPanel';
import GameAnalysis from './GameAnalysis';
import EvaluationBar from './EvaluationBar';
import BestMoveDisplay from './BestMoveDisplay';
import { GameModeModal } from './GameModeModal';
import { ChessGameOrchestrator } from '../orchestrator/ChessGameOrchestrator';
import { StockfishEngine } from '../ai/StockfishEngine';
import type { Square, GameState, PieceType, PieceColor, Move } from '../types/Chess';
import { GameMode } from '../ai/types/AITypes';
import './GameContainer.css';

const GameContainer: React.FC = () => {
  // Lazy initialization - orchestrator only created after mode selection
  const [orchestrator, setOrchestrator] = useState<ChessGameOrchestrator | null>(null);
  const [orchestratorReady, setOrchestratorReady] = useState(false);

  // UI state
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [aiMoveDestination, setAiMoveDestination] = useState<Square | null>(null);

  // AI state
  const [gameMode, setGameMode] = useState<GameMode | null>(null); // Start with no mode selected
  const [aiEngineStatus, setAIEngineStatus] = useState<'ready' | 'thinking' | 'error' | 'offline'>('offline');
  const [isAIThinking, setIsAIThinking] = useState(false);

  // Modal state
  const [showGameModeModal, setShowGameModeModal] = useState(true); // Show on first load
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Post-game analysis state
  const [showPostGameAnalysis, setShowPostGameAnalysis] = useState(false);
  const [analysisCurrentMoveIndex, setAnalysisCurrentMoveIndex] = useState(0);
  const [analysisGameState, setAnalysisGameState] = useState<GameState | null>(null);
  const [analysisMoves, setAnalysisMoves] = useState<Move[]>([]);
  const [analysisMoveFens, setAnalysisMoveFens] = useState<string[]>([]);
  const [chessForAnalysis] = useState(() => new Chess());
  
  // Evaluation state
  const [evaluation, setEvaluation] = useState<number | null>(null);
  const [currentDepth, setCurrentDepth] = useState<number>(0);
  const [mateInMoves, setMateInMoves] = useState<number | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [bestMove, setBestMove] = useState<string | null>(null);
  const engineRef = useRef<StockfishEngine | null>(null);
  const [engineReady, setEngineReady] = useState<boolean>(false);

  // Initialize Stockfish engine for post-game analysis
  useEffect(() => {
    const initEngine = async () => {
      try {
        const engine = new StockfishEngine();
        await engine.initialize();
        
        // Set up real-time evaluation callback
        engine.setEvaluationCallback((evaluation: number, depth: number, mateIn?: number, bestMoveUci?: string) => {
          setEvaluation(evaluation);
          setCurrentDepth(depth);
          setMateInMoves(mateIn || null);
          setBestMove(bestMoveUci || null);
        });
        
        engineRef.current = engine;
        setEngineReady(true);
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

  // Initialize orchestrator ONLY after game mode is selected
  const initializeOrchestrator = useCallback(async (selectedMode: GameMode) => {
    try {
      const newOrchestrator = new ChessGameOrchestrator();
      
      await newOrchestrator.initialize(undefined, selectedMode);
      
      setOrchestrator(newOrchestrator);
      setOrchestratorReady(true);
      setGameMode(selectedMode); // Update local state to match
      
      // Set AI engine status based on mode
      if (selectedMode === GameMode.HUMAN_VS_AI) {
        setAIEngineStatus('ready');
      }
      
      // Update game state
      const gameStateResponse = newOrchestrator.getGameState();
      setGameState(gameStateResponse.gameState);
      
      return newOrchestrator;
      
    } catch (error) {
      console.error('[GameContainer] Failed to initialize orchestrator:', error);
      setOrchestratorReady(false);
      return null;
    }
  }, []);

  // Enable post-game analysis
  const enablePostGameAnalysis = useCallback((gameState: GameState) => {
    try {
      if (!gameState.pgn) return;
      
      chessForAnalysis.reset();
      chessForAnalysis.loadPgn(gameState.pgn);
      
      const history = chessForAnalysis.history({ verbose: true });
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
        notation: move.san,
        timestamp: Date.now(),
        fen: chessForAnalysis.fen()
      }));
      
      // Calculate FEN for each position
      chessForAnalysis.reset();
      const fens: string[] = [];
      
      // Starting position FEN
      fens.push(chessForAnalysis.fen());
      
      // FEN after each move
      for (const move of history) {
        chessForAnalysis.move(move.san);
        fens.push(chessForAnalysis.fen());
      }
      
      setAnalysisMoves(gameHistory);
      setAnalysisMoveFens(fens);
      
      // Go to final position
      setAnalysisCurrentMoveIndex(gameHistory.length);
      updateAnalysisGameState(gameHistory.length, gameHistory);
      
      setShowPostGameAnalysis(true);
      
      // Evaluate final position
      if (engineReady && engineRef.current && fens.length > 0) {
        evaluatePosition(fens[fens.length - 1]);
      }
    } catch (error) {
      console.error('Error enabling post-game analysis:', error);
    }
  }, [engineReady, chessForAnalysis]);

  // Evaluate specific position with Stockfish
  const evaluatePosition = async (fen: string) => {
    if (!engineRef.current || !fen) return;

    try {
      setIsEvaluating(true);
      
      // Reset evaluation state
      setEvaluation(null);
      setCurrentDepth(0);
      setMateInMoves(null);
      setBestMove(null);
      
      await engineRef.current.setPosition(fen);
      await engineRef.current.evaluatePosition(20);
      
    } catch (error) {
      console.error('Error evaluating position:', error);
      setEvaluation(null);
      setCurrentDepth(0);
      setMateInMoves(null);
      setBestMove(null);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Update analysis game state based on move index
  const updateAnalysisGameState = (moveIndex: number, moves: Move[]) => {
    chessForAnalysis.reset();
    for (let i = 0; i < moveIndex; i++) {
      chessForAnalysis.move(moves[i].notation);
    }
    
    const board = chessForAnalysis.board();
    const squares = board.map(row => 
      row.map(piece => piece ? {
        type: (piece.type === 'p' ? 'pawn' :
              piece.type === 'r' ? 'rook' :
              piece.type === 'n' ? 'knight' :
              piece.type === 'b' ? 'bishop' :
              piece.type === 'q' ? 'queen' :
              piece.type === 'k' ? 'king' : 'pawn') as PieceType,
        color: (piece.color === 'w' ? 'white' : 'black') as PieceColor,
        hasMoved: false
      } : null)
    );

    const newGameState: GameState = {
      board: { squares },
      currentPlayer: chessForAnalysis.turn() === 'w' ? 'white' : 'black',
      status: chessForAnalysis.isCheckmate() ? 'checkmate' : 
              chessForAnalysis.isStalemate() ? 'stalemate' : 
              chessForAnalysis.isDraw() ? 'draw' :
              chessForAnalysis.inCheck() ? 'check' : 'playing',
      moves: moves.slice(0, moveIndex),
      fen: chessForAnalysis.fen(),
      pgn: chessForAnalysis.pgn(),
      result: chessForAnalysis.isGameOver() ? 
              (chessForAnalysis.isCheckmate() ? 
                (chessForAnalysis.turn() === 'w' ? 'black_wins' : 'white_wins') : 'draw') : 'ongoing',
      moveHistory: moves.slice(0, moveIndex).map(move => move.notation)
    };

    setAnalysisGameState(newGameState);
  };

  // Navigate to specific move in analysis
  const goToAnalysisMove = (moveIndex: number) => {
    if (moveIndex < 0 || moveIndex > analysisMoves.length) return;
    
    setAnalysisCurrentMoveIndex(moveIndex);
    updateAnalysisGameState(moveIndex, analysisMoves);
    
    // Evaluate the new position
    if (analysisMoveFens[moveIndex] && engineReady && engineRef.current) {
      evaluatePosition(analysisMoveFens[moveIndex]);
    }
  };

  // Handle keyboard navigation for post-game analysis
  useEffect(() => {
    if (!showPostGameAnalysis) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        goToAnalysisMove(analysisCurrentMoveIndex - 1);
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        goToAnalysisMove(analysisCurrentMoveIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPostGameAnalysis, analysisCurrentMoveIndex, analysisMoves.length]);

  // Update game state when it changes
  const updateGameState = useCallback(() => {
    if (orchestratorReady && orchestrator) {
      const gameStateResponse = orchestrator.getGameState();
      setGameState(gameStateResponse.gameState);
      
      // Check if game just ended and enable post-game analysis
      const newGameState = gameStateResponse.gameState;
      const isGameOver = newGameState && ['checkmate', 'stalemate', 'draw', 'resigned'].includes(newGameState.status);
      
      if (isGameOver && !showPostGameAnalysis) {
        enablePostGameAnalysis(newGameState);
      }
    }
  }, [orchestrator, orchestratorReady, showPostGameAnalysis, enablePostGameAnalysis]);

  // Handle game mode changes
  const handleGameModeChange = useCallback(async (newMode: GameMode) => {
    // Close modal immediately to prevent duplicate calls
    setShowGameModeModal(false);
    
    // Always allow initialization/re-initialization since handleNewGameClick cleans up properly
    
    // Initialize new orchestrator with the selected mode
    const targetOrchestrator = await initializeOrchestrator(newMode);
    
    if (!targetOrchestrator) {
      setAIEngineStatus('error');
      return;
    }
  }, [initializeOrchestrator]);

  // Handle new game button click
  const handleNewGameClick = useCallback(() => {
    // Clean up existing orchestrator and reset all state for a fresh start
    if (orchestrator) {
      // Note: We don't call orchestrator.dispose() here as it doesn't exist
      // The orchestrator will be garbage collected
    }
    
    // Reset all orchestrator-related state
    setOrchestrator(null);
    setOrchestratorReady(false);
    setGameMode(null);
    setGameState(null);
    setAIEngineStatus('offline');
    setIsAIThinking(false);
    
    // Clear UI state
    setSelectedSquare(null);
    setValidMoves([]);
    setAiMoveDestination(null);
    
    // Clear post-game analysis state
    setShowPostGameAnalysis(false);
    setAnalysisCurrentMoveIndex(0);
    setAnalysisGameState(null);
    setAnalysisMoves([]);
    setAnalysisMoveFens([]);
    setEvaluation(null);
    setCurrentDepth(0);
    setMateInMoves(null);
    setIsEvaluating(false);
    
    // Show modal to select new game mode
    setShowGameModeModal(true);
  }, [orchestrator]);

  // Handle resign button click
  const handleResign = useCallback(async () => {
    if (!orchestratorReady || !orchestrator) {
      return;
    }
    
    try {
      // In human vs AI mode, always resign the human player (white)
      // In human vs human mode, resign the current player
      let resigningPlayer: 'white' | 'black';
      if (gameMode === GameMode.HUMAN_VS_AI) {
        resigningPlayer = 'white'; // Human always plays white
      } else {
        // Human vs Human mode: resign whoever's turn it is
        resigningPlayer = gameState?.currentPlayer === 'white' ? 'white' : 'black';
      }
      
      const resignResult = await orchestrator.resignGame(resigningPlayer);
      
      if (resignResult.success) {
        updateGameState();
      }
    } catch (error) {
      console.error('Error resigning game:', error);
    }
  }, [orchestrator, orchestratorReady, updateGameState, gameMode, gameState]);

  // Handle analyze button click
  const handleAnalyze = useCallback(() => {
    setShowAnalysis(true);
  }, []);


  // Trigger AI move after human move in AI mode
  useEffect(() => {
    const triggerAIMove = async () => {
      if (gameMode === GameMode.HUMAN_VS_AI && gameState && 
          gameState.currentPlayer === 'black' && 
          (gameState.status === 'playing' || gameState.status === 'check')) {
        try {
          setIsAIThinking(true);
          setAIEngineStatus('thinking');
          
          // Get current game state before AI move
          const preAIMoveState = orchestrator?.getGameState();
          const moveCountBefore = preAIMoveState?.gameState?.moves?.length || 0;
          
          await orchestrator?.triggerAIMove();
          setIsAIThinking(false);
          setAIEngineStatus('ready');
          
          // Update game state and capture AI move
          updateGameState();
          
          // Get the last move to highlight AI's destination
          const postAIMoveState = orchestrator?.getGameState();
          const newMoves = postAIMoveState?.gameState?.moves || [];
          
          if (newMoves.length > moveCountBefore) {
            const lastMove = newMoves[newMoves.length - 1];
            if (lastMove && lastMove.to) {
              setAiMoveDestination(lastMove.to);
            }
          }
          
        } catch (error) {
          console.error('AI move failed:', error);
          setAIEngineStatus('error');
          setIsAIThinking(false);
        }
      }
    };

    triggerAIMove();
  }, [gameState?.moves?.length, gameMode, orchestrator, gameState]);

  // Helper function to check if there's a piece at a square
  const hasPieceAt = (square: Square): boolean => {
    if (!gameState?.board) return false;
    
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // a=0, b=1, etc.
    const rank = 8 - parseInt(square[1]); // 8=0, 7=1, etc.
    
    return gameState.board.squares[rank][file] !== null;
  };

  // Helper function to get the square of the king in check (if any)
  const getCheckSquare = (): Square | null => {
    if (!orchestratorReady || !orchestrator || !gameState) {
      return null;
    }
    
    if (gameState.status === 'check') {
      try {
        // Get the king position from the orchestrator
        const kingPosition = orchestrator.getKingPosition();
        return kingPosition || null;
      } catch (error) {
        console.warn('Could not get king position:', error);
        return null;
      }
    }
    return null;
  };

  // Handle square selection and moves (including promotion)
  const handleSquareClick = (square: Square) => {
    handleSquareClickAsync(square).catch(error => {
      console.error('Error handling square click:', error);
    });
  };

  const handleSquareClickAsync = async (square: Square) => {
    console.log('Clicked square:', square);
    
    // Clear AI move highlight when user clicks any square
    setAiMoveDestination(null);
    
    // Prevent moves if orchestrator is not ready
    if (!orchestratorReady || !orchestrator) {
      console.log('Orchestrator not ready, moves not allowed');
      return;
    }
    
    // Prevent moves if game is over or AI is thinking
    const isGameOver = gameState && ['checkmate', 'stalemate', 'draw', 'resigned'].includes(gameState.status);
    
    if (isGameOver || isAIThinking) {
      console.log('Game is over or AI is thinking, moves not allowed');
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // In AI mode, only allow moves when it's the human player's turn (white)
    if (gameMode === GameMode.HUMAN_VS_AI && gameState?.currentPlayer === 'black') {
      console.log('AI turn, human moves not allowed');
      return;
    }
    
    if (selectedSquare === square) {
      // Deselect if clicking same square
      setSelectedSquare(null);
      setValidMoves([]);
    } else if (selectedSquare && validMoves.includes(square)) {
      // Check if this is a promotion move
      const fromFile = selectedSquare.charCodeAt(0) - 'a'.charCodeAt(0);
      const fromRank = 8 - parseInt(selectedSquare[1]);
      const toRank = parseInt(square[1]);
      
      const piece = gameState?.board.squares[fromRank][fromFile];
      const isPromotion = piece?.type === 'pawn' && 
        ((piece.color === 'white' && toRank === 8) || (piece.color === 'black' && toRank === 1));

      if (isPromotion) {
        // Handle promotion move through orchestrator
        try {
          const moveRequest = { from: selectedSquare, to: square, promotion: 'queen' as PieceType };
          console.log(`Attempting promotion move: ${selectedSquare} → ${square}`);
          const moveResult = await orchestrator.makeMove(moveRequest);
          console.log(`Promotion move result:`, moveResult);
          if (moveResult.success) {
            console.log(`Promotion move executed: ${selectedSquare} → ${square} (promoted to queen)`);
            setSelectedSquare(null);
            setValidMoves([]);
            updateGameState();
          } else {
            console.log(`Promotion move failed:`, moveResult.error);
          }
        } catch (error) {
          console.log(`Invalid promotion move: ${selectedSquare} → ${square}`, error);
        }
      } else {
        // Execute normal move through orchestrator
        try {
          const moveRequest = { from: selectedSquare, to: square };
          console.log(`Attempting move: ${selectedSquare} → ${square}`);
          const moveResult = await orchestrator.makeMove(moveRequest);
          console.log(`Move result:`, moveResult);
          if (moveResult.success) {
            console.log(`Move executed: ${selectedSquare} → ${square}`);
            setSelectedSquare(null);
            setValidMoves([]);
            updateGameState();
          } else {
            console.log(`Move failed:`, moveResult.error);
          }
        } catch (error) {
          console.log(`Invalid move: ${selectedSquare} → ${square}`, error);
          // Keep selection for retry
        }
      }
    } else {
      // Select new square - allow selection of any piece, even with no legal moves
      if (hasPieceAt(square)) {
        // Get valid moves through the orchestrator
        try {
          const moves = orchestrator.getValidMoves(square);
          setSelectedSquare(square);
          setValidMoves(moves);
          console.log(`Selected ${square}, valid moves:`, moves);
        } catch (error) {
          console.log('Could not get valid moves:', error);
          setSelectedSquare(square);
          setValidMoves([]);
        }
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
        <div className="board-container" style={{ position: 'relative' }}>
          {showPostGameAnalysis && (
            <div className="post-game-evaluation-section">
              <EvaluationBar
                evaluation={evaluation}
                mateInMoves={mateInMoves}
                currentDepth={currentDepth}
                isEvaluating={isEvaluating}
                gameState={analysisGameState}
                gameResult={gameState?.result}
                gameStatus={gameState?.status}
                drawReason={orchestratorReady && orchestrator ? orchestrator.getDrawReason() || undefined : undefined}
                isAtFinalPosition={analysisCurrentMoveIndex === analysisMoves.length}
              />
              <BestMoveDisplay
                bestMoveUci={bestMove}
                currentFen={analysisGameState?.fen || null}
                className="post-game"
              />
            </div>
          )}
          <CanvasChessBoard 
            gameState={showPostGameAnalysis ? analysisGameState : gameState}
            boardState={showPostGameAnalysis ? analysisGameState?.board : gameState?.board}
            onSquareClick={showPostGameAnalysis ? () => {} : handleSquareClick}
            selectedSquare={showPostGameAnalysis ? null : selectedSquare}
            validMoves={showPostGameAnalysis ? [] : validMoves}
            checkSquare={showPostGameAnalysis ? null : getCheckSquare()}
            aiMoveSquare={showPostGameAnalysis ? null : aiMoveDestination}
            showStartingPosition={false} // Use actual game state instead
            arrows={showPostGameAnalysis && bestMove ? [{ 
              from: bestMove.substring(0, 2) as any, 
              to: bestMove.substring(2, 4) as any, 
              color: '#3498db' 
            }] : []}
          />
        </div>
        <GameControls 
          currentGame={gameState}
          onNewGameClick={handleNewGameClick}
          onResign={handleResign}
          onAnalyze={handleAnalyze}
          isAIThinking={isAIThinking}
          gameMode={gameMode}
          aiEngineStatus={aiEngineStatus}
        />
      </div>
      <MoveHistoryPanel 
        gameState={gameState}
        isPostGameAnalysis={showPostGameAnalysis}
        currentMoveIndex={analysisCurrentMoveIndex}
        onMoveClick={showPostGameAnalysis ? goToAnalysisMove : undefined}
      />
      
      <GameModeModal
        isOpen={showGameModeModal}
        onModeSelect={handleGameModeChange}
        onClose={() => setShowGameModeModal(false)}
        aiEngineStatus={aiEngineStatus}
      />
      
      {showAnalysis && gameState && (
        <GameAnalysis
          pgn={gameState.pgn || ''}
          gameResult={gameState.result}
          gameStatus={gameState.status}
          drawReason={orchestratorReady && orchestrator ? orchestrator.getDrawReason() : undefined}
          onClose={() => setShowAnalysis(false)}
        />
      )}
      
      {!orchestratorReady && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          padding: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #ccc',
          borderRadius: '4px',
          zIndex: 1001
        }}>
          Initializing game system...
        </div>
      )}
    </div>
  );
};

export default GameContainer;