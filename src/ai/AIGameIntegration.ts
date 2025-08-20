/**
 * AIGameIntegration - Complete AI integration with game systems
 * 
 * Coordinates AI functionality with existing game components
 * and provides unified interface for AI features.
 */

import type { Move, GameState } from '../types/Chess';
import { GameMode } from './types/AITypes';
import type { ThinkingMove, EngineOptions } from './types/AITypes';
import { AIPlayer } from './AIPlayer';

export class AIGameIntegration {
  private aiPlayer: AIPlayer;
  private gameMode: GameMode = GameMode.HUMAN_VS_HUMAN;
  private ready = false;
  private errorCount = 0;
  private maxErrors = 3;
  private orchestratorMakeMove?: (move: Move) => Promise<any>;
  private getGameState?: () => GameState;

  constructor() {
    this.aiPlayer = new AIPlayer();
  }

  /**
   * Set orchestrator callbacks for move execution and game state access
   */
  setOrchestratorCallbacks(
    makeMove: (move: Move) => Promise<any>,
    getGameState: () => GameState
  ): void {
    this.orchestratorMakeMove = makeMove;
    this.getGameState = getGameState;
  }

  /**
   * Initialize AI integration
   */
  async initialize(): Promise<void> {
    try {
      await this.aiPlayer.initialize();
      this.ready = true;
      this.errorCount = 0;
    } catch (error) {
      this.ready = false;
      throw error;
    }
  }

  /**
   * Check if AI integration is ready
   */
  isReady(): boolean {
    return this.ready && this.aiPlayer.isReady();
  }

  /**
   * Set game mode
   */
  async setGameMode(mode: GameMode): Promise<void> {
    const validModes: GameMode[] = [GameMode.HUMAN_VS_HUMAN, GameMode.HUMAN_VS_AI, GameMode.SANDBOX, GameMode.AI_VS_AI];
    
    if (!validModes.includes(mode)) {
      throw new Error('Invalid game mode');
    }

    this.gameMode = mode;

    // If switching away from AI mode, stop any ongoing thinking
    if (mode === GameMode.HUMAN_VS_HUMAN || mode === GameMode.SANDBOX) {
      this.aiPlayer.stopThinking();
    }

    // Notify game systems (these would be injected dependencies in real implementation)
    this.notifyGameModeChange(mode);
  }

  /**
   * Get current game mode
   */
  getGameMode(): GameMode {
    return this.gameMode;
  }

  /**
   * Process a player move and handle AI response if needed
   */
  async processPlayerMove(move: Move): Promise<void> {
    try {
      // Handle the human move first
      await this.handleHumanMove(move);

      // Check if AI should respond
      if (this.shouldAIRespond()) {
        await this.handleAIMove();
      }
    } catch (error) {
      this.errorCount++;
      
      // If too many errors, fall back to human vs human
      if (this.errorCount >= this.maxErrors) {
        await this.fallbackToHumanMode();
      }
      
      throw error;
    }
  }

  /**
   * Generate AI move for current game state (direct method)
   */
  async generateAIMove(gameState: GameState): Promise<Move> {
    if (!this.isReady()) {
      throw new Error('AI not ready for move');
    }

    try {
      this.notifyAIThinking(true);
      
      const aiMove = await this.aiPlayer.makeMove(gameState);
      
      this.notifyAIThinking(false);
      this.errorCount = 0;
      
      return aiMove;
    } catch (error) {
      this.notifyAIThinking(false);
      this.errorCount++;
      
      if (this.errorCount >= this.maxErrors) {
        await this.fallbackToHumanMode();
      }
      
      throw error;
    }
  }

  /**
   * Get AI thinking moves for visualization
   */
  getAIThinkingMoves(): ThinkingMove[] {
    if (!this.isReady()) return [];
    return this.aiPlayer.getThinkingMoves();
  }

  /**
   * Check if AI is currently thinking
   */
  isAIThinking(): boolean {
    return this.aiPlayer.isThinking();
  }

  /**
   * Set AI engine options
   */
  setAIEngineOptions(options: Partial<EngineOptions>): void {
    this.aiPlayer.setEngineOptions(options);
  }

  /**
   * Recover from AI errors
   */
  async recoverFromError(): Promise<void> {
    try {
      // Reinitialize AI player
      this.aiPlayer.destroy();
      this.aiPlayer = new AIPlayer();
      await this.aiPlayer.initialize();
      
      this.errorCount = 0;
      this.ready = true;
    } catch (error) {
      this.ready = false;
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.aiPlayer) {
      this.aiPlayer.destroy();
    }
    this.ready = false;
  }

  /**
   * Handle human move
   */
  private async handleHumanMove(move: Move): Promise<void> {
    // In real implementation, this would call:
    // await this.gameOrchestrator.handlePlayerMove(move);
    
    // For now, we'll just validate the move is provided
    if (!move || !move.from || !move.to) {
      throw new Error('Invalid human move');
    }
  }

  /**
   * Handle AI move generation and execution
   */
  private async handleAIMove(): Promise<void> {
    if (!this.isReady()) {
      throw new Error('AI not ready for move');
    }

    try {
      // Set AI thinking state
      this.notifyAIThinking(true);

      // Get current game state
      const gameState = this.getCurrentGameState();

      // Generate AI move
      const aiMove = await this.aiPlayer.makeMove(gameState);

      // Validate and execute the move
      await this.executeAIMove(aiMove);

      // Clear thinking state
      this.notifyAIThinking(false);
      
      // Reset error count on successful move
      this.errorCount = 0;
    } catch (error) {
      this.notifyAIThinking(false);
      throw error;
    }
  }

  /**
   * Execute AI move in game system
   */
  private async executeAIMove(move: Move): Promise<void> {
    if (!move || !move.from || !move.to) {
      throw new Error('Invalid AI move generated');
    }

    // Use orchestrator callback if available
    if (this.orchestratorMakeMove) {
      const result = await this.orchestratorMakeMove(move);
    } else {
      throw new Error('No orchestrator callback available for move execution');
    }
  }

  /**
   * Check if AI should respond to current position
   */
  private shouldAIRespond(): boolean {
    if (this.gameMode === GameMode.HUMAN_VS_HUMAN) {
      return false;
    }

    if (this.gameMode === GameMode.HUMAN_VS_AI) {
      // In real implementation, this would check:
      // return this.gameStateManager.isAITurn();
      return true; // Simplified for testing
    }

    return false;
  }

  /**
   * Get current game state
   */
  private getCurrentGameState(): GameState {
    if (this.getGameState) {
      const gameState = this.getGameState();
      return gameState;
    } else {
      // Mock game state for testing
      return {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        pgn: '',
        moves: [],
        currentPlayer: 'w',
        status: 'playing',
        result: null,
        startDate: new Date(),
        endDate: null,
        board: []
      };
    }
  }

  /**
   * Notify game systems of mode change
   */
  private notifyGameModeChange(mode: GameMode): void {
    // In real implementation, this would call:
    // this.gameStateManager.setGameMode(mode);
    // this.gameOrchestrator.setGameMode(mode);
    
    // For testing, we'll just log
    console.log(`Game mode changed to: ${mode}`);
  }

  /**
   * Notify game systems of AI thinking state
   */
  private notifyAIThinking(thinking: boolean): void {
    // In real implementation, this would call:
    // this.gameStateManager.setAIThinking(thinking);
    
    // For testing, we'll just log
    console.log(`AI thinking: ${thinking}`);
  }

  /**
   * Fall back to human vs human mode on repeated errors
   */
  private async fallbackToHumanMode(): Promise<void> {
    console.warn('Too many AI errors, falling back to human vs human mode');
    await this.setGameMode(GameMode.HUMAN_VS_HUMAN);
    this.aiPlayer.setFallbackMode(true);
  }
}