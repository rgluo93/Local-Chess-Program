/**
 * NotationGenerator - Complete Algebraic Notation System
 * 
 * This class provides comprehensive chess notation generation including:
 * - Standard Algebraic Notation (SAN)
 * - Long Algebraic Notation (LAN) support
 * - PGN format generation with headers and metadata
 * - FEN string generation and parsing
 */

import { Chess } from 'chess.js';
import type {
  Move,
  Square,
  PieceColor,
  PieceType,
  GameStatus,
  GameResult,
} from '../types/Chess';

export interface PGNHeaders {
  Event?: string;
  Site?: string;
  Date?: string;
  Round?: string;
  White?: string;
  Black?: string;
  Result?: string;
  WhiteElo?: string;
  BlackElo?: string;
  TimeControl?: string;
  ECO?: string;
  Opening?: string;
  Variation?: string;
  Annotator?: string;
  [key: string]: string | undefined;
}

export interface PGNOptions {
  includeHeaders?: boolean;
  includeComments?: boolean;
  includeNAG?: boolean; // Numeric Annotation Glyphs
  maxLineLength?: number;
  includeClock?: boolean;
}

export interface FENComponents {
  pieces: string;
  turn: string;
  castling: string;
  enPassant: string;
  halfmove: string;
  fullmove: string;
}

export interface NotationOptions {
  format?: 'san' | 'lan';
  includeCheck?: boolean;
  includeCapture?: boolean;
  disambiguate?: boolean;
}

export class NotationGenerator {
  private chess: Chess;
  private moveHistory: Move[] = [];
  private comments: Map<number, string[]> = new Map();
  private headers: PGNHeaders = {};

  constructor(fen?: string) {
    this.chess = fen ? new Chess(fen) : new Chess();
  }

  // =============================================================================
  // MOVE NOTATION GENERATION
  // =============================================================================

  public generateMoveNotation(move: Move, options: NotationOptions = {}): string {
    const opts = {
      format: 'san' as const,
      includeCheck: true,
      includeCapture: true,
      disambiguate: true,
      ...options,
    };

    if (opts.format === 'lan') {
      return this.generateLAN(move);
    }
    
    return this.generateSAN(move, opts);
  }

  private generateSAN(move: Move, options: NotationOptions): string {
    let notation = '';

    // Handle castling
    if (move.specialMove === 'castling') {
      if (move.to === 'g1' || move.to === 'g8') {
        return 'O-O';
      } else if (move.to === 'c1' || move.to === 'c8') {
        return 'O-O-O';
      }
    }

    // Handle piece moves (not pawns)
    if (move.piece !== 'pawn') {
      notation += this.getPieceSymbol(move.piece);

      // Add disambiguation if needed
      if (options.disambiguate && move.ambiguous) {
        if (move.ambiguous.file) {
          notation += move.from[0]; // Add file
        } else if (move.ambiguous.rank) {
          notation += move.from[1]; // Add rank
        } else {
          notation += move.from; // Add full square
        }
      }
    }

    // Add capture notation
    if (options.includeCapture && move.capture) {
      if (move.piece === 'pawn') {
        notation += move.from[0]; // Pawn captures include file
      }
      notation += 'x';
    }

    // Add destination square
    notation += move.to;

    // Handle pawn promotion
    if (move.promotion) {
      notation += '=' + this.getPieceSymbol(move.promotion);
    }

    // Handle en passant
    if (move.specialMove === 'enPassant') {
      notation += ' e.p.';
    }

    // Add check/checkmate
    if (options.includeCheck) {
      if (move.checkmate) {
        notation += '#';
      } else if (move.check) {
        notation += '+';
      }
    }

    return notation;
  }

  private generateLAN(move: Move): string {
    let notation = '';

    // Handle castling
    if (move.specialMove === 'castling') {
      if (move.to === 'g1' || move.to === 'g8') {
        return 'O-O';
      } else if (move.to === 'c1' || move.to === 'c8') {
        return 'O-O-O';
      }
    }

    // Add piece symbol (not for pawns)
    if (move.piece !== 'pawn') {
      notation += this.getPieceSymbol(move.piece);
    }

    // Always include from square in LAN
    notation += move.from;

    // Add capture notation
    if (move.capture) {
      notation += 'x';
    } else {
      notation += '-';
    }

    // Add destination square
    notation += move.to;

    // Handle pawn promotion
    if (move.promotion) {
      notation += '=' + this.getPieceSymbol(move.promotion);
    }

    // Add check/checkmate
    if (move.checkmate) {
      notation += '#';
    } else if (move.check) {
      notation += '+';
    }

    return notation;
  }

  private getPieceSymbol(piece: PieceType): string {
    const symbols = {
      king: 'K',
      queen: 'Q',
      rook: 'R',
      bishop: 'B',
      knight: 'N',
      pawn: '',
    };
    return symbols[piece];
  }

  // =============================================================================
  // PGN GENERATION
  // =============================================================================

  public generatePGN(moves: Move[], options: PGNOptions = {}): string {
    const opts = {
      includeHeaders: true,
      includeComments: false,
      includeNAG: false,
      maxLineLength: 80,
      includeClock: false,
      ...options,
    };

    let pgn = '';

    // Add headers
    if (opts.includeHeaders) {
      pgn += this.generatePGNHeaders();
      if (pgn.length > 0) pgn += '\n';
    }

    // Add moves
    pgn += this.generatePGNMoves(moves, opts);

    return pgn;
  }

  private generatePGNHeaders(): string {
    const standardHeaders = ['Event', 'Site', 'Date', 'Round', 'White', 'Black', 'Result'];
    let headers = '';

    // Add standard headers first
    for (const header of standardHeaders) {
      if (this.headers[header]) {
        headers += `[${header} "${this.headers[header]}"]\n`;
      }
    }

    // Add other headers
    for (const [key, value] of Object.entries(this.headers)) {
      if (!standardHeaders.includes(key) && value) {
        headers += `[${key} "${value}"]\n`;
      }
    }

    return headers;
  }

  private generatePGNMoves(moves: Move[], options: PGNOptions): string {
    let pgn = '';
    let currentLine = '';

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const moveNumber = Math.floor(i / 2) + 1;
      const isWhiteMove = i % 2 === 0;

      // Add move number for white moves or if starting from black
      if (isWhiteMove) {
        const moveNumText = `${moveNumber}. `;
        if (currentLine.length + moveNumText.length > options.maxLineLength!) {
          pgn += currentLine.trimEnd() + '\n';
          currentLine = '';
        }
        currentLine += moveNumText;
      } else if (i === 0) {
        // Starting from black move
        const moveNumText = `${moveNumber}... `;
        currentLine += moveNumText;
      }

      // Add move notation
      const notation = this.generateMoveNotation(move, { format: 'san' });
      if (currentLine.length + notation.length > options.maxLineLength!) {
        pgn += currentLine.trimEnd() + '\n';
        currentLine = '';
      }
      currentLine += notation;

      // Add comments if enabled
      if (options.includeComments) {
        const comments = this.comments.get(i);
        if (comments && comments.length > 0) {
          for (const comment of comments) {
            const commentText = ` {${comment}}`;
            if (currentLine.length + commentText.length > options.maxLineLength!) {
              pgn += currentLine.trimEnd() + '\n';
              currentLine = '';
            }
            currentLine += commentText;
          }
        }
      }

      // Add space between moves
      if (i < moves.length - 1) {
        currentLine += ' ';
      }
    }

    // Add remaining line
    if (currentLine.trim()) {
      pgn += currentLine.trimEnd();
    }

    // Add game result
    const result = this.headers.Result || '*';
    pgn += ' ' + result;

    return pgn;
  }

  // =============================================================================
  // FEN GENERATION AND PARSING
  // =============================================================================

  public generateFEN(): string {
    return this.chess.fen();
  }

  public parseFEN(fen: string): FENComponents | null {
    const parts = fen.trim().split(/\s+/);
    
    if (parts.length !== 6) {
      return null;
    }

    try {
      // Validate by trying to load the FEN
      const testChess = new Chess(fen);
      
      return {
        pieces: parts[0],
        turn: parts[1],
        castling: parts[2],
        enPassant: parts[3],
        halfmove: parts[4],
        fullmove: parts[5],
      };
    } catch {
      return null;
    }
  }

  public validateFEN(fen: string): boolean {
    try {
      new Chess(fen);
      return true;
    } catch {
      return false;
    }
  }

  // =============================================================================
  // POSITION DESCRIPTION
  // =============================================================================

  public describePosition(): string {
    const turn = this.chess.turn() === 'w' ? 'White' : 'Black';
    let description = `${turn} to move`;

    if (this.chess.inCheck()) {
      description += ', in check';
    }

    if (this.chess.isCheckmate()) {
      description += ', checkmate';
    } else if (this.chess.isStalemate()) {
      description += ', stalemate';
    } else if (this.chess.isDraw()) {
      description += ', draw';
    }

    return description;
  }

  // =============================================================================
  // HEADERS AND METADATA MANAGEMENT
  // =============================================================================

  public setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  public getHeader(key: string): string | undefined {
    return this.headers[key];
  }

  public setHeaders(headers: PGNHeaders): void {
    this.headers = { ...this.headers, ...headers };
  }

  public getHeaders(): PGNHeaders {
    return { ...this.headers };
  }

  public clearHeaders(): void {
    this.headers = {};
  }

  // =============================================================================
  // COMMENTS MANAGEMENT
  // =============================================================================

  public addComment(moveIndex: number, comment: string): void {
    if (!this.comments.has(moveIndex)) {
      this.comments.set(moveIndex, []);
    }
    this.comments.get(moveIndex)!.push(comment);
  }

  public getComments(moveIndex: number): string[] {
    return this.comments.get(moveIndex) || [];
  }

  public removeComment(moveIndex: number, commentIndex: number): boolean {
    const comments = this.comments.get(moveIndex);
    if (!comments || commentIndex < 0 || commentIndex >= comments.length) {
      return false;
    }
    comments.splice(commentIndex, 1);
    if (comments.length === 0) {
      this.comments.delete(moveIndex);
    }
    return true;
  }

  public clearComments(): void {
    this.comments.clear();
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  public fromPGN(pgn: string): boolean {
    try {
      // Parse headers
      const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g;
      let match;
      const headers: PGNHeaders = {};

      while ((match = headerRegex.exec(pgn)) !== null) {
        headers[match[1]] = match[2];
      }

      this.setHeaders(headers);

      // Extract moves section (after headers)
      const movesSection = pgn.replace(/\[.*?\]\s*/g, '').trim();
      
      // Load into Chess.js for validation
      this.chess = new Chess();
      this.chess.loadPgn(pgn);

      return true;
    } catch {
      return false;
    }
  }

  public getMovesFromPGN(pgn: string): Move[] {
    try {
      const tempChess = new Chess();
      tempChess.loadPgn(pgn);
      return tempChess.history({ verbose: true }).map(move => ({
        from: move.from as Square,
        to: move.to as Square,
        piece: this.convertChessjsPiece(move.piece),
        color: move.color === 'w' ? 'white' : 'black',
        notation: move.san,
        capture: Boolean(move.captured),
        check: tempChess.inCheck(),
        checkmate: tempChess.isCheckmate(),
        promotion: move.promotion ? this.convertChessjsPiece(move.promotion) : false,
        specialMove: move.flags.includes('k') || move.flags.includes('q') ? 'castling' :
                    move.flags.includes('e') ? 'enPassant' : undefined,
      }));
    } catch {
      return [];
    }
  }

  private convertChessjsPiece(piece: string): PieceType {
    const pieceMap: { [key: string]: PieceType } = {
      'p': 'pawn',
      'n': 'knight',
      'b': 'bishop',
      'r': 'rook',
      'q': 'queen',
      'k': 'king',
    };
    return pieceMap[piece.toLowerCase()] || 'pawn';
  }

  // =============================================================================
  // EXPORT METHODS
  // =============================================================================

  public exportToAlgebraic(moves: Move[], longForm = false): string[] {
    return moves.map(move => 
      this.generateMoveNotation(move, { format: longForm ? 'lan' : 'san' })
    );
  }

  public exportToPGN(moves: Move[], options?: PGNOptions): string {
    return this.generatePGN(moves, options);
  }

  public exportToFEN(): string {
    return this.generateFEN();
  }

  // =============================================================================
  // POSITION ANALYSIS
  // =============================================================================

  public analyzeMoveAmbiguity(from: Square, to: Square, piece: PieceType): boolean {
    // Check if multiple pieces of the same type can reach the target square
    const moves = this.chess.moves({ verbose: true });
    const samePieceMoves = moves.filter(move => 
      move.piece === piece.charAt(0) && 
      move.to === to && 
      move.from !== from
    );

    return samePieceMoves.length > 0;
  }

  public getGameResult(): string {
    if (this.chess.isCheckmate()) {
      return this.chess.turn() === 'w' ? '0-1' : '1-0';
    } else if (this.chess.isDraw() || this.chess.isStalemate()) {
      return '1/2-1/2';
    } else {
      return '*';
    }
  }

  // =============================================================================
  // CLEANUP AND RESET
  // =============================================================================

  public reset(fen?: string): void {
    this.chess = fen ? new Chess(fen) : new Chess();
    this.moveHistory = [];
    this.comments.clear();
    this.headers = {};
  }

  public clone(): NotationGenerator {
    const cloned = new NotationGenerator(this.chess.fen());
    cloned.setHeaders(this.getHeaders());
    
    // Copy comments
    for (const [index, comments] of this.comments.entries()) {
      for (const comment of comments) {
        cloned.addComment(index, comment);
      }
    }

    return cloned;
  }
}