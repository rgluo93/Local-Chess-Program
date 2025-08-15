/**
 * Core Chess Types and Interfaces
 * 
 * This file defines all chess-specific types, interfaces, and enums
 * used throughout the application for type safety and consistency.
 */

// =============================================================================
// BASIC CHESS TYPES
// =============================================================================

export type PieceColor = 'white' | 'black';

export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export type Square = 
  | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7' | 'a8'
  | 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6' | 'b7' | 'b8'
  | 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6' | 'c7' | 'c8'
  | 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7' | 'd8'
  | 'e1' | 'e2' | 'e3' | 'e4' | 'e5' | 'e6' | 'e7' | 'e8'
  | 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6' | 'f7' | 'f8'
  | 'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'g6' | 'g7' | 'g8'
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'h7' | 'h8';

export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// =============================================================================
// PIECE INTERFACE
// =============================================================================

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean; // For castling and pawn double-move tracking
}

// =============================================================================
// MOVE INTERFACES
// =============================================================================

export interface Move {
  from: Square;
  to: Square;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PieceType;
  specialMove?: SpecialMoveType;
  notation: string; // Algebraic notation (e4, Nf3, O-O, etc.)
  timestamp: number;
  fen: string; // Board state after this move
}

export type SpecialMoveType = 'castle' | 'enPassant' | 'promotion';

export interface MoveValidationResult {
  isValid: boolean;
  errorType?: MoveErrorType;
  validMoves?: Square[];
  specialMoveType?: SpecialMoveType;
  wouldBeInCheck?: boolean;
}

export type MoveErrorType = 
  | 'illegal' 
  | 'blocked' 
  | 'wouldBeInCheck' 
  | 'outOfBounds'
  | 'wrongTurn'
  | 'noPieceOnSquare'
  | 'cannotCaptureOwnPiece';

// =============================================================================
// CASTLING INTERFACES
// =============================================================================

export interface CastlingRights {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
}

export type CastlingType = 'kingside' | 'queenside';

// =============================================================================
// GAME STATE INTERFACES
// =============================================================================

export interface ChessBoard {
  squares: (Piece | null)[][]; // 8x8 array [rank][file]
  toMove: PieceColor;
  castlingRights: CastlingRights;
  enPassantTarget: Square | null;
  halfmoveClock: number; // For 50-move rule
  fullmoveNumber: number;
}

export type GameStatus = 
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resigned';

export type GameResult = 
  | '1-0'    // White wins
  | '0-1'    // Black wins
  | '1/2-1/2' // Draw
  | '*'      // Game in progress
  | 'white_wins'
  | 'black_wins'
  | 'draw'
  | 'ongoing';

export interface GameState {
  fen: string;
  pgn: string;
  moves: Move[];
  currentPlayer: PieceColor;
  status: GameStatus;
  result: GameResult;
  startDate: Date;
  endDate?: Date;
  board: ChessBoard;
}

export interface SavedGame {
  id: string;
  name: string;
  gameState: GameState;
  saveDate: Date;
  gameDate: Date;
  moveCount: number;
  status: GameStatus;
  result: GameResult;
  duration?: number; // in milliseconds
  thumbnail?: string; // Base64 encoded board position image
}

export interface GameMetadata {
  startTime: Date;
  endTime?: Date;
  players: {
    white: string;
    black: string;
  };
  event?: string;
  site: string;
  round?: string;
  timeControl?: string;
}

// =============================================================================
// DRAW CONDITIONS
// =============================================================================

export type DrawType = 
  | 'stalemate'
  | 'insufficientMaterial'
  | 'threefoldRepetition'
  | 'fiftyMoveRule'
  | 'agreement';

export interface DrawClaim {
  type: DrawType;
  moveNumber: number;
  automatic: boolean; // True if automatically detected
  claimed: boolean;   // True if player claimed the draw
}

// =============================================================================
// POSITION EVALUATION
// =============================================================================

export interface PositionAnalysis {
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  drawType?: DrawType;
  legalMoves: Move[];
  attackedSquares: {
    white: Square[];
    black: Square[];
  };
}

// =============================================================================
// COORDINATE UTILITIES
// =============================================================================

export interface Coordinates {
  file: number; // 0-7 (a-h)
  rank: number; // 0-7 (1-8)
}

// =============================================================================
// NOTATION INTERFACES
// =============================================================================

export interface PGNData {
  headers: Record<string, string>;
  moves: string[];
  result: GameResult;
}

export interface FENComponents {
  piecePlacement: string;
  activeColor: PieceColor;
  castlingRights: string;
  enPassantTarget: string;
  halfmoveClock: number;
  fullmoveNumber: number;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isPieceColor(color: string): color is PieceColor {
  return color === 'white' || color === 'black';
}

export function isPieceType(type: string): type is PieceType {
  return ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'].includes(type);
}

export function isSquare(square: string): square is Square {
  return /^[a-h][1-8]$/.test(square);
}

export function isValidMove(move: any): move is Move {
  return (
    move &&
    typeof move === 'object' &&
    isSquare(move.from) &&
    isSquare(move.to) &&
    isPieceType(move.piece) &&
    isPieceColor(move.color) &&
    typeof move.notation === 'string' &&
    typeof move.timestamp === 'number' &&
    typeof move.fen === 'string'
  );
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const FILES: File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8];

export const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0 // King is invaluable
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function getOppositeColor(color: PieceColor): PieceColor {
  return color === 'white' ? 'black' : 'white';
}

export function squareToCoordinates(square: Square): Coordinates {
  const file = square.charCodeAt(0) - 97; // 'a' = 97
  const rank = parseInt(square[1]) - 1;
  return { file, rank };
}

export function coordinatesToSquare(coordinates: Coordinates): Square {
  const file = String.fromCharCode(97 + coordinates.file) as File;
  const rank = (coordinates.rank + 1) as Rank;
  return `${file}${rank}` as Square;
}

export function isLightSquare(square: Square): boolean {
  const { file, rank } = squareToCoordinates(square);
  return (file + rank) % 2 === 0;
}

export function getSquareColor(square: Square): 'light' | 'dark' {
  return isLightSquare(square) ? 'light' : 'dark';
}