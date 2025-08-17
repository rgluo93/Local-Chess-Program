/**
 * AIPlayer - High-level AI player coordination
 * 
 * Manages AI gameplay coordination, move validation,
 * and integration with the game system.
 */

import type { Move, GameState } from '../types/Chess';
import type { EngineOptions, ThinkingMove } from './types/AITypes';
import { StockfishEngine } from './StockfishEngine';
import { Chess } from 'chess.js';

export class AIPlayer {
  private engine: StockfishEngine;
  private chess: Chess;
  private ready = false;
  private engineOptions: EngineOptions;
  private fallbackMode = false;

  constructor() {
    this.engine = new StockfishEngine();
    this.chess = new Chess();
    
    // Default engine options
    this.engineOptions = {
      timeLimit: 3000, // 3 seconds
      multiPV: 3, // Show top 3 candidate moves
      debug: false
    };
  }

  /**
   * Initialize the AI player
   */
  async initialize(): Promise<void> {
    try {
      await this.engine.initialize();
      this.ready = true;
    } catch (error) {
      this.ready = false;
      throw error;
    }
  }

  /**
   * Make a move for the current game state
   */
  async makeMove(gameState: GameState): Promise<Move> {
    console.log('🎯 AI received FEN:', gameState.fen);
    console.log('🎯 AI should move for player:', gameState.currentPlayer);
    
    if (!this.isReady()) {
      throw new Error('AI player not initialized');
    }

    if (this.fallbackMode) {
      return this.makeRandomMove(gameState);
    }

    try {
      // Set position in both engines
      await this.engine.setPosition(gameState.fen);
      this.chess.load(gameState.fen);

      // Get best move from engine
      const move = await this.engine.getBestMove(this.engineOptions);

      // Validate the move
      const validatedMove = this.validateAIMove(move, gameState);
      
      return validatedMove;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Start thinking about the current position (for visualization)
   */
  startThinking(gameState: GameState): void {
    if (!this.isReady()) return;

    try {
      // Set position for thinking visualization
      this.engine.setPosition(gameState.fen);
      // Thinking visualization is handled by the engine's multi-PV analysis
    } catch (error) {
      console.warn('Failed to start thinking visualization:', error);
    }
  }

  /**
   * Stop current thinking process
   */
  stopThinking(): void {
    if (this.engine) {
      this.engine.stop();
    }
  }

  /**
   * Get current thinking moves for visualization
   */
  getThinkingMoves(): ThinkingMove[] {
    if (!this.engine) return [];
    return this.engine.getThinkingMoves();
  }

  /**
   * Check if AI is currently thinking
   */
  isThinking(): boolean {
    return this.engine ? this.engine.isThinking() : false;
  }

  /**
   * Check if AI player is ready
   */
  isReady(): boolean {
    return this.ready && this.engine?.isReady();
  }

  /**
   * Set engine options
   */
  setEngineOptions(options: Partial<EngineOptions>): void {
    this.engineOptions = {
      ...this.engineOptions,
      ...options
    };
  }

  /**
   * Get current engine options
   */
  getEngineOptions(): EngineOptions {
    return { ...this.engineOptions };
  }

  /**
   * Enable/disable fallback mode
   */
  setFallbackMode(enabled: boolean): void {
    this.fallbackMode = enabled;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.engine) {
      this.engine.terminate();
    }
    this.ready = false;
  }

  /**
   * Validate AI move against current position
   */
  private validateAIMove(move: Move, gameState: GameState): Move {
    try {
      // Load current position
      this.chess.load(gameState.fen);

      // Try the move using chess.js object format first
      let result = this.chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion
      });
      
      // If object format fails, try UCI string format
      if (!result) {
        const moveStr = `${move.from}${move.to}${move.promotion ? move.promotion : ''}`;
        result = this.chess.move(moveStr);
      }
      
      if (!result) {
        console.error('Move validation failed for:', move);
        console.error('Current FEN:', gameState.fen);
        throw new Error(`Move not legal in current position: ${move.from}-${move.to}`);
      }

      // Return the validated move with correct piece info from chess.js
      return {
        from: move.from,
        to: move.to,
        piece: result.piece,
        color: result.color,
        san: result.san,
        promotion: move.promotion,
        captured: result.captured,
        flags: result.flags
      };
    } catch (error) {
      console.error('AI move validation error:', error);
      throw new Error(`Invalid AI move: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a random legal move as fallback
   */
  private async makeRandomMove(gameState: GameState): Promise<Move & { error?: boolean }> {
    try {
      this.chess.load(gameState.fen);
      const legalMoves = this.chess.moves({ verbose: true });
      
      if (legalMoves.length === 0) {
        return {
          from: 'e2' as any,
          to: 'e4' as any,
          piece: 'p',
          color: 'w',
          error: true
        };
      }

      const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      
      return {
        from: randomMove.from,
        to: randomMove.to,
        piece: randomMove.piece,
        color: randomMove.color,
        san: randomMove.san,
        promotion: randomMove.promotion,
        captured: randomMove.captured,
        flags: randomMove.flags
      };
    } catch (error) {
      // Ultimate fallback
      return {
        from: 'e2' as any,
        to: 'e4' as any,
        piece: 'p',
        color: 'w',
        error: true
      };
    }
  }

  /**
   * Check if move is legal in current position
   */
  private isLegalMove(move: Move, gameState: GameState): boolean {
    try {
      this.chess.load(gameState.fen);
      const moveStr = `${move.from}${move.to}${move.promotion ? move.promotion : ''}`;
      const result = this.chess.move(moveStr);
      
      if (result) {
        // Undo the move to restore position
        this.chess.undo();
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all legal moves for current position
   */
  private getLegalMoves(gameState: GameState): Move[] {
    try {
      this.chess.load(gameState.fen);
      const moves = this.chess.moves({ verbose: true });
      
      return moves.map(move => ({
        from: move.from,
        to: move.to,
        piece: move.piece,
        color: move.color,
        san: move.san,
        promotion: move.promotion,
        captured: move.captured,
        flags: move.flags
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Evaluate position strength (basic implementation)
   */
  private evaluatePosition(gameState: GameState): number {
    try {
      this.chess.load(gameState.fen);
      
      // Simple material count evaluation
      const pieces = this.chess.board().flat().filter(piece => piece !== null);
      const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
      
      let evaluation = 0;
      for (const piece of pieces) {
        if (piece) {
          const value = pieceValues[piece.type as keyof typeof pieceValues];
          evaluation += piece.color === 'w' ? value : -value;
        }
      }
      
      return evaluation;
    } catch (error) {
      return 0;
    }
  }
}