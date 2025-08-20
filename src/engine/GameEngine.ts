/**
 * GameEngine - Chess.js Integration Wrapper
 * 
 * This class wraps Chess.js library and provides extended functionality
 * for the chess program including enhanced move validation, game state
 * management, and notation generation.
 */

import { Chess } from 'chess.js';
import type {
  Square,
  PieceType,
  PieceColor,
  Move,
  MoveValidationResult,
  MoveErrorType,
  GameStatus,
  GameResult,
  ChessBoard,
  Piece,
  CastlingRights,
  SpecialMoveType,
} from '../types/Chess';

export interface MoveResult {
  isValid: boolean;
  move?: Move;
  error?: MoveErrorType;
  gameStatus: GameStatus;
  isGameOver: boolean;
}

export class GameEngine {
  private chess: Chess;
  private moveHistory: Move[] = [];
  private positionHistory: string[] = []; // Track FEN positions for three-fold repetition
  private _instanceId: string; // For debugging

  constructor(fen?: string) {
    this.chess = new Chess(fen);
    this._instanceId = `engine-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Initialize position history with starting position
    this.positionHistory.push(this.normalizeFENForRepetition(this.chess.fen()));
  }

  // ==========================================================================
  // CORE GAME OPERATIONS
  // ==========================================================================

  /**
   * Make a move on the chess board
   */
  makeMove(from: Square, to: Square, promotion?: PieceType): MoveResult {
    try {
      // Check for wrong turn before attempting move
      const piece = this.chess.get(from);
      
      if (piece) {
        const currentPlayer = this.chess.turn() === 'w' ? 'white' : 'black';
        const pieceColor = piece.color === 'w' ? 'white' : 'black';
        if (pieceColor !== currentPlayer) {
          return {
            isValid: false,
            error: 'wrongTurn',
            gameStatus: this.getGameStatus(),
            isGameOver: this.chess.isGameOver(),
          };
        }
      }
      
      // Attempt the move
      const moveObject = this.chess.move({
        from,
        to,
        promotion: promotion?.charAt(0) as 'q' | 'r' | 'b' | 'n' | undefined,
      });

      if (!moveObject) {
        return {
          isValid: false,
          error: this.determineMoveError(from, to),
          gameStatus: this.getGameStatus(),
          isGameOver: this.chess.isGameOver(),
        };
      }

      // Create our enhanced Move object
      const move: Move = {
        from,
        to,
        piece: this.convertChessjsPieceType(moveObject.piece),
        color: moveObject.color === 'w' ? 'white' : 'black',
        captured: moveObject.captured ? this.convertChessjsPieceType(moveObject.captured) : undefined,
        promotion: moveObject.promotion ? this.convertChessjsPieceType(moveObject.promotion) : undefined,
        specialMove: this.getSpecialMoveType(moveObject),
        notation: moveObject.san,
        timestamp: Date.now(),
        fen: this.chess.fen(),
      };

      // Add to our move history
      this.moveHistory.push(move);
      
      // Add position to our position history for three-fold repetition tracking
      const normalizedFEN = this.normalizeFENForRepetition(this.chess.fen());
      this.positionHistory.push(normalizedFEN);

      return {
        isValid: true,
        move,
        gameStatus: this.getGameStatus(),
        isGameOver: this.chess.isGameOver(),
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'illegal',
        gameStatus: this.getGameStatus(),
        isGameOver: this.chess.isGameOver(),
      };
    }
  }

  /**
   * Undo the last move
   */
  undoMove(): boolean {
    try {
      // Check if there are moves to undo
      if (this.moveHistory.length === 0) {
        return false;
      }

      // Undo in Chess.js
      const undoResult = this.chess.undo();
      if (!undoResult) {
        return false;
      }

      // Remove from our move history
      this.moveHistory.pop();
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all valid moves for a piece or all pieces
   */
  getValidMoves(square?: Square): Square[] {
    if (square) {
      const moves = this.chess.moves({ square, verbose: true });
      return moves.map(move => move.to as Square);
    } else {
      const moves = this.chess.moves({ verbose: true });
      return moves.map(move => move.to as Square);
    }
  }

  /**
   * Validate a potential move without making it
   */
  validateMove(from: Square, to: Square, promotion?: PieceType): MoveValidationResult {
    const originalFen = this.chess.fen();
    
    try {
      const moveResult = this.makeMove(from, to, promotion);
      
      // Restore original position
      this.chess.load(originalFen);
      this.moveHistory.pop(); // Remove the test move
      this.positionHistory.pop(); // Remove the test position

      if (moveResult.isValid) {
        return {
          isValid: true,
          validMoves: this.getValidMoves(from),
          specialMoveType: moveResult.move?.specialMove,
        };
      } else {
        return {
          isValid: false,
          errorType: moveResult.error,
          validMoves: this.getValidMoves(from),
        };
      }
    } catch (error) {
      // Restore position on any error
      this.chess.load(originalFen);
      // Remove any added entries if move was partially processed
      if (this.moveHistory.length > 0) this.moveHistory.pop();
      if (this.positionHistory.length > 0) this.positionHistory.pop();
      return {
        isValid: false,
        errorType: 'illegal',
        validMoves: this.getValidMoves(from),
      };
    }
  }

  // ==========================================================================
  // GAME STATE ACCESS
  // ==========================================================================

  /**
   * Check if a king is in check
   */
  isInCheck(color?: PieceColor): boolean {
    if (color) {
      const currentTurn = this.chess.turn();
      if (color === 'white' && currentTurn !== 'w') return false;
      if (color === 'black' && currentTurn !== 'b') return false;
    }
    return this.chess.inCheck();
  }

  /**
   * Get current game status
   */
  getGameStatus(): GameStatus {
    if (this.chess.isCheckmate()) return 'checkmate';
    if (this.chess.isStalemate()) return 'stalemate';
    // Check all draw conditions - use our manual three-fold repetition check
    if (this.chess.isDraw() || this.isThreefoldRepetitionManual()) return 'draw';
    if (this.chess.inCheck()) return 'check';
    return 'playing';
  }

  /**
   * Get game result in standard notation
   */
  getGameResult(): GameResult {
    if (this.chess.isCheckmate()) {
      return this.chess.turn() === 'w' ? '0-1' : '1-0';
    }
    if (this.chess.isStalemate() || this.chess.isDraw() || this.isThreefoldRepetitionManual()) {
      return '1/2-1/2';
    }
    return '*';
  }

  /**
   * Get specific draw reason if game is drawn
   */
  getDrawReason(): string | null {
    // Check manual three-fold repetition first
    if (this.isThreefoldRepetitionManual()) {
      return 'threefold_repetition';
    }
    
    // Only check other draws if game is actually drawn
    if (!this.chess.isDraw()) {
      return null;
    }
    
    // Check insufficient material
    if (this.chess.isInsufficientMaterial()) {
      return 'insufficient_material';
    }
    
    // Check fifty-move rule by examining the halfmove clock in FEN
    const fen = this.chess.fen();
    const fenParts = fen.split(' ');
    const halfmoveClock = parseInt(fenParts[4] || '0');
    
    if (halfmoveClock >= 100) { // 100 half-moves = 50 full moves
      return 'fifty_move_rule';
    }
    
    // If it's a draw but none of the above, it might be stalemate
    // But stalemate should be handled separately, not as a draw reason
    if (this.chess.isStalemate()) {
      return null; // Stalemate is not a draw reason, it's a game ending
    }
    
    // Unknown draw type
    return null;
  }

  /**
   * Check if game is drawn by three-fold repetition (using our manual implementation)
   */
  isThreefoldRepetition(): boolean {
    return this.isThreefoldRepetitionManual();
  }

  /**
   * Check if game is drawn by insufficient material
   */
  isInsufficientMaterial(): boolean {
    return this.chess.isInsufficientMaterial();
  }

  /**
   * Get current position in FEN notation
   */
  getFEN(): string {
    return this.chess.fen();
  }

  /**
   * Get game moves in PGN format
   */
  getPGN(): string {
    return this.chess.pgn();
  }

  /**
   * Get complete board state
   */
  getBoard(): ChessBoard {
    const board = this.chess.board();
    const squares: (Piece | null)[][] = [];

    // Convert Chess.js board to our format
    for (let rank = 0; rank < 8; rank++) {
      squares[rank] = [];
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece) {
          squares[rank][file] = {
            type: this.convertChessjsPieceType(piece.type),
            color: piece.color === 'w' ? 'white' : 'black',
          };
        } else {
          squares[rank][file] = null;
        }
      }
    }

    return {
      squares,
      toMove: this.chess.turn() === 'w' ? 'white' : 'black',
      castlingRights: this.getCastlingRights(),
      enPassantTarget: this.chess.history({ verbose: true }).slice(-1)[0]?.to as Square || null,
      halfmoveClock: this.getHalfmoveClock(),
      fullmoveNumber: this.getFullmoveNumber(),
    };
  }

  /**
   * Get move history
   */
  getMoveHistory(): Move[] {
    return [...this.moveHistory];
  }

  /**
   * Get current player to move
   */
  getCurrentPlayer(): PieceColor {
    return this.chess.turn() === 'w' ? 'white' : 'black';
  }

  // ==========================================================================
  // GAME CONTROL
  // ==========================================================================

  /**
   * Undo the last move
   */
  undo(): boolean {
    const move = this.chess.undo();
    if (move) {
      this.moveHistory.pop();
      // Also remove the corresponding position from position history
      if (this.positionHistory.length > 0) {
        this.positionHistory.pop();
      }
      return true;
    }
    return false;
  }

  /**
   * Reset game to starting position
   */
  reset(): void {
    this.chess.reset();
    this.moveHistory = [];
    this.resetPositionHistory();
  }

  /**
   * Load position from FEN string
   */
  loadFEN(fen: string): boolean {
    try {
      this.chess.load(fen);
      this.moveHistory = []; // Reset move history when loading new position
      this.resetPositionHistory(); // Reset position history when loading new position
      return true;
    } catch (error) {
      return false;
    }
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  private determineMoveError(from: Square, to: Square): MoveErrorType {
    const piece = this.chess.get(from);
    
    if (!piece) return 'noPieceOnSquare';
    
    const currentPlayer = this.chess.turn() === 'w' ? 'white' : 'black';
    const pieceColor = piece.color === 'w' ? 'white' : 'black';
    
    if (pieceColor !== currentPlayer) return 'wrongTurn';
    
    const targetPiece = this.chess.get(to);
    if (targetPiece && targetPiece.color === piece.color) return 'cannotCaptureOwnPiece';
    
    return 'illegal';
  }

  private convertChessjsPieceType(chessjsType: string): PieceType {
    const typeMap: Record<string, PieceType> = {
      'p': 'pawn',
      'n': 'knight',
      'b': 'bishop',
      'r': 'rook',
      'q': 'queen',
      'k': 'king',
    };
    return typeMap[chessjsType.toLowerCase()] || 'pawn';
  }

  private getSpecialMoveType(move: any): SpecialMoveType | undefined {
    if (move.flags?.includes('k') || move.flags?.includes('q')) return 'castle';
    if (move.flags?.includes('e')) return 'enPassant';
    if (move.flags?.includes('p')) return 'promotion';
    return undefined;
  }

  private getCastlingRights(): CastlingRights {
    const fen = this.chess.fen();
    const castlingString = fen.split(' ')[2];
    
    return {
      whiteKingside: castlingString.includes('K'),
      whiteQueenside: castlingString.includes('Q'),
      blackKingside: castlingString.includes('k'),
      blackQueenside: castlingString.includes('q'),
    };
  }

  private getHalfmoveClock(): number {
    const fen = this.chess.fen();
    return parseInt(fen.split(' ')[4]) || 0;
  }

  private getFullmoveNumber(): number {
    const fen = this.chess.fen();
    return parseInt(fen.split(' ')[5]) || 1;
  }

  public getKingPosition(): Square | null {
    const currentPlayer = this.getCurrentPlayer();
    const kingColor = currentPlayer === 'white' ? 'w' : 'b';
    
    // Search for the king
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    
    for (const rank of ranks) {
      for (const file of files) {
        const square = `${file}${rank}` as Square;
        const piece = this.chess.get(square);
        if (piece && piece.type === 'k' && piece.color === kingColor) {
          return square;
        }
      }
    }
    
    return null;
  }

  public isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  public getInstanceId(): string {
    return this._instanceId;
  }

  // ==========================================================================
  // MANUAL THREE-FOLD REPETITION IMPLEMENTATION
  // ==========================================================================

  /**
   * Check if current position has occurred 3 or more times (manual implementation)
   */
  private isThreefoldRepetitionManual(): boolean {
    if (this.positionHistory.length < 3) {
      return false;
    }

    const currentPosition = this.positionHistory[this.positionHistory.length - 1];
    const occurrences = this.countPositionOccurrences(currentPosition);
    
    return occurrences >= 3;
  }

  /**
   * Count how many times a normalized position appears in history
   */
  private countPositionOccurrences(normalizedFEN: string): number {
    return this.positionHistory.filter(fen => fen === normalizedFEN).length;
  }

  /**
   * Normalize FEN for three-fold repetition comparison
   * Only considers: board position, active color, and castling rights
   * Ignores: en passant, halfmove clock, fullmove number
   */
  private normalizeFENForRepetition(fen: string): string {
    const parts = fen.split(' ');
    // Return: position, active color, castling rights
    return `${parts[0]} ${parts[1]} ${parts[2]}`;
  }

  /**
   * Get the position history (for debugging)
   */
  public getPositionHistory(): string[] {
    return [...this.positionHistory];
  }

  /**
   * Reset position history (called when starting new games)
   */
  public resetPositionHistory(): void {
    this.positionHistory = [];
    // Add current position
    this.positionHistory.push(this.normalizeFENForRepetition(this.chess.fen()));
  }

}