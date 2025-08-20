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
  
  // Evaluation state (for post-game analysis)
  const [evaluation, setEvaluation] = useState<number | null>(null);
  const [currentDepth, setCurrentDepth] = useState<number>(0);
  const [mateInMoves, setMateInMoves] = useState<number | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [principalVariation, setPrincipalVariation] = useState<string[]>([]);
  const engineRef = useRef<StockfishEngine | null>(null);
  const [engineReady, setEngineReady] = useState<boolean>(false);

  // Sandbox analysis state
  const [sandboxEvaluation, setSandboxEvaluation] = useState<number | null>(null);
  const [sandboxCurrentDepth, setSandboxCurrentDepth] = useState<number>(0);
  const [sandboxMateInMoves, setSandboxMateInMoves] = useState<number | null>(null);
  const [sandboxIsEvaluating, setSandboxIsEvaluating] = useState<boolean>(false);
  const [sandboxBestMove, setSandboxBestMove] = useState<string | null>(null);
  const [sandboxPrincipalVariation, setSandboxPrincipalVariation] = useState<string[]>([]);
  const sandboxEngineRef = useRef<StockfishEngine | null>(null);
  const [sandboxEngineReady, setSandboxEngineReady] = useState<boolean>(false);

  // Sandbox navigation state
  const [sandboxCurrentMoveIndex, setSandboxCurrentMoveIndex] = useState<number>(0);
  const [sandboxIsNavigating, setSandboxIsNavigating] = useState<boolean>(false);
  const [sandboxNavigationFens, setSandboxNavigationFens] = useState<string[]>([]);
  const [sandboxNavigationGameState, setSandboxNavigationGameState] = useState<GameState | null>(null);
  const [sandboxChess] = useState(() => new Chess());

  // Initialize Stockfish engine for post-game analysis
  useEffect(() => {
    const initEngine = async () => {
      try {
        const engine = new StockfishEngine();
        await engine.initialize();
        
        // Set up real-time evaluation callback
        engine.setEvaluationCallback((evaluation: number, depth: number, mateIn?: number, bestMoveUci?: string, pv?: string[]) => {
          setEvaluation(evaluation);
          setCurrentDepth(depth);
          setMateInMoves(mateIn || null);
          setBestMove(bestMoveUci || null);
          setPrincipalVariation(pv || []);
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

  // Initialize Stockfish engine for sandbox mode analysis
  useEffect(() => {
    if (gameMode === GameMode.SANDBOX) {
      const initSandboxEngine = async () => {
        try {
          const engine = new StockfishEngine();
          await engine.initialize();
          
          // Set up real-time evaluation callback for sandbox
          engine.setEvaluationCallback((evaluation: number, depth: number, mateIn?: number, bestMoveUci?: string, pv?: string[]) => {
            setSandboxEvaluation(evaluation);
            setSandboxCurrentDepth(depth);
            setSandboxMateInMoves(mateIn || null);
            setSandboxBestMove(bestMoveUci || null);
            setSandboxPrincipalVariation(pv || []);
          });
          
          sandboxEngineRef.current = engine;
          setSandboxEngineReady(true);
        } catch (error) {
          console.error('Failed to initialize sandbox Stockfish engine:', error);
        }
      };

      initSandboxEngine();
    }

    // Cleanup sandbox engine when leaving sandbox mode or unmounting
    return () => {
      if (sandboxEngineRef.current) {
        sandboxEngineRef.current.terminate();
        sandboxEngineRef.current = null;
        setSandboxEngineReady(false);
      }
    };
  }, [gameMode]);

  // Sandbox navigation functions (copied from GameAnalysis pattern)
  const updateSandboxGameState = (moveIndex: number) => {
    try {
      sandboxChess.reset();
      
      // Play moves up to the target index
      if (gameState?.moves) {
        for (let i = 0; i < moveIndex; i++) {
          if (i < gameState.moves.length) {
            sandboxChess.move(gameState.moves[i].notation);
          }
        }
      }
      
      // Convert chess.js board state to our GameState format
      const board = sandboxChess.board();
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

      const newGameState: GameState = {
        board: { squares },
        currentPlayer: sandboxChess.turn() === 'w' ? 'white' : 'black',
        status: sandboxChess.isCheckmate() ? 'checkmate' : 
                sandboxChess.isStalemate() ? 'stalemate' : 
                sandboxChess.isDraw() ? 'draw' :
                sandboxChess.inCheck() ? 'check' : 'playing',
        moves: gameState?.moves?.slice(0, moveIndex) || [],
        fen: sandboxChess.fen(),
        pgn: sandboxChess.pgn(),
        result: sandboxChess.isGameOver() ? 
                (sandboxChess.isCheckmate() ? 
                  (sandboxChess.turn() === 'w' ? 'black_wins' : 'white_wins') : 'draw') : 'ongoing',
        moveHistory: gameState?.moves?.slice(0, moveIndex).map(move => move.notation) || []
      };

      setSandboxNavigationGameState(newGameState);
    } catch (error) {
      console.error('Error updating sandbox game state:', error);
    }
  };

  const goToSandboxMove = (moveIndex: number) => {
    if (!gameState?.moves) return;
    
    const maxIndex = gameState.moves.length;
    const clampedIndex = Math.max(0, Math.min(maxIndex, moveIndex));
    
    setSandboxCurrentMoveIndex(clampedIndex);
    setSandboxIsNavigating(clampedIndex !== maxIndex);
    
    updateSandboxGameState(clampedIndex);
    
    // Evaluate the position at this move index
    if (sandboxNavigationFens[clampedIndex]) {
      setTimeout(() => {
        evaluateSandboxPosition(sandboxNavigationFens[clampedIndex]);
      }, 50);
    }
  };

  // Evaluate sandbox position using the same pattern as GameAnalysis
  const evaluateSandboxPosition = async (fen: string) => {
    if (!sandboxEngineRef.current || !fen) {
      return;
    }

    try {
      setSandboxIsEvaluating(true);
      
      // Reset evaluation state (following GameAnalysis pattern)
      setSandboxEvaluation(null);
      setSandboxCurrentDepth(0);
      setSandboxMateInMoves(null);
      setSandboxBestMove(null);
      setSandboxPrincipalVariation([]);
      
      // Set position first, then evaluate (crucial step from GameAnalysis)
      await sandboxEngineRef.current.setPosition(fen);
      await sandboxEngineRef.current.evaluatePosition(20);
      
    } catch (error) {
      console.error('Error evaluating sandbox position:', error);
      setSandboxEvaluation(null);
      setSandboxCurrentDepth(0);
      setSandboxMateInMoves(null);
      setSandboxBestMove(null);
      setSandboxPrincipalVariation([]);
    } finally {
      setSandboxIsEvaluating(false);
    }
  };

  // Trigger sandbox analysis when position changes
  useEffect(() => {
    if (gameMode === GameMode.SANDBOX && sandboxEngineReady) {
      const currentFen = sandboxIsNavigating ? sandboxNavigationGameState?.fen : gameState?.fen;
      if (currentFen) {
        // Use setTimeout to ensure all state updates are processed (following GameAnalysis pattern)
        setTimeout(() => {
          evaluateSandboxPosition(currentFen);
        }, 50);
      }
    }
  }, [gameMode, sandboxEngineReady, gameState?.fen, sandboxIsNavigating, sandboxNavigationGameState?.fen]);

  // Track moves and calculate FENs for sandbox navigation
  useEffect(() => {
    if (gameMode === GameMode.SANDBOX && gameState?.moves) {
      try {
        sandboxChess.reset();
        const fens: string[] = [];
        
        // Starting position FEN
        fens.push(sandboxChess.fen());
        
        // FEN after each move
        for (const move of gameState.moves) {
          sandboxChess.move(move.notation);
          fens.push(sandboxChess.fen());
        }
        
        setSandboxNavigationFens(fens);
        
        // If not actively navigating, stay at the latest move
        if (!sandboxIsNavigating) {
          setSandboxCurrentMoveIndex(gameState.moves.length);
        }
      } catch (error) {
        console.error('Error calculating sandbox navigation FENs:', error);
      }
    }
  }, [gameMode, gameState?.moves, sandboxIsNavigating]);

  // Sandbox keyboard navigation (copied from GameAnalysis pattern)
  useEffect(() => {
    if (gameMode !== GameMode.SANDBOX) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        goToSandboxMove(sandboxCurrentMoveIndex - 1);
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        goToSandboxMove(sandboxCurrentMoveIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode, sandboxCurrentMoveIndex, gameState?.moves?.length]);

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
      setPrincipalVariation([]);
      
      await engineRef.current.setPosition(fen);
      await engineRef.current.evaluatePosition(20);
      
    } catch (error) {
      console.error('Error evaluating position:', error);
      setEvaluation(null);
      setCurrentDepth(0);
      setMateInMoves(null);
      setBestMove(null);
      setPrincipalVariation([]);
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
      
      // Check if game just ended and enable post-game analysis (not in sandbox mode)
      const newGameState = gameStateResponse.gameState;
      const isGameOver = newGameState && ['checkmate', 'stalemate', 'draw', 'resigned'].includes(newGameState.status);
      
      if (isGameOver && !showPostGameAnalysis && gameMode !== GameMode.SANDBOX) {
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
    setPrincipalVariation([]);
    
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
      // In human vs human and sandbox modes, resign the current player
      let resigningPlayer: 'white' | 'black';
      if (gameMode === GameMode.HUMAN_VS_AI) {
        resigningPlayer = 'white'; // Human always plays white
      } else {
        // Human vs Human and Sandbox modes: resign whoever's turn it is
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
    
    // Prevent moves if game is over or AI is thinking (except in sandbox mode)
    const isGameOver = gameState && ['checkmate', 'stalemate', 'draw', 'resigned'].includes(gameState.status);
    
    if ((isGameOver && gameMode !== GameMode.SANDBOX) || isAIThinking) {
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

  // Handle square clicks during sandbox navigation (for branching)
  const handleSandboxNavigationSquareClick = async (square: Square) => {
    console.log('Sandbox navigation square click:', square, 'at move index:', sandboxCurrentMoveIndex);
    
    // Clear AI move highlight when user clicks any square
    setAiMoveDestination(null);
    
    // Prevent moves if orchestrator is not ready
    if (!orchestratorReady || !orchestrator || !sandboxNavigationGameState) {
      console.log('Orchestrator not ready or no navigation state, moves not allowed');
      return;
    }

    // For branching, we need to handle piece selection and moves based on the navigation state
    if (selectedSquare === square) {
      // Deselect if clicking same square
      setSelectedSquare(null);
      setValidMoves([]);
    } else if (selectedSquare && validMoves.includes(square)) {
      // A move is being made - this is where we create a branch
      await createSandboxBranch(selectedSquare, square);
    } else {
      // Select new square and show valid moves for this navigation position
      try {
        // Use the sandbox chess instance to get valid moves from the current navigation position
        sandboxChess.reset();
        if (gameState?.moves) {
          for (let i = 0; i < sandboxCurrentMoveIndex; i++) {
            if (i < gameState.moves.length) {
              sandboxChess.move(gameState.moves[i].notation);
            }
          }
        }
        
        const moves = sandboxChess.moves({ square: square, verbose: true });
        const validMoveSquares = moves.map((move: any) => move.to);
        
        setSelectedSquare(square);
        setValidMoves(validMoveSquares);
        console.log(`Selected square ${square} with ${validMoveSquares.length} valid moves`);
      } catch (error) {
        console.error('Error getting valid moves for navigation position:', error);
        setSelectedSquare(null);
        setValidMoves([]);
      }
    }
  };

  // Create a new branch from the current navigation position
  const createSandboxBranch = async (from: Square, to: Square) => {
    console.log(`Creating branch: ${from} → ${to} from move index ${sandboxCurrentMoveIndex}`);
    
    try {
      // Check if this is a promotion move
      const fromFile = from.charCodeAt(0) - 'a'.charCodeAt(0);
      const fromRank = 8 - parseInt(from[1]);
      const toRank = parseInt(to[1]);
      
      const piece = sandboxNavigationGameState?.board.squares[fromRank][fromFile];
      const isPromotion = piece?.type === 'pawn' && 
        ((piece.color === 'white' && toRank === 8) || (piece.color === 'black' && toRank === 1));

      // First, truncate the game to the current navigation point
      const truncatedMoves = gameState?.moves?.slice(0, sandboxCurrentMoveIndex) || [];
      console.log('Truncating to', sandboxCurrentMoveIndex, 'moves:', truncatedMoves.map(m => m.notation));
      console.log('Original game state has', gameState?.moves?.length, 'total moves');
      console.log('Current game state FEN before truncation:', gameState?.fen);
      
      // Reset the orchestrator to the truncated state
      await resetOrchestratorToBranchPoint(truncatedMoves);
      
      // Now make the new move
      const moveRequest = { 
        from, 
        to, 
        promotion: isPromotion ? ('queen' as PieceType) : undefined 
      };
      
      console.log(`Making branch move:`, moveRequest);
      const moveResult = await orchestrator.makeMove(moveRequest);
      console.log(`Branch move result:`, moveResult);
      
      if (moveResult.success) {
        // Clear selection
        setSelectedSquare(null);
        setValidMoves([]);
        
        console.log('Branch created successfully, exiting navigation mode');
        
        // Exit navigation mode FIRST - this is crucial
        setSandboxIsNavigating(false);
        
        // Update the game state to reflect the new branch
        updateGameState();
        
        console.log('Branch creation complete');
      } else {
        console.error('Branch move failed:', moveResult.error);
      }
    } catch (error) {
      console.error('Error creating sandbox branch:', error);
    }
  };

  // Reset orchestrator to a specific point in move history
  const resetOrchestratorToBranchPoint = async (moves: Move[]) => {
    console.log('Resetting orchestrator to branch point with', moves.length, 'moves');
    
    try {
      // Always reset to starting position first, then replay exact moves needed
      console.log('Resetting orchestrator to starting position');
      await orchestrator.resetGame();
      
      const startingState = orchestrator.getGameState();
      console.log(`After reset: orchestrator has ${startingState.gameState.moves.length} moves`);
      console.log(`Starting FEN: ${startingState.gameState.fen}`);
      
      // Replay moves up to the branch point
      for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        const moveRequest = { 
          from: move.from, 
          to: move.to, 
          promotion: move.promotion 
        };
        console.log(`Replaying move ${i + 1}/${moves.length}: ${move.notation} (${moveRequest.from}→${moveRequest.to})`);
        
        const result = await orchestrator.makeMove(moveRequest);
        if (!result.success) {
          console.error(`Failed to replay move ${i + 1}:`, moveRequest, result.error);
          
          // Debug: Check orchestrator state after failed move
          const stateAfterFailed = orchestrator.getGameState();
          console.log(`After failed move: orchestrator has ${stateAfterFailed.gameState.moves.length} moves`);
          console.log(`Current FEN: ${stateAfterFailed.gameState.fen}`);
          
          throw new Error(`Failed to replay move ${i + 1}: ${moveRequest.from}${moveRequest.to} - ${result.error}`);
        }
        
        // Check FEN after each replayed move
        const fenAfterMove = orchestrator.getCurrentPosition();
        console.log(`FEN after replaying move ${i + 1}:`, fenAfterMove);
      }
      
      // Verify final position
      const finalState = orchestrator.getGameState();
      const finalFEN = finalState.gameState.fen;
      const expectedFEN = moves.length === 0 ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : sandboxNavigationFens[moves.length];
      
      console.log(`Final FEN: ${finalFEN}`);
      console.log(`Expected FEN: ${expectedFEN}`);
      console.log(`Final move count: ${finalState.gameState.moves.length}, expected: ${moves.length}`);
      
      if (finalFEN !== expectedFEN) {
        console.error(`FEN mismatch! Expected: ${expectedFEN}, Got: ${finalFEN}`);
        throw new Error(`Failed to reach target position. Expected: ${expectedFEN}, Got: ${finalFEN}`);
      }
      
      console.log('✅ Orchestrator reset to branch point successfully');
    } catch (error) {
      console.error('Error resetting orchestrator to branch point:', error);
      throw error;
    }
  };

  // Sandbox evaluation formatting functions (copied from GameAnalysis)
  const formatSandboxEvaluation = (evaluation: number | null, mateIn: number | null = null): string => {
    if (evaluation === null) return "...";
    
    // Check for mate scores
    if (mateIn !== null) {
      return `M${mateIn}`;
    } else if (Math.abs(evaluation) >= 999999) {
      return 'M#';
    } else {
      // Regular centipawn evaluation
      const pawns = (evaluation / 100).toFixed(2);
      return evaluation >= 0 ? `+${pawns}` : pawns.toString();
    }
  };

  // Calculate evaluation bar percentage for sandbox (copied from GameAnalysis)
  const getSandboxEvaluationPercentage = (): number => {
    if (sandboxEvaluation === null) return 50;
    
    // For mate scores, fill entire bar
    if (Math.abs(sandboxEvaluation) >= 999999) {
      return sandboxEvaluation > 0 ? 100 : 0;
    }
    
    // Convert centipawns to percentage with logarithmic scale
    const clampedEval = Math.max(-500, Math.min(500, sandboxEvaluation));
    const percentage = 50 + (clampedEval / 500) * 45; // 5-95% range
    return Math.max(5, Math.min(95, percentage));
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
                principalVariation={principalVariation}
              />
            </div>
          )}
          {gameMode === GameMode.SANDBOX && !showPostGameAnalysis && (
            <div className="sandbox-evaluation-section">
              <div className="evaluation-bar-container">
                <h4>Position Evaluation</h4>
                <div className="evaluation-bar">
                  <div className="eval-bar-bg">
                    <div className="black-section"></div>
                    <div 
                      className="white-section" 
                      style={{ 
                        height: `${getSandboxEvaluationPercentage()}%`,
                        minHeight: getSandboxEvaluationPercentage() === 0 ? '0px' : '20px'
                      }}
                    >
                      <div className="eval-score-text">
                        {sandboxIsEvaluating && sandboxEvaluation === null ? (
                          "..."
                        ) : (
                          formatSandboxEvaluation(sandboxEvaluation, sandboxMateInMoves)
                        )}
                      </div>
                    </div>
                    <div className="eval-bar-midline"></div>
                  </div>
                </div>
                <div className="evaluation-info">
                  {sandboxIsEvaluating ? (
                    <small>Analyzing depth: {sandboxCurrentDepth}/20</small>
                  ) : (
                    <small>Depth: {sandboxCurrentDepth}</small>
                  )}
                </div>
              </div>
              <BestMoveDisplay
                bestMoveUci={sandboxBestMove}
                currentFen={sandboxIsNavigating ? sandboxNavigationGameState?.fen || null : gameState?.fen || null}
                className="analysis"
                principalVariation={sandboxPrincipalVariation}
              />
            </div>
          )}
          <CanvasChessBoard 
            gameState={showPostGameAnalysis ? analysisGameState : 
                      (gameMode === GameMode.SANDBOX && sandboxIsNavigating) ? sandboxNavigationGameState : gameState}
            boardState={showPostGameAnalysis ? analysisGameState?.board : 
                       (gameMode === GameMode.SANDBOX && sandboxIsNavigating) ? sandboxNavigationGameState?.board : gameState?.board}
            onSquareClick={showPostGameAnalysis ? () => {} : 
                          (gameMode === GameMode.SANDBOX && sandboxIsNavigating) ? handleSandboxNavigationSquareClick : handleSquareClick}
            selectedSquare={showPostGameAnalysis ? null : selectedSquare}
            validMoves={showPostGameAnalysis ? [] : validMoves}
            checkSquare={showPostGameAnalysis ? null : 
                        (gameMode === GameMode.SANDBOX && sandboxIsNavigating) ? null : getCheckSquare()}
            aiMoveSquare={showPostGameAnalysis ? null : aiMoveDestination}
            showStartingPosition={false} // Use actual game state instead
            arrows={(() => {
              if (showPostGameAnalysis && bestMove) {
                return [{ 
                  from: bestMove.substring(0, 2) as any, 
                  to: bestMove.substring(2, 4) as any, 
                  color: '#3498db' 
                }];
              } else if (gameMode === GameMode.SANDBOX && sandboxBestMove) {
                return [{ 
                  from: sandboxBestMove.substring(0, 2) as any, 
                  to: sandboxBestMove.substring(2, 4) as any, 
                  color: '#3498db' 
                }];
              }
              return [];
            })()}
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
        isPostGameAnalysis={showPostGameAnalysis || (gameMode === GameMode.SANDBOX)}
        currentMoveIndex={showPostGameAnalysis ? analysisCurrentMoveIndex : sandboxCurrentMoveIndex}
        onMoveClick={showPostGameAnalysis ? goToAnalysisMove : 
                    (gameMode === GameMode.SANDBOX ? goToSandboxMove : undefined)}
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