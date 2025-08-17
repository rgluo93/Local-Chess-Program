/**
 * MoveHistoryManager - Enhanced Move History Management
 * 
 * This class provides advanced move history functionality including:
 * - Complete move tracking with metadata
 * - History navigation (forward/backward)
 * - Move analysis and annotation support
 * - Game replay capabilities
 */

import type {
  Move,
  Square,
  PieceColor,
  GameStatus,
  ChessBoard,
} from '../types/Chess';
import type {
  MoveHistoryEntry,
  GameReplay,
  MoveAnalysis,
} from '../types/GameState';

export interface MoveHistoryOptions {
  enableAnalysis?: boolean;
  enableComments?: boolean;
  enableTiming?: boolean;
  maxHistorySize?: number;
}

export interface NavigationResult {
  success: boolean;
  currentIndex: number;
  move?: Move;
  position?: string; // FEN
}

export interface ReplayOptions {
  speed?: number; // moves per second
  autoPlay?: boolean;
  startFromMove?: number;
  endAtMove?: number;
}

export class MoveHistoryManager {
  private history: MoveHistoryEntry[] = [];
  private currentIndex: number = -1; // -1 means at the start position
  private replay: GameReplay;
  private options: MoveHistoryOptions;
  private replayTimer?: NodeJS.Timeout;

  constructor(options: MoveHistoryOptions = {}) {
    this.options = {
      enableAnalysis: false,
      enableComments: true,
      enableTiming: true,
      maxHistorySize: 1000,
      ...options,
    };

    this.replay = {
      moves: [],
      currentIndex: 0,
      isReplaying: false,
      playbackSpeed: 1.0,
      autoPlay: false,
    };
  }

  // =============================================================================
  // MOVE MANAGEMENT
  // =============================================================================

  public addMove(
    move: Move,
    position: string,
    analysis?: MoveAnalysis,
    timeSpent?: number,
    comments?: string[]
  ): void {
    const entry: MoveHistoryEntry = {
      move,
      position,
      analysis: this.options.enableAnalysis ? analysis : undefined,
      timeSpent: this.options.enableTiming ? timeSpent : undefined,
      comments: this.options.enableComments ? comments : undefined,
    };

    // If we're in the middle of history and add a new move, truncate future moves
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(entry);
    this.currentIndex = this.history.length - 1;

    // Limit history size
    if (this.history.length > this.options.maxHistorySize!) {
      const excess = this.history.length - this.options.maxHistorySize!;
      this.history = this.history.slice(excess);
      this.currentIndex -= excess;
    }
  }

  public getMove(index: number): MoveHistoryEntry | null {
    if (index < 0 || index >= this.history.length) return null;
    return { ...this.history[index] };
  }

  public getCurrentMove(): MoveHistoryEntry | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
      return null;
    }
    return { ...this.history[this.currentIndex] };
  }

  public getLastMove(): MoveHistoryEntry | null {
    if (this.history.length === 0) return null;
    return { ...this.history[this.history.length - 1] };
  }

  public getAllMoves(): MoveHistoryEntry[] {
    return this.history.map(entry => ({ ...entry }));
  }

  // =============================================================================
  // HISTORY NAVIGATION
  // =============================================================================

  public goToStart(): NavigationResult {
    this.currentIndex = -1;
    return {
      success: true,
      currentIndex: this.currentIndex,
      position: this.getPositionAtIndex(-1),
    };
  }

  public goToEnd(): NavigationResult {
    this.currentIndex = this.history.length - 1;
    const move = this.currentIndex >= 0 ? this.history[this.currentIndex]?.move : undefined;
    
    return {
      success: true,
      currentIndex: this.currentIndex,
      move,
      position: this.getPositionAtIndex(this.currentIndex),
    };
  }

  public goToMove(index: number): NavigationResult {
    if (index < -1 || index >= this.history.length) {
      return {
        success: false,
        currentIndex: this.currentIndex,
      };
    }

    this.currentIndex = index;
    const move = index >= 0 ? this.history[index]?.move : undefined;

    return {
      success: true,
      currentIndex: this.currentIndex,
      move,
      position: this.getPositionAtIndex(index),
    };
  }

  public goForward(): NavigationResult {
    if (this.currentIndex >= this.history.length - 1) {
      return {
        success: false,
        currentIndex: this.currentIndex,
      };
    }

    this.currentIndex++;
    const entry = this.history[this.currentIndex];

    return {
      success: true,
      currentIndex: this.currentIndex,
      move: entry.move,
      position: this.getPositionAtIndex(this.currentIndex),
    };
  }

  public goBackward(): NavigationResult {
    if (this.currentIndex <= -1) {
      return {
        success: false,
        currentIndex: this.currentIndex,
      };
    }

    this.currentIndex--;
    const move = this.currentIndex >= 0 ? this.history[this.currentIndex]?.move : undefined;

    return {
      success: true,
      currentIndex: this.currentIndex,
      move,
      position: this.getPositionAtIndex(this.currentIndex),
    };
  }

  // =============================================================================
  // REPLAY FUNCTIONALITY
  // =============================================================================

  public startReplay(options: ReplayOptions = {}): boolean {
    if (this.history.length === 0) return false;

    this.replay = {
      moves: this.history.map(entry => entry.move),
      currentIndex: options.startFromMove || 0,
      isReplaying: true,
      playbackSpeed: options.speed || 1.0,
      autoPlay: options.autoPlay !== false,
    };

    // Start from the beginning
    this.currentIndex = -1;

    if (this.replay.autoPlay) {
      this.scheduleNextReplayMove();
    }

    return true;
  }

  public stopReplay(): void {
    this.replay.isReplaying = false;
    if (this.replayTimer) {
      clearTimeout(this.replayTimer);
      this.replayTimer = undefined;
    }
  }

  public pauseReplay(): void {
    if (this.replayTimer) {
      clearTimeout(this.replayTimer);
      this.replayTimer = undefined;
    }
  }

  public resumeReplay(): void {
    if (this.replay.isReplaying && this.replay.autoPlay) {
      this.scheduleNextReplayMove();
    }
  }

  public replayNextMove(): NavigationResult | null {
    if (!this.replay.isReplaying) return null;

    const nextIndex = this.currentIndex + 1;
    if (nextIndex >= this.history.length) {
      this.stopReplay();
      return null;
    }

    return this.goToMove(nextIndex);
  }

  public setReplaySpeed(speed: number): void {
    this.replay.playbackSpeed = Math.max(0.1, Math.min(10.0, speed));
  }

  public getReplayState(): GameReplay {
    return { ...this.replay };
  }

  // =============================================================================
  // ANALYSIS AND ANNOTATIONS
  // =============================================================================

  public addAnalysis(index: number, analysis: MoveAnalysis): boolean {
    if (index < 0 || index >= this.history.length) return false;

    this.history[index].analysis = analysis;
    return true;
  }

  public addComment(index: number, comment: string): boolean {
    if (index < 0 || index >= this.history.length) return false;

    if (!this.history[index].comments) {
      this.history[index].comments = [];
    }
    this.history[index].comments!.push(comment);
    return true;
  }

  public removeComment(index: number, commentIndex: number): boolean {
    if (index < 0 || index >= this.history.length) return false;
    if (!this.history[index].comments) return false;
    if (commentIndex < 0 || commentIndex >= this.history[index].comments!.length) return false;

    this.history[index].comments!.splice(commentIndex, 1);
    return true;
  }

  public getMovesWithAnalysis(): MoveHistoryEntry[] {
    return this.history.filter(entry => entry.analysis).map(entry => ({ ...entry }));
  }

  public getMovesWithComments(): MoveHistoryEntry[] {
    return this.history.filter(entry => entry.comments && entry.comments.length > 0)
      .map(entry => ({ ...entry }));
  }

  // =============================================================================
  // STATISTICS AND ANALYSIS
  // =============================================================================

  public getTotalMoves(): number {
    return this.history.length;
  }

  public getTotalTime(): number {
    return this.history.reduce((total, entry) => total + (entry.timeSpent || 0), 0);
  }

  public getAverageTimePerMove(): number {
    const totalTime = this.getTotalTime();
    return this.history.length > 0 ? totalTime / this.history.length : 0;
  }

  public getMovesByColor(color: PieceColor): MoveHistoryEntry[] {
    return this.history.filter(entry => entry.move.color === color)
      .map(entry => ({ ...entry }));
  }

  public getBlunders(): MoveHistoryEntry[] {
    return this.history.filter(entry => entry.analysis?.isBlunder)
      .map(entry => ({ ...entry }));
  }

  public getBrilliantMoves(): MoveHistoryEntry[] {
    return this.history.filter(entry => entry.analysis?.isBrilliant)
      .map(entry => ({ ...entry }));
  }

  // =============================================================================
  // SERIALIZATION
  // =============================================================================

  public toJSON(): string {
    return JSON.stringify({
      history: this.history,
      currentIndex: this.currentIndex,
      options: this.options,
    });
  }

  public fromJSON(json: string): boolean {
    try {
      const data = JSON.parse(json);
      
      if (!Array.isArray(data.history)) return false;
      
      this.history = data.history;
      this.currentIndex = typeof data.currentIndex === 'number' ? data.currentIndex : -1;
      
      if (data.options) {
        this.options = { ...this.options, ...data.options };
      }
      
      return true;
    } catch {
      return false;
    }
  }

  public clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.stopReplay();
  }

  public undoLastMove(): boolean {
    if (this.history.length === 0) {
      return false;
    }
    
    // Remove the last move from history
    this.history.pop();
    
    // Adjust current index
    if (this.currentIndex >= this.history.length) {
      this.currentIndex = this.history.length - 1;
    }
    
    return true;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  public canGoForward(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  public canGoBackward(): boolean {
    return this.currentIndex >= 0;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getHistoryLength(): number {
    return this.history.length;
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private getPositionAtIndex(index: number): string | undefined {
    if (index === -1) return undefined; // Start position
    if (index < 0 || index >= this.history.length) return undefined;
    return this.history[index].position;
  }

  private scheduleNextReplayMove(): void {
    if (!this.replay.isReplaying || !this.replay.autoPlay) return;

    const delay = 1000 / this.replay.playbackSpeed; // Convert speed to milliseconds
    
    this.replayTimer = setTimeout(() => {
      const result = this.replayNextMove();
      if (result && this.replay.isReplaying) {
        this.scheduleNextReplayMove();
      }
    }, delay);
  }
}