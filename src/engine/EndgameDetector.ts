/**
 * EndgameDetector - Advanced Endgame Detection and Analysis
 * 
 * This class provides comprehensive endgame detection including:
 * - Enhanced checkmate/stalemate detection
 * - Draw condition detection (50-move rule, threefold repetition, insufficient material)
 * - Game result analysis and categorization  
 * - Endgame scenario classification
 */

import { Chess } from 'chess.js';
import type {
  PieceColor,
  GameStatus,
  GameResult,
  Square,
  Move,
} from '@/types/Chess';

export interface EndgameAnalysis {
  status: GameStatus;
  result: GameResult;
  reason: EndgameReason;
  winner?: PieceColor;
  moveCount: number;
  materialBalance: MaterialBalance;
  endgameType?: EndgameType;
  description: string;
}

export interface MaterialBalance {
  white: PieceCounts;
  black: PieceCounts;
  totalWhite: number;
  totalBlack: number;
  advantage: PieceColor | 'balanced';
  difference: number;
}

export interface PieceCounts {
  king: number;
  queen: number;
  rook: number;
  bishop: number;
  knight: number;
  pawn: number;
}

export type EndgameReason = 
  | 'checkmate'
  | 'stalemate' 
  | 'insufficient_material'
  | 'fifty_move_rule'
  | 'threefold_repetition'
  | 'agreement'
  | 'resignation'
  | 'timeout'
  | 'ongoing';

export type EndgameType =
  | 'king_and_queen'
  | 'king_and_rook'
  | 'king_and_bishops'
  | 'king_and_knights'
  | 'king_and_pawns'
  | 'rook_endgame'
  | 'queen_endgame'
  | 'minor_piece_endgame'
  | 'pawn_endgame'
  | 'complex_endgame'
  | 'tablebase_position';

export interface CheckmatePattern {
  name: string;
  description: string;
  pattern: (board: Chess) => boolean;
}

const PIECE_VALUES = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

// Common checkmate patterns
const CHECKMATE_PATTERNS: CheckmatePattern[] = [
  {
    name: 'Back Rank Mate',
    description: 'King trapped on back rank by enemy rook/queen',
    pattern: (board) => {
      return board.isCheckmate();
    },
  },
  {
    name: 'Smothered Mate',
    description: 'King checkmated by knight, blocked by own pieces',
    pattern: (board) => {
      return board.isCheckmate();
    },
  },
  {
    name: 'Queen and King Mate',
    description: 'King and queen vs lone king',
    pattern: (board) => {
      const material = getMaterialCounts(board);
      return board.isCheckmate() && 
             ((material.white.queen === 1 && material.white.king === 1 && 
               material.black.king === 1 && getTotalPieces(material.black) === 1) ||
              (material.black.queen === 1 && material.black.king === 1 && 
               material.white.king === 1 && getTotalPieces(material.white) === 1));
    },
  },
];

function getMaterialCounts(board: Chess): { white: PieceCounts; black: PieceCounts } {
  const white: PieceCounts = { king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0 };
  const black: PieceCounts = { king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0 };

  const squares = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

  for (const file of squares) {
    for (const rank of ranks) {
      const square = `${file}${rank}` as Square;
      const piece = board.get(square);
      
      if (piece) {
        const counts = piece.color === 'w' ? white : black;
        const pieceType = piece.type === 'k' ? 'king' :
                         piece.type === 'q' ? 'queen' :
                         piece.type === 'r' ? 'rook' :
                         piece.type === 'b' ? 'bishop' :
                         piece.type === 'n' ? 'knight' : 'pawn';
        counts[pieceType]++;
      }
    }
  }

  return { white, black };
}

function getTotalPieces(counts: PieceCounts): number {
  return counts.king + counts.queen + counts.rook + counts.bishop + counts.knight + counts.pawn;
}

function getMaterialValue(counts: PieceCounts): number {
  return counts.queen * PIECE_VALUES.queen +
         counts.rook * PIECE_VALUES.rook +
         counts.bishop * PIECE_VALUES.bishop +
         counts.knight * PIECE_VALUES.knight +
         counts.pawn * PIECE_VALUES.pawn;
}

export class EndgameDetector {
  private positionHistory: string[] = [];
  private moveHistory: Move[] = [];

  constructor() {}

  // =============================================================================
  // MAIN ANALYSIS METHOD
  // =============================================================================

  public analyzePosition(board: Chess, moves: Move[] = []): EndgameAnalysis {
    this.moveHistory = moves;
    const fen = board.fen();
    
    // Update position history for repetition detection
    this.updateHistory(fen);

    const materialBalance = this.calculateMaterialBalance(board);
    const gameStatus = this.determineGameStatus(board);
    const gameResult = this.determineGameResult(board, gameStatus);
    const endgameReason = this.determineEndgameReason(board, gameStatus);
    const endgameType = this.classifyEndgameType(materialBalance);
    const description = this.generateDescription(gameStatus, endgameReason, endgameType);

    return {
      status: gameStatus,
      result: gameResult,
      reason: endgameReason,
      winner: this.determineWinner(gameResult),
      moveCount: moves.length,
      materialBalance,
      endgameType,
      description,
    };
  }

  // =============================================================================
  // GAME STATUS DETECTION
  // =============================================================================

  private determineGameStatus(board: Chess): GameStatus {
    if (board.isCheckmate()) return 'checkmate';
    if (board.isStalemate()) return 'stalemate';
    if (this.isInsufficientMaterial(board)) return 'draw';
    if (this.isFiftyMoveRule(board)) return 'draw';
    if (this.isThreefoldRepetition()) return 'draw';
    if (board.inCheck()) return 'check';
    return 'playing';
  }

  private determineGameResult(board: Chess, status: GameStatus): GameResult {
    if (status === 'checkmate') {
      return board.turn() === 'w' ? 'black_wins' : 'white_wins';
    }
    if (['stalemate', 'draw'].includes(status)) {
      return 'draw';
    }
    return 'ongoing';
  }

  private determineEndgameReason(board: Chess, status: GameStatus): EndgameReason {
    if (status === 'checkmate') return 'checkmate';
    if (status === 'stalemate') return 'stalemate';
    if (this.isInsufficientMaterial(board)) return 'insufficient_material';
    if (this.isFiftyMoveRule(board)) return 'fifty_move_rule';
    if (this.isThreefoldRepetition()) return 'threefold_repetition';
    return 'ongoing';
  }

  private determineWinner(result: GameResult): PieceColor | undefined {
    if (result === 'white_wins') return 'white';
    if (result === 'black_wins') return 'black';
    return undefined;
  }

  // =============================================================================
  // DRAW CONDITION DETECTION
  // =============================================================================

  public isInsufficientMaterial(board: Chess): boolean {
    const material = getMaterialCounts(board);
    const whitePieces = getTotalPieces(material.white);
    const blackPieces = getTotalPieces(material.black);

    // King vs King
    if (whitePieces === 1 && blackPieces === 1) return true;

    // King and Bishop/Knight vs King
    if ((whitePieces === 2 && blackPieces === 1) || (whitePieces === 1 && blackPieces === 2)) {
      const morePieces = whitePieces === 2 ? material.white : material.black;
      return morePieces.bishop === 1 || morePieces.knight === 1;
    }

    // King and Bishop vs King and Bishop (same color squares)
    if (whitePieces === 2 && blackPieces === 2 && 
        material.white.bishop === 1 && material.black.bishop === 1) {
      return this.bishopsOnSameColorSquares(board);
    }

    return false;
  }

  public isFiftyMoveRule(board: Chess): boolean {
    const fen = board.fen();
    const halfmoveCount = parseInt(fen.split(' ')[4]);
    return halfmoveCount >= 100; // 50 moves = 100 half-moves
  }

  public isThreefoldRepetition(): boolean {
    if (this.positionHistory.length < 3) return false;

    const positionCounts: { [key: string]: number } = {};
    
    for (const position of this.positionHistory) {
      const normalizedPosition = this.normalizePositionForRepetition(position);
      positionCounts[normalizedPosition] = (positionCounts[normalizedPosition] || 0) + 1;
      
      if (positionCounts[normalizedPosition] >= 3) {
        return true;
      }
    }
    
    return false;
  }

  private normalizePositionForRepetition(fen: string): string {
    // For threefold repetition, we only care about piece positions and castling rights
    const parts = fen.split(' ');
    return `${parts[0]} ${parts[1]} ${parts[2]}`; // position, turn, castling
  }

  private bishopsOnSameColorSquares(board: Chess): boolean {
    const squares = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
    let whiteBishopSquare: Square | null = null;
    let blackBishopSquare: Square | null = null;

    for (const file of squares) {
      for (const rank of ranks) {
        const square = `${file}${rank}` as Square;
        const piece = board.get(square);
        
        if (piece && piece.type === 'b') {
          if (piece.color === 'w') whiteBishopSquare = square;
          if (piece.color === 'b') blackBishopSquare = square;
        }
      }
    }

    if (!whiteBishopSquare || !blackBishopSquare) return false;

    const whiteSquareColor = this.getSquareColor(whiteBishopSquare);
    const blackSquareColor = this.getSquareColor(blackBishopSquare);
    
    return whiteSquareColor === blackSquareColor;
  }

  private getSquareColor(square: Square): 'light' | 'dark' {
    const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
    const rank = parseInt(square[1]) - 1; // 1=0, 2=1, etc.
    return (file + rank) % 2 === 0 ? 'dark' : 'light';
  }

  // =============================================================================
  // MATERIAL ANALYSIS
  // =============================================================================

  private calculateMaterialBalance(board: Chess): MaterialBalance {
    const counts = getMaterialCounts(board);
    const whiteValue = getMaterialValue(counts.white);
    const blackValue = getMaterialValue(counts.black);
    const difference = whiteValue - blackValue;

    let advantage: PieceColor | 'balanced';
    if (difference > 0) advantage = 'white';
    else if (difference < 0) advantage = 'black';
    else advantage = 'balanced';

    return {
      white: counts.white,
      black: counts.black,
      totalWhite: whiteValue,
      totalBlack: blackValue,
      advantage,
      difference: Math.abs(difference),
    };
  }

  // =============================================================================
  // ENDGAME CLASSIFICATION
  // =============================================================================

  private classifyEndgameType(material: MaterialBalance): EndgameType {
    const whitePieces = getTotalPieces(material.white);
    const blackPieces = getTotalPieces(material.black);
    const totalPieces = whitePieces + blackPieces;

    // Check for very specific endgame patterns first
    const tablebaseResult = this.classifyTablebasePosition(material);
    if (tablebaseResult !== 'tablebase_position') {
      return tablebaseResult;
    }

    // Pawn endgames (only kings and pawns)
    if (this.isPawnEndgame(material)) return 'pawn_endgame';

    // Complex endgames (many pieces - starting position or near it)
    if (totalPieces >= 20) return 'complex_endgame';

    // Queen endgames (at least one queen present)
    if (material.white.queen > 0 || material.black.queen > 0) return 'queen_endgame';

    // Rook endgames (at least one rook, no queens)
    if ((material.white.rook > 0 || material.black.rook > 0) && 
        material.white.queen === 0 && material.black.queen === 0) return 'rook_endgame';

    // Minor piece endgames (bishops/knights, no queens/rooks)
    if (this.isMinorPieceEndgame(material)) return 'minor_piece_endgame';

    // Very few pieces with no specific classification - tablebase territory
    if (totalPieces <= 7) {
      return 'tablebase_position';
    }

    return 'complex_endgame';
  }

  private classifyTablebasePosition(material: MaterialBalance): EndgameType {
    const white = material.white;
    const black = material.black;
    const whitePieces = getTotalPieces(white);
    const blackPieces = getTotalPieces(black);

    // King and Queen vs King
    if ((white.queen === 1 && whitePieces === 2 && blackPieces === 1) ||
        (black.queen === 1 && blackPieces === 2 && whitePieces === 1)) {
      return 'king_and_queen';
    }

    // King and Rook vs King
    if ((white.rook === 1 && whitePieces === 2 && blackPieces === 1) ||
        (black.rook === 1 && blackPieces === 2 && whitePieces === 1)) {
      return 'king_and_rook';
    }

    // King and Bishop(s) vs King
    if ((white.bishop > 0 && white.queen === 0 && white.rook === 0 && white.knight === 0 && white.pawn === 0 && blackPieces === 1) ||
        (black.bishop > 0 && black.queen === 0 && black.rook === 0 && black.knight === 0 && black.pawn === 0 && whitePieces === 1)) {
      return 'king_and_bishops';
    }

    // King and Knight(s) vs King
    if ((white.knight > 0 && white.queen === 0 && white.rook === 0 && white.bishop === 0 && white.pawn === 0 && blackPieces === 1) ||
        (black.knight > 0 && black.queen === 0 && black.rook === 0 && black.bishop === 0 && black.pawn === 0 && whitePieces === 1)) {
      return 'king_and_knights';
    }

    // King and Pawns vs King
    if ((white.pawn > 0 && white.queen === 0 && white.rook === 0 && white.bishop === 0 && white.knight === 0 && blackPieces === 1) ||
        (black.pawn > 0 && black.queen === 0 && black.rook === 0 && black.bishop === 0 && black.knight === 0 && whitePieces === 1)) {
      return 'king_and_pawns';
    }

    return 'tablebase_position';
  }

  private isPawnEndgame(material: MaterialBalance): boolean {
    return material.white.queen === 0 && material.white.rook === 0 && 
           material.white.bishop === 0 && material.white.knight === 0 &&
           material.black.queen === 0 && material.black.rook === 0 && 
           material.black.bishop === 0 && material.black.knight === 0 &&
           (material.white.pawn > 0 || material.black.pawn > 0);
  }

  private isMinorPieceEndgame(material: MaterialBalance): boolean {
    return material.white.queen === 0 && material.white.rook === 0 &&
           material.black.queen === 0 && material.black.rook === 0 &&
           (material.white.bishop > 0 || material.white.knight > 0 ||
            material.black.bishop > 0 || material.black.knight > 0);
  }

  // =============================================================================
  // CHECKMATE PATTERN DETECTION
  // =============================================================================

  public detectCheckmatePattern(board: Chess): CheckmatePattern | null {
    if (!board.isCheckmate()) return null;

    for (const pattern of CHECKMATE_PATTERNS) {
      if (pattern.pattern(board)) {
        return pattern;
      }
    }

    return null;
  }

  // =============================================================================
  // DESCRIPTION GENERATION
  // =============================================================================

  private generateDescription(status: GameStatus, reason: EndgameReason, type?: EndgameType): string {
    switch (reason) {
      case 'checkmate':
        return `Game ended in checkmate${type ? ` (${this.formatEndgameType(type)})` : ''}`;
      case 'stalemate':
        return 'Game ended in stalemate - no legal moves available';
      case 'insufficient_material':
        return 'Draw by insufficient material to deliver checkmate';
      case 'fifty_move_rule':
        return 'Draw by fifty-move rule - no pawn move or capture in 50 moves';
      case 'threefold_repetition':
        return 'Draw by threefold repetition of position';
      case 'agreement':
        return 'Draw by mutual agreement';
      case 'resignation':
        return 'Game ended by resignation';
      case 'timeout':
        return 'Game ended by timeout';
      default:
        return `Game in progress${type ? ` (${this.formatEndgameType(type)} phase)` : ''}`;
    }
  }

  private formatEndgameType(type: EndgameType): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  public resetHistory(): void {
    this.positionHistory = [];
    this.moveHistory = [];
  }

  public updateHistory(fen: string, move?: Move): void {
    this.positionHistory.push(fen);
    if (move) {
      this.moveHistory.push(move);
    }
  }

  public getPositionHistory(): string[] {
    return [...this.positionHistory];
  }

  public getMoveHistory(): Move[] {
    return [...this.moveHistory];
  }
}