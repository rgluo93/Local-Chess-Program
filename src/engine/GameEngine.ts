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
} from '@/types/Chess';

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

  constructor(fen?: string) {
    this.chess = new Chess(fen);
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
    if (this.chess.isDraw()) return 'draw';
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
    if (this.chess.isStalemate() || this.chess.isDraw()) {
      return '1/2-1/2';
    }
    return '*';
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
  }

  /**
   * Load position from FEN string
   */
  loadFEN(fen: string): boolean {
    try {
      this.chess.load(fen);
      this.moveHistory = []; // Reset move history when loading new position
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

}