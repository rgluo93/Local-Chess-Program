/**
 * StockfishEngine - Stockfish.js Integration Wrapper
 * 
 * Provides a TypeScript interface to Stockfish chess engine using
 * WebAssembly and Web Workers for non-blocking AI calculations.
 */

import type { Move } from '../types/Chess';
import type { 
  EngineOptions, 
  EvaluationResult, 
  AIError, 
  AIErrorType, 
  ThinkingMove 
} from './types/AITypes';
import type { UCIResponse, UCIInfo, UCIBestMove } from './types/UCITypes';

export class StockfishEngine {
  private worker: Worker | null = null;
  private initialized = false;
  private ready = false;
  private thinking = false;
  private currentPosition = '';
  private thinkingMoves: ThinkingMove[] = [];
  private pendingCommands = new Map<string, { resolve: Function; reject: Function; timeout?: NodeJS.Timeout }>();
  private commandId = 0;
  private evaluationCallback: ((evaluation: number, depth: number, mateIn?: number) => void) | null = null;

  constructor() {
    // Constructor intentionally empty - initialization happens in initialize()
  }

  /**
   * Set callback function for real-time evaluation updates
   */
  setEvaluationCallback(callback: (evaluation: number, depth: number, mateIn?: number) => void): void {
    this.evaluationCallback = callback;
  }

  /**
   * Get whose turn it is from FEN string
   */
  private getTurnFromFEN(fen: string): 'w' | 'b' {
    const parts = fen.split(' ');
    return parts[1] as 'w' | 'b';
  }

  /**
   * Initialize the Stockfish engine
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new Error('Engine already initialized');
    }

    try {
      // Create Web Worker for Stockfish
      this.worker = new Worker(new URL('./ai-worker.ts', import.meta.url), {
        type: 'module'
      });

      // Setup message handling
      this.worker.onmessage = (event) => {
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = (error) => {
        this.handleWorkerError(error);
      };

      // Initialize UCI communication
      await this.sendCommand('uci');
      await this.sendCommand('isready');
      
      this.initialized = true;
      this.ready = true;
    } catch (error) {
      throw new Error(`Engine initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set the current position using FEN string
   */
  async setPosition(fen: string): Promise<void> {
    console.log('📍 StockfishEngine.setPosition() called with FEN:', fen);
    
    if (!this.isReady()) {
      throw new Error('Engine not ready');
    }

    // Basic FEN validation
    if (!this.isValidFEN(fen)) {
      throw new Error('Invalid FEN string');
    }

    this.currentPosition = fen;
    const positionCommand = `position fen ${fen}`;
    console.log('📤 Sending position command to real Stockfish:', positionCommand);
    
    // Real Stockfish doesn't respond to position commands, so we send it directly
    if (this.worker) {
      this.worker.postMessage({ command: positionCommand, id: `position_${Date.now()}` });
    }
    
    console.log('✅ Position command sent to real Stockfish');
  }

  /**
   * Get the best move from current position
   */
  async getBestMove(options: EngineOptions = {}): Promise<Move> {
    if (!this.isReady()) {
      throw new Error('Engine not ready');
    }

    if (this.thinking) {
      throw new Error('Engine is already thinking');
    }

    try {
      this.thinking = true;
      this.thinkingMoves = [];

      // Build go command
      let goCommand = 'go';
      if (options.depth) {
        goCommand += ` depth ${options.depth}`;
      } else if (options.timeLimit) {
        goCommand += ` movetime ${options.timeLimit}`;
      } else {
        goCommand += ' movetime 3000'; // Default 3 seconds
      }

      if (options.multiPV && options.multiPV > 1) {
        // Real Stockfish doesn't respond to setoption commands
        if (this.worker) {
          this.worker.postMessage({ 
            command: `setoption name MultiPV value ${options.multiPV}`, 
            id: `setoption_${Date.now()}` 
          });
        }
      }

      const response = await this.sendCommand(goCommand, options.timeLimit ? options.timeLimit + 1000 : 10000);
      
      const bestMove = this.parseBestMove(response);
      console.log('🎯 Stockfish returned raw UCI move:', bestMove.move);
      
      const moveObject = this.convertUCIToMove(bestMove.move);
      
      return moveObject;
    } finally {
      this.thinking = false;
      this.thinkingMoves = [];
    }
  }

  /**
   * Evaluate the current position (real-time updates via callback)
   */
  async evaluatePosition(depth: number = 12): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Engine not ready');
    }

    try {
      this.thinking = true;
      
      // Request evaluation with specified depth - no timeout for deep analysis
      const response = await this.sendCommand(`go depth ${depth}`, 0);
      
      // Info responses are automatically processed and sent to UI via callback
      // in parseInfoResponse method - no need to return anything
      
    } finally {
      this.thinking = false;
    }
  }

  /**
   * Get current thinking moves for visualization
   */
  getThinkingMoves(): ThinkingMove[] {
    return [...this.thinkingMoves];
  }

  /**
   * Stop current calculation
   */
  stop(): void {
    if (this.worker && this.thinking) {
      this.worker.postMessage('stop');
      this.thinking = false;
      
      // Reject any pending move calculations
      for (const [commandId, command] of this.pendingCommands) {
        if (commandId.startsWith('go')) {
          command.reject(new Error('Calculation stopped'));
          this.pendingCommands.delete(commandId);
        }
      }
    }
  }

  /**
   * Check if engine is ready
   */
  isReady(): boolean {
    return this.ready && this.initialized;
  }

  /**
   * Check if engine is currently thinking
   */
  isThinking(): boolean {
    return this.thinking;
  }

  /**
   * Terminate the engine and cleanup resources
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    this.initialized = false;
    this.ready = false;
    this.thinking = false;
    this.pendingCommands.clear();
  }


  /**
   * Send UCI command to engine
   */
  private async sendCommand(command: string, timeoutMs = 5000): Promise<string> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      const id = `${command}_${this.commandId++}`;
      
      let timeout: NodeJS.Timeout | undefined;
      
      // Only set timeout if timeoutMs > 0
      if (timeoutMs > 0) {
        timeout = setTimeout(() => {
          this.pendingCommands.delete(id);
          reject(new Error(`Command timeout: ${command}`));
        }, timeoutMs);
      }

      this.pendingCommands.set(id, { resolve, reject, timeout });
      this.worker!.postMessage({ command, id });
    });
  }

  /**
   * Handle messages from Web Worker
   */
  private handleWorkerMessage(data: { type: string; response: string; id?: string }): void {
    const { type, response, id } = data;

    if (type === 'uci_response') {
      this.processUCIResponse(response, id);
    } else if (type === 'info') {
      this.processInfoResponse(response);
    }
  }

  /**
   * Process UCI responses from engine
   */
  private processUCIResponse(response: string, id?: string): void {
    // Handle specific command responses
    if (id && this.pendingCommands.has(id)) {
      const command = this.pendingCommands.get(id)!;
      
      if (command.timeout) {
        clearTimeout(command.timeout);
      }
      
      if (response.includes('readyok') || response.includes('uciok') || response.startsWith('bestmove')) {
        command.resolve(response);
        this.pendingCommands.delete(id);
      } else if (response.includes('error')) {
        command.reject(new Error(`Engine error: ${response}`));
        this.pendingCommands.delete(id);
      }
    }
  }

  /**
   * Process info responses for thinking visualization
   */
  private processInfoResponse(response: string): void {
    if (!this.thinking) return;

    const info = this.parseInfoResponse(response);
    if (info && info.pv && info.pv.length > 0) {
      const move = this.convertUCIToMove(info.pv[0]);
      const evaluation = info.score?.cp || 0;
      const depth = info.depth || 0;
      
      // Update thinking moves for visualization
      const thinkingMove: ThinkingMove = {
        move,
        evaluation,
        depth,
        pv: info.pv.map(uciMove => this.convertUCIToMove(uciMove))
      };

      // Update or add thinking move
      const existingIndex = this.thinkingMoves.findIndex(tm => 
        tm.move.from === move.from && tm.move.to === move.to
      );
      
      if (existingIndex >= 0) {
        this.thinkingMoves[existingIndex] = thinkingMove;
      } else {
        this.thinkingMoves.push(thinkingMove);
      }

      // Sort by evaluation (best first)
      this.thinkingMoves.sort((a, b) => b.evaluation - a.evaluation);
      
      // Keep only top moves for performance
      if (this.thinkingMoves.length > 5) {
        this.thinkingMoves = this.thinkingMoves.slice(0, 5);
      }
    }
  }

  /**
   * Handle Worker errors
   */
  private handleWorkerError(error: ErrorEvent): void {
    const aiError: AIError = {
      type: 'ENGINE_CRASHED' as AIErrorType,
      message: `Engine worker error: ${error.message}`,
      originalError: new Error(error.message)
    };

    // Reject all pending commands
    for (const [id, command] of this.pendingCommands) {
      command.reject(aiError);
    }
    this.pendingCommands.clear();

    this.ready = false;
    this.thinking = false;
  }

  /**
   * Parse best move from UCI response
   */
  private parseBestMove(response: string): UCIBestMove {
    const bestMoveMatch = response.match(/bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/);
    if (!bestMoveMatch) {
      throw new Error('No best move found in response');
    }

    return {
      move: bestMoveMatch[1],
      ponder: response.includes('ponder') ? response.split('ponder ')[1] : undefined
    };
  }

  /**
   * Parse evaluation information from UCI response
   */
  private parseEvaluation(response: string): {
    score: number;
    depth: number;
    nodes: number;
    time: number;
    pv: string[];
  } {
    console.log('🔬 parseEvaluation received response:', response);
    const lines = response.split('\n');
    let bestInfo = { score: 0, depth: 0, nodes: 0, time: 0, pv: [] as string[] };

    for (const line of lines) {
      if (line.startsWith('info')) {
        console.log('🔍 Processing info line:', line);
        const info = this.parseInfoResponse(line);
        console.log('📋 Parsed info result:', info);
        
        if (info && info.depth && info.depth > bestInfo.depth) {
          let score = info.score?.cp || 0;
          
          // Handle mate scores with proper turn consideration
          if (info.score?.mate) {
            const currentTurn = this.getTurnFromFEN(this.currentPosition);
            if (currentTurn === 'w') {
              // White to move: positive mate = white advantage
              score = info.score.mate > 0 ? 999999 : -999999;
            } else {
              // Black to move: positive mate = black advantage (negative for white perspective)
              score = info.score.mate > 0 ? -999999 : 999999;
            }
          }
          
          console.log('🎯 Updating bestInfo with score:', score, 'from depth:', info.depth);
          
          bestInfo = {
            score: score,
            depth: info.depth,
            nodes: info.nodes || 0,
            time: info.time || 0,
            pv: info.pv || []
          };
        }
      }
    }

    console.log('🏆 Final bestInfo:', bestInfo);
    return bestInfo;
  }

  /**
   * Parse UCI info response
   */
  private parseInfoResponse(response: string): UCIInfo | null {
    if (!response.startsWith('info')) return null;

    const info: UCIInfo = {};
    const parts = response.split(' ');
    console.log('🔍 Parsing info response:', response);
    console.log('🔍 Split parts:', parts);

    for (let i = 1; i < parts.length; i++) {
      switch (parts[i]) {
        case 'depth':
          info.depth = parseInt(parts[++i]);
          console.log('📊 Parsed depth:', info.depth);
          break;
        case 'time':
          info.time = parseInt(parts[++i]);
          console.log('⏰ Parsed time:', info.time);
          break;
        case 'nodes':
          info.nodes = parseInt(parts[++i]);
          console.log('🌳 Parsed nodes:', info.nodes);
          break;
        case 'score':
          info.score = {};
          i++;
          if (parts[i] === 'cp') {
            info.score.cp = parseInt(parts[++i]);
            console.log('💯 Parsed centipawn score:', info.score.cp);
          } else if (parts[i] === 'mate') {
            info.score.mate = parseInt(parts[++i]);
            console.log('♔ Parsed mate score:', info.score.mate);
          }
          break;
        case 'pv':
          info.pv = [];
          for (let j = i + 1; j < parts.length; j++) {
            if (parts[j].match(/^[a-h][1-8][a-h][1-8][qrbn]?$/)) {
              info.pv.push(parts[j]);
            } else {
              break;
            }
          }
          console.log('🎯 Parsed PV:', info.pv);
          break;
        case 'multipv':
          info.multipv = parseInt(parts[++i]);
          break;
      }
    }

    console.log('✅ Final parsed info object:', info);
    
    // Call evaluation callback if we have a score and depth
    if (this.evaluationCallback && info.depth && info.score?.cp !== undefined) {
      console.log('📡 Sending evaluation to UI:', info.score.cp, 'at depth:', info.depth);
      this.evaluationCallback(info.score.cp, info.depth);
    } else if (this.evaluationCallback && info.depth && info.score?.mate !== undefined) {
      // Mate scores are relative to the current player to move
      // If it's white's turn: mate 5 = white mates in 5, mate -5 = black mates in 5
      // If it's black's turn: mate 5 = black mates in 5, mate -5 = white mates in 5
      const currentTurn = this.getTurnFromFEN(this.currentPosition);
      let mateScore: number;
      
      if (currentTurn === 'w') {
        // White to move: positive mate = white advantage, negative = black advantage
        mateScore = info.score.mate > 0 ? 999999 : -999999;
      } else {
        // Black to move: positive mate = black advantage, negative = white advantage
        mateScore = info.score.mate > 0 ? -999999 : 999999;
      }
      
      console.log('📡 Sending mate evaluation to UI:', mateScore, 'at depth:', info.depth, 'mate in:', Math.abs(info.score.mate), 'current turn:', currentTurn);
      this.evaluationCallback(mateScore, info.depth, Math.abs(info.score.mate));
    }
    
    return info;
  }

  /**
   * Convert UCI move notation to Move object
   */
  private convertUCIToMove(uciMove: string): Move {
    if (!uciMove || uciMove.length < 4) {
      throw new Error(`Invalid UCI move: ${uciMove}`);
    }

    const from = uciMove.substring(0, 2);
    const to = uciMove.substring(2, 4);
    const promotion = uciMove.length === 5 ? uciMove[4] : undefined;

    // We need to use a chess.js instance to properly determine piece info
    // Since we don't have access to the current FEN here, we'll create the move object
    // with the UCI data and let the validation layer handle the piece/color determination
    return {
      from: from as any,
      to: to as any,
      piece: 'p', // Will be corrected during validation
      color: 'w', // Will be corrected during validation
      promotion: promotion as any,
      san: uciMove // Will be corrected during validation with proper SAN
    };
  }

  /**
   * Determine piece type from position (simplified)
   */
  private determinePieceFromPosition(square: string): string {
    // This is a simplified implementation
    // In reality, you'd need to parse the current FEN position
    const rank = square[1];
    
    if (rank === '1' || rank === '8') {
      // Likely back rank piece
      const file = square[0];
      if (file === 'a' || file === 'h') return 'r'; // rook
      if (file === 'b' || file === 'g') return 'n'; // knight
      if (file === 'c' || file === 'f') return 'b'; // bishop
      if (file === 'd') return 'q'; // queen
      if (file === 'e') return 'k'; // king
    }
    
    // Default to pawn for other squares (simplified)
    return 'p';
  }

  /**
   * Determine color from position (simplified)
   */
  private determineColorFromPosition(square: string): 'w' | 'b' {
    const rank = parseInt(square[1]);
    return rank <= 4 ? 'w' : 'b'; // Simplified assumption
  }

  /**
   * Convert UCI move to Standard Algebraic Notation (simplified)
   */
  private convertToSAN(uciMove: string): string {
    // This is a simplified conversion
    // In a real implementation, you'd need full position analysis
    const from = uciMove.substring(0, 2);
    const to = uciMove.substring(2, 4);
    const promotion = uciMove.length === 5 ? `=${uciMove[4].toUpperCase()}` : '';
    
    return `${to}${promotion}`; // Simplified SAN
  }

  /**
   * Validate FEN string format
   */
  private isValidFEN(fen: string): boolean {
    // Basic FEN validation
    const parts = fen.split(' ');
    
    // Should have 6 parts
    if (parts.length !== 6) return false;
    
    // Board part should have 8 ranks separated by '/'
    const boardPart = parts[0];
    const ranks = boardPart.split('/');
    if (ranks.length !== 8) return false;
    
    // Each rank should be valid
    for (const rank of ranks) {
      if (!rank.match(/^[rnbqkpRNBQKP1-8]+$/)) return false;
    }
    
    // Active color should be 'w' or 'b'
    if (!['w', 'b'].includes(parts[1])) return false;
    
    return true;
  }
}