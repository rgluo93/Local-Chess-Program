/**
 * ChessGameOrchestrator Phase 1.4 Tests
 * 
 * Tests focused on Phase 1.4 deliverables: component integration, 
 * API layer, and coordination between existing Phase 1.1-1.3 components.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChessGameOrchestrator } from '../ChessGameOrchestrator';
import type {
  MoveRequest,
  GameEvent,
} from '@/types/Integration';

describe('ChessGameOrchestrator Phase 1.4 Integration', () => {
  let orchestrator: ChessGameOrchestrator;

  beforeEach(async () => {
    orchestrator = new ChessGameOrchestrator();
    await orchestrator.initialize();
  });

  afterEach(async () => {
    if (orchestrator) {
      await orchestrator.destroy();
    }
  });

  // ==========================================================================
  // DELIVERABLE 1: ORCHESTRATOR LIFECYCLE
  // ==========================================================================

  describe('Orchestrator Lifecycle', () => {
    it('should initialize successfully', async () => {
      const newOrchestrator = new ChessGameOrchestrator();
      await newOrchestrator.initialize();
      
      const metadata = newOrchestrator.getMetadata();
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.components).toContain('game_engine');
      expect(metadata.components).toContain('state_manager');
      
      await newOrchestrator.destroy();
    });

    it('should throw error when initializing twice', async () => {
      await expect(orchestrator.initialize()).rejects.toThrow('already initialized');
    });

    it('should handle destruction gracefully', async () => {
      await orchestrator.destroy();
      await expect(orchestrator.destroy()).resolves.not.toThrow();
    });

    it('should provide version and metadata', () => {
      const version = orchestrator.getVersion();
      expect(typeof version).toBe('string');
      
      const metadata = orchestrator.getMetadata();
      expect(metadata.version).toBeDefined();
      expect(metadata.components).toBeDefined();
      expect(Array.isArray(metadata.components)).toBe(true);
    });
  });

  // ==========================================================================
  // DELIVERABLE 2: COMPONENT INTEGRATION
  // ==========================================================================

  describe('Component Integration', () => {
    it('should integrate GameEngine functionality', () => {
      // Test that GameEngine is accessible through orchestrator
      const position = orchestrator.getCurrentPosition();
      expect(position).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      
      const validMoves = orchestrator.getValidMoves('e2');
      expect(validMoves).toContain('e3');
      expect(validMoves).toContain('e4');
      
      const status = orchestrator.getGameStatus();
      expect(status).toBe('playing');
    });

    it('should integrate GameStateManager functionality', () => {
      const gameState = orchestrator.getGameState();
      expect(gameState.gameState).toBeDefined();
      expect(gameState.gameState.status).toBe('playing');
      expect(gameState.gameState.currentPlayer).toBe('white');
      expect(gameState.metadata).toBeDefined();
    });

    it('should integrate MoveHistoryManager functionality', () => {
      const history = orchestrator.getMoveHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history).toHaveLength(0);
    });

    it('should integrate EndgameDetector functionality', () => {
      const analysis = orchestrator.analyzePosition();
      expect(analysis.status).toBe('playing');
      expect(typeof analysis.threefoldRepetition).toBe('boolean');
      expect(typeof analysis.fiftyMoveRule).toBe('number');
    });

    it('should integrate NotationGenerator functionality', () => {
      const pgn = orchestrator.getNotation('pgn');
      expect(typeof pgn).toBe('string');
      
      const fen = orchestrator.getNotation('fen');
      expect(fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });

    it('should coordinate move operations across all components', async () => {
      const moveRequest: MoveRequest = {
        from: 'e2',
        to: 'e4',
        source: 'orchestrator',
      };
      
      const response = await orchestrator.makeMove(moveRequest);
      
      expect(response.success).toBe(true);
      expect(response.move).toBeDefined();
      expect(response.notation).toBe('e4');
      
      // Verify all components are updated
      const history = orchestrator.getMoveHistory();
      expect(history).toHaveLength(1);
      expect(history[0].from).toBe('e2');
      expect(history[0].to).toBe('e4');
      
      const position = orchestrator.getCurrentPosition();
      expect(position).toContain(' b '); // Black's turn
      
      const gameState = orchestrator.getGameState();
      expect(gameState.gameState.currentPlayer).toBe('black');
    });
  });

  // ==========================================================================
  // DELIVERABLE 3: UNIFIED API LAYER
  // ==========================================================================

  describe('Unified API Layer', () => {
    it('should provide unified move interface', async () => {
      const response = await orchestrator.makeMove({ from: 'e2', to: 'e4' });
      expect(response.success).toBe(true);
      
      const validMoves = orchestrator.getValidMoves();
      expect(validMoves.length).toBeGreaterThan(0);
      
      // Basic undo functionality through GameEngine
      const initialHistory = orchestrator.getMoveHistory();
      expect(initialHistory).toHaveLength(1);
    });

    it('should provide unified state access', () => {
      const gameState = orchestrator.getGameState();
      expect(gameState.gameState).toBeDefined();
      
      const position = orchestrator.getCurrentPosition();
      expect(typeof position).toBe('string');
      
      const status = orchestrator.getGameStatus();
      expect(typeof status).toBe('string');
    });

    it('should provide chess logic queries', () => {
      const inCheck = orchestrator.isInCheck();
      expect(typeof inCheck).toBe('boolean');
      
      const gameStatus = orchestrator.getGameStatus();
      expect(typeof gameStatus).toBe('string');
      expect(['playing', 'check', 'checkmate', 'stalemate', 'draw'].includes(gameStatus)).toBe(true);
      
      const currentPlayer = orchestrator.getCurrentPlayer();
      expect(['white', 'black'].includes(currentPlayer)).toBe(true);
    });

    it('should provide performance and health monitoring', async () => {
      const health = await orchestrator.performHealthCheck();
      expect(health.overall).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall);
      
      const metrics = orchestrator.getPerformanceMetrics();
      expect(typeof metrics).toBe('object');
    });
  });

  // ==========================================================================
  // DELIVERABLE 4: EVENT-DRIVEN ARCHITECTURE  
  // ==========================================================================

  describe('Event-Driven Architecture', () => {
    it('should emit and handle events', async () => {
      const events: GameEvent[] = [];
      
      orchestrator.addEventListener('move:completed', (event) => {
        events.push(event);
      });
      
      await orchestrator.makeMove({ from: 'e2', to: 'e4' });
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('move:completed');
    });

    it('should manage event subscriptions', () => {
      let eventReceived = false;
      
      const subscriptionId = orchestrator.addEventListener('move:completed', () => {
        eventReceived = true;
      });
      
      expect(typeof subscriptionId).toBe('string');
      
      const removed = orchestrator.removeEventListener(subscriptionId);
      expect(removed).toBe(true);
    });

    it('should maintain event history', async () => {
      await orchestrator.makeMove({ from: 'e2', to: 'e4' });
      
      const history = orchestrator.getEventHistory();
      expect(history.length).toBeGreaterThan(0);
      
      const moveEvents = orchestrator.getEventHistory('move:completed');
      expect(moveEvents.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // DELIVERABLE 5: STATE SYNCHRONIZATION
  // ==========================================================================

  describe('State Synchronization', () => {
    it('should maintain component synchronization during moves', async () => {
      await orchestrator.makeMove({ from: 'e2', to: 'e4' });
      await orchestrator.makeMove({ from: 'e7', to: 'e5' });
      
      // Verify components are tracking the same state
      const gameState = orchestrator.getGameState();
      const position = orchestrator.getCurrentPosition();
      const history = orchestrator.getMoveHistory();
      
      expect(gameState.gameState).toBeDefined();
      expect(position).toContain(' w '); // White's turn after 2 moves
      expect(history).toHaveLength(2);
    });

    it('should force synchronization when needed', async () => {
      await orchestrator.forceSynchronization();
      const lastSync = orchestrator.getLastSynchronization();
      expect(lastSync).toBeInstanceOf(Date);
    });

    it('should validate system integrity', async () => {
      // Basic integrity check - orchestrator should be functional
      expect(orchestrator.getVersion()).toBe('1.0.0');
      expect(orchestrator.getGameStatus()).toBe('playing');
      expect(orchestrator.getCurrentPosition()).toBeDefined();
      expect(orchestrator.getMoveHistory()).toHaveLength(0);
    });
  });

  // ==========================================================================
  // DELIVERABLE 6: CONFIGURATION MANAGEMENT
  // ==========================================================================

  describe('Configuration Management', () => {
    it('should manage orchestrator configuration', () => {
      const config = orchestrator.getConfig();
      expect(config.performance).toBeDefined();
      expect(config.events).toBeDefined();
      
      orchestrator.updateConfig({
        performance: { maxResponseTimeMs: 150 }
      });
      
      const updatedConfig = orchestrator.getConfig();
      expect(updatedConfig.performance.maxResponseTimeMs).toBe(150);
    });

    it('should enable/disable components', async () => {
      const enabled = await orchestrator.enableComponent('game_engine');
      expect(typeof enabled).toBe('boolean');
      
      const disabled = await orchestrator.disableComponent('game_engine');
      expect(typeof disabled).toBe('boolean');
    });
  });

  // ==========================================================================
  // PHASE 1.4 INTEGRATION VALIDATION
  // ==========================================================================

  describe('Phase 1.4 Integration Validation', () => {
    it('should pass complete integration test', async () => {
      // Test complete game workflow through orchestrator
      
      // 1. Verify initial state
      expect(orchestrator.getGameStatus()).toBe('playing');
      expect(orchestrator.getMoveHistory()).toHaveLength(0);
      
      // 2. Make moves
      const move1 = await orchestrator.makeMove({ from: 'e2', to: 'e4' });
      expect(move1.success).toBe(true);
      
      const move2 = await orchestrator.makeMove({ from: 'e7', to: 'e5' });
      expect(move2.success).toBe(true);
      
      const move3 = await orchestrator.makeMove({ from: 'g1', to: 'f3' });
      expect(move3.success).toBe(true);
      
      // 3. Verify component coordination
      const history = orchestrator.getMoveHistory();
      expect(history).toHaveLength(3);
      
      const gameState = orchestrator.getGameState();
      expect(gameState.gameState.currentPlayer).toBe('black');
      
      const notation = orchestrator.getNotation('pgn');
      expect(notation).toContain('e4');
      expect(notation).toContain('e5');
      expect(notation).toContain('Nf3');
      
      // 4. Verify synchronization - all components should reflect same state
      await orchestrator.forceSynchronization();
      const lastSync = orchestrator.getLastSynchronization();
      expect(lastSync).toBeInstanceOf(Date);
      
      // 5. Verify basic system integrity
      expect(orchestrator.getVersion()).toBe('1.0.0');
      expect(orchestrator.getCurrentPosition()).toBeDefined();
      expect(orchestrator.getGameStatus()).toBe('playing');
      
      // 6. Verify component coordination is maintained
      const finalState = orchestrator.getGameState();
      expect(finalState.gameState.currentPlayer).toBe('black');
      expect(finalState.metadata.source).toBe('orchestrator');
    });

    it('should handle error scenarios gracefully', async () => {
      // Test invalid move
      const invalidMove = await orchestrator.makeMove({
        from: 'e2',
        to: 'e5', // Invalid pawn move
      });
      
      expect(invalidMove.success).toBe(false);
      expect(invalidMove.error).toBeDefined();
      
      // System should remain functional
      const validMove = await orchestrator.makeMove({ from: 'e2', to: 'e4' });
      expect(validMove.success).toBe(true);
    });

    it('should meet performance requirements', async () => {
      const startTime = performance.now();
      
      await orchestrator.makeMove({ from: 'e2', to: 'e4' });
      await orchestrator.makeMove({ from: 'e7', to: 'e5' });
      orchestrator.getGameState();
      orchestrator.analyzePosition();
      
      const totalTime = performance.now() - startTime;
      expect(totalTime).toBeLessThan(500); // Should be well under requirements
    });
  });
});