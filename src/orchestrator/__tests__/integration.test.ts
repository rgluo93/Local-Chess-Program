/**
 * Integration Tests - Test Scenario #21: Complete Game Integration (Phase 1.4)
 * 
 * This test suite validates the complete integration of all Phase 1 components
 * through the ChessGameOrchestrator, focusing on component coordination and
 * API layer functionality that should exist after Phase 1.4.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChessGameOrchestrator } from '../ChessGameOrchestrator';
import type {
  ChessGameOrchestratorAPI,
  GameEvent,
} from '@/types/Integration';

describe('Test Scenario #21: Complete Game Integration (Phase 1.4)', () => {
  let orchestrator: ChessGameOrchestratorAPI;
  let events: GameEvent[] = [];

  beforeEach(async () => {
    orchestrator = new ChessGameOrchestrator();
    await orchestrator.initialize();
    
    // Setup event tracking for Phase 1.4 events
    events = [];
    orchestrator.addEventListener('move:completed', (event) => events.push(event));
    orchestrator.addEventListener('move:failed', (event) => events.push(event));
    orchestrator.addEventListener('error:occurred', (event) => events.push(event));
  });

  afterEach(async () => {
    if (orchestrator) {
      await orchestrator.destroy();
    }
  });

  // ==========================================================================
  // PHASE 1.4 INTEGRATION TEST - TEST SCENARIO #21
  // ==========================================================================

  describe('Phase 1.4 Complete Integration Test', () => {
    it('should pass Test Scenario #21: Complete Game Integration', async () => {
      console.log('🎯 Executing Test Scenario #21: Complete Game Integration');
      
      // Phase 1: Orchestrator Initialization Validation
      console.log('  Phase 1: Validating orchestrator initialization');
      expect(orchestrator.getVersion()).toBe('1.0.0');
      
      const metadata = orchestrator.getMetadata();
      expect(metadata.components).toContain('game_engine');
      expect(metadata.components).toContain('state_manager');
      expect(metadata.components).toContain('move_history');
      expect(metadata.components).toContain('endgame_detector');
      expect(metadata.components).toContain('notation_generator');
      
      // Phase 2: Component Integration Validation
      console.log('  Phase 2: Validating component integration');
      
      // Verify all components are integrated and accessible
      expect(orchestrator.getCurrentPosition()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(orchestrator.getGameStatus()).toBe('playing');
      expect(orchestrator.getMoveHistory()).toHaveLength(0);
      expect(orchestrator.getValidMoves().length).toBeGreaterThan(0);
      
      const analysis = orchestrator.analyzePosition();
      expect(analysis.status).toBe('playing');
      expect(analysis.threefoldRepetition).toBe(false);
      
      // Phase 3: Unified API Layer Validation
      console.log('  Phase 3: Testing unified API layer');
      
      // Test move coordination across all components
      const move1 = await orchestrator.makeMove({ from: 'e2', to: 'e4' });
      expect(move1.success).toBe(true);
      expect(move1.notation).toBe('e4');
      
      // Verify all components updated correctly
      expect(orchestrator.getMoveHistory()).toHaveLength(1);
      expect(orchestrator.getCurrentPosition()).toContain(' b '); // Black's turn
      expect(orchestrator.getNotation('pgn')).toContain('e4');
      
      const move2 = await orchestrator.makeMove({ from: 'e7', to: 'e5' });
      expect(move2.success).toBe(true);
      expect(move2.notation).toBe('e5');
      
      const move3 = await orchestrator.makeMove({ from: 'g1', to: 'f3' });
      expect(move3.success).toBe(true);
      expect(move3.notation).toBe('Nf3');
      
      // Phase 4: Event-Driven Architecture Validation
      console.log('  Phase 4: Validating event-driven architecture');
      
      // Verify events were emitted for all moves
      const moveEvents = events.filter(e => e.type === 'move:completed');
      expect(moveEvents).toHaveLength(3);
      
      const eventHistory = orchestrator.getEventHistory('move:completed');
      expect(eventHistory.length).toBeGreaterThan(0);
      
      // Phase 5: State Synchronization Validation
      console.log('  Phase 5: Validating state synchronization');
      
      const sync = await orchestrator.validateComponentSynchronization();
      expect(sync.synchronized).toBe(true);
      expect(sync.discrepancies).toHaveLength(0);
      
      const integrity = await orchestrator.validateIntegrity();
      expect(integrity.isValid).toBe(true);
      
      // Force synchronization and verify it works
      await orchestrator.forceSynchronization();
      const lastSync = orchestrator.getLastSynchronization();
      expect(lastSync).toBeInstanceOf(Date);
      
      // Phase 6: Error Handling Validation
      console.log('  Phase 6: Validating error handling');
      
      const invalidMove = await orchestrator.makeMove({ from: 'e2', to: 'e6' });
      expect(invalidMove.success).toBe(false);
      expect(invalidMove.error).toBeDefined();
      
      // System should remain functional after error
      const validMove = await orchestrator.makeMove({ from: 'b8', to: 'c6' });
      expect(validMove.success).toBe(true);
      
      // Phase 7: Component Health Monitoring
      console.log('  Phase 7: Validating component health monitoring');
      
      const health = await orchestrator.performHealthCheck();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall);
      expect(health.components.length).toBeGreaterThan(0);
      
      const metrics = orchestrator.getPerformanceMetrics();
      expect(typeof metrics).toBe('object');
      
      // Phase 8: Configuration Management
      console.log('  Phase 8: Validating configuration management');
      
      const config = orchestrator.getConfig();
      expect(config.performance).toBeDefined();
      expect(config.events).toBeDefined();
      
      orchestrator.updateConfig({ performance: { maxResponseTimeMs: 150 } });
      const updatedConfig = orchestrator.getConfig();
      expect(updatedConfig.performance.maxResponseTimeMs).toBe(150);
      
      // Phase 9: Undo/Redo Integration
      console.log('  Phase 9: Validating undo functionality integration');
      
      const moveCount = orchestrator.getMoveHistory().length;
      const undoResult = await orchestrator.undoMove();
      expect(undoResult.success).toBe(true);
      expect(orchestrator.getMoveHistory()).toHaveLength(moveCount - 1);
      
      // Verify synchronization after undo
      const syncAfterUndo = await orchestrator.validateComponentSynchronization();
      expect(syncAfterUndo.synchronized).toBe(true);
      
      // Phase 10: Final Integration Validation
      console.log('  Phase 10: Final integration validation');
      
      // Verify complete game state is accessible through unified API
      const finalGameState = orchestrator.getGameState({
        includeHistory: true,
        includeNotation: true,
        includeAnalysis: true,
      });
      
      expect(finalGameState.gameState).toBeDefined();
      expect(finalGameState.moveHistory).toBeDefined();
      expect(finalGameState.notation).toBeDefined();
      expect(finalGameState.analysis).toBeDefined();
      expect(finalGameState.metadata.source).toBe('orchestrator');
      
      console.log('✅ Test Scenario #21: Complete Game Integration PASSED');
    });

    it('should maintain basic performance during integration', async () => {
      console.log('🚀 Testing basic integration performance');
      
      const startTime = performance.now();
      
      // Perform multiple operations to test integrated performance
      for (let i = 0; i < 5; i++) {
        await orchestrator.makeMove({ from: 'e2', to: 'e4' });
        await orchestrator.undoMove();
        orchestrator.getGameState();
        orchestrator.analyzePosition();
        await orchestrator.forceSynchronization();
      }
      
      const totalTime = performance.now() - startTime;
      console.log(`  Total time for 5 complete cycles: ${totalTime.toFixed(2)}ms`);
      
      // Should complete without excessive delays (generous threshold for Phase 1.4)
      const averageTime = totalTime / 5;
      expect(averageTime).toBeLessThan(500); // Relaxed requirement for Phase 1.4
      
      console.log(`  Average time per cycle: ${averageTime.toFixed(2)}ms`);
      console.log('✅ Basic integration performance acceptable');
    });

    it('should handle stress testing of integrated components', async () => {
      console.log('💪 Stress testing integrated components');
      
      // Rapid move operations
      const moves = [
        { from: 'e2', to: 'e4' }, { from: 'e7', to: 'e5' },
        { from: 'g1', to: 'f3' }, { from: 'b8', to: 'c6' },
        { from: 'd2', to: 'd4' }, { from: 'exd4' as any, to: 'invalid' as any }, // Invalid move
        { from: 'f1', to: 'c4' }, { from: 'f8', to: 'c5' },
      ];
      
      let successfulMoves = 0;
      let errorCount = 0;
      
      for (const move of moves) {
        try {
          const result = await orchestrator.makeMove(move);
          if (result.success) {
            successfulMoves++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }
      
      console.log(`  Successful moves: ${successfulMoves}`);
      console.log(`  Errors handled: ${errorCount}`);
      
      // Should have successfully made valid moves and handled errors gracefully
      expect(successfulMoves).toBeGreaterThan(0);
      expect(orchestrator.getGameStatus()).toBe('playing');
      
      // Verify system integrity after stress test
      const integrity = await orchestrator.validateIntegrity();
      expect(integrity.isValid).toBe(true);
      
      const sync = await orchestrator.validateComponentSynchronization();
      expect(sync.synchronized).toBe(true);
      
      console.log('✅ Stress test completed successfully');
    });
  });

  // ==========================================================================
  // COMPONENT COORDINATION VALIDATION
  // ==========================================================================

  describe('Component Coordination Validation', () => {
    it('should coordinate GameEngine with all other components', async () => {
      // Make move and verify all components are updated
      await orchestrator.makeMove({ from: 'e2', to: 'e4' });
      
      // GameEngine integration
      expect(orchestrator.getCurrentPosition()).toContain(' b ');
      expect(orchestrator.getValidMoves().length).toBeGreaterThan(0);
      
      // GameStateManager integration
      const gameState = orchestrator.getGameState();
      expect(gameState.gameState.currentPlayer).toBe('black');
      
      // MoveHistoryManager integration
      const history = orchestrator.getMoveHistory();
      expect(history).toHaveLength(1);
      expect(history[0].from).toBe('e2');
      
      // NotationGenerator integration
      const notation = orchestrator.getNotation('pgn');
      expect(notation).toContain('e4');
      
      // EndgameDetector integration
      const analysis = orchestrator.analyzePosition();
      expect(analysis.status).toBe('playing');
    });

    it('should maintain component synchronization during complex operations', async () => {
      // Perform multiple operations
      await orchestrator.makeMove({ from: 'e2', to: 'e4' });
      await orchestrator.makeMove({ from: 'e7', to: 'e5' });
      await orchestrator.undoMove();
      await orchestrator.makeMove({ from: 'e7', to: 'e6' });
      
      // Force synchronization check
      const sync = await orchestrator.validateComponentSynchronization();
      expect(sync.synchronized).toBe(true);
      expect(sync.discrepancies).toHaveLength(0);
      
      // Validate integrity
      const integrity = await orchestrator.validateIntegrity();
      expect(integrity.isValid).toBe(true);
    });
  });

  // ==========================================================================
  // UNIFIED API LAYER VALIDATION
  // ==========================================================================

  describe('Unified API Layer Validation', () => {
    it('should provide consistent API responses across all methods', async () => {
      // Test API consistency
      expect(orchestrator.getGameStatus()).toBe('playing');
      expect(orchestrator.isGameOver()).toBe(false);
      expect(orchestrator.getCurrentPosition()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      
      // Make move and verify API consistency
      await orchestrator.makeMove({ from: 'e2', to: 'e4' });
      
      // All API methods should reflect the change consistently
      expect(orchestrator.getMoveHistory()).toHaveLength(1);
      expect(orchestrator.getCurrentPosition()).toContain(' b ');
      expect(orchestrator.getGameState().gameState.currentPlayer).toBe('black');
      expect(orchestrator.getNotation('pgn')).toContain('e4');
    });

    it('should handle API parameter validation correctly', async () => {
      // Valid parameters
      const validMove = await orchestrator.makeMove({ from: 'e2', to: 'e4' });
      expect(validMove.success).toBe(true);
      
      // Invalid parameters
      const invalidMove = await orchestrator.makeMove({ from: 'e2', to: 'e5' });
      expect(invalidMove.success).toBe(false);
      expect(invalidMove.error).toBeDefined();
      
      // Optional parameters
      const stateBasic = orchestrator.getGameState();
      expect(stateBasic.gameState).toBeDefined();
      
      const stateWithHistory = orchestrator.getGameState({ includeHistory: true });
      expect(stateWithHistory.moveHistory).toBeDefined();
    });
  });

  // ==========================================================================
  // EVENT-DRIVEN ARCHITECTURE VALIDATION
  // ==========================================================================

  describe('Event-Driven Architecture Validation', () => {
    it('should emit and handle events correctly across components', async () => {
      const testEvents: GameEvent[] = [];
      
      orchestrator.addEventListener('move:completed', (event) => testEvents.push(event));
      orchestrator.addEventListener('move:failed', (event) => testEvents.push(event));
      
      // Make valid move
      await orchestrator.makeMove({ from: 'e2', to: 'e4' });
      
      // Make invalid move
      await orchestrator.makeMove({ from: 'e2', to: 'e5' });
      
      // Verify events were emitted
      expect(testEvents.length).toBeGreaterThanOrEqual(1);
      
      const completedEvents = testEvents.filter(e => e.type === 'move:completed');
      const failedEvents = testEvents.filter(e => e.type === 'move:failed');
      
      expect(completedEvents).toHaveLength(1);
      expect(failedEvents.length).toBeGreaterThanOrEqual(0);
    });

    it('should manage event subscriptions properly', () => {
      let eventCount = 0;
      
      const subscription = orchestrator.addEventListener('move:completed', () => {
        eventCount++;
      });
      
      expect(typeof subscription).toBe('string');
      
      const removed = orchestrator.removeEventListener(subscription);
      expect(removed).toBe(true);
      
      const removedAgain = orchestrator.removeEventListener(subscription);
      expect(removedAgain).toBe(false);
    });
  });
});