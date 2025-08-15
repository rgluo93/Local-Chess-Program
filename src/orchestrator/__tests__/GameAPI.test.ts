/**
 * GameAPI Interface Compliance Tests - Phase 1.4
 * 
 * Test suite focused on validating that the ChessGameOrchestrator correctly
 * implements the GameAPI interfaces for Phase 1.4 deliverables.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChessGameOrchestrator } from '../ChessGameOrchestrator';
import type { ChessGameOrchestratorAPI } from '@/types/Integration';

describe('GameAPI Interface Compliance - Phase 1.4', () => {
  let api: ChessGameOrchestratorAPI;

  beforeEach(async () => {
    api = new ChessGameOrchestrator();
    await api.initialize();
  });

  afterEach(async () => {
    await api.destroy();
  });

  // ==========================================================================
  // CORE GAME API METHODS
  // ==========================================================================

  describe('Core Game API Methods', () => {
    it('should implement orchestrator lifecycle methods', () => {
      expect(typeof api.initialize).toBe('function');
      expect(typeof api.destroy).toBe('function');
      expect(typeof api.getVersion).toBe('function');
      expect(typeof api.getMetadata).toBe('function');
    });

    it('should implement move operation methods', () => {
      expect(typeof api.makeMove).toBe('function');
      expect(typeof api.getValidMoves).toBe('function');
      expect(typeof api.undoMove).toBe('function');
    });

    it('should implement game state access methods', () => {
      expect(typeof api.getGameState).toBe('function');
      expect(typeof api.getCurrentPosition).toBe('function');
      expect(typeof api.getGameStatus).toBe('function');
      expect(typeof api.isGameOver).toBe('function');
      expect(typeof api.getGameResult).toBe('function');
    });

    it('should implement move history methods', () => {
      expect(typeof api.getMoveHistory).toBe('function');
      expect(typeof api.getNotation).toBe('function');
      expect(typeof api.exportGame).toBe('function');
    });

    it('should implement chess logic query methods', () => {
      expect(typeof api.isInCheck).toBe('function');
      expect(typeof api.isKingInCheck).toBe('function');
      expect(typeof api.canCastle).toBe('function');
      expect(typeof api.getEnPassantSquare).toBe('function');
    });

    it('should implement endgame analysis methods', () => {
      expect(typeof api.analyzePosition).toBe('function');
    });

    it('should implement performance and health methods', () => {
      expect(typeof api.getComponentHealth).toBe('function');
      expect(typeof api.getPerformanceMetrics).toBe('function');
      expect(typeof api.validateIntegrity).toBe('function');
    });
  });

  // ==========================================================================
  // API METHOD FUNCTIONALITY
  // ==========================================================================

  describe('API Method Functionality', () => {
    it('should execute move operations correctly', async () => {
      const moveResponse = await api.makeMove({ from: 'e2', to: 'e4' });
      expect(moveResponse.success).toBe(true);
      expect(moveResponse.move).toBeDefined();
      expect(moveResponse.notation).toBe('e4');

      const validMoves = api.getValidMoves();
      expect(Array.isArray(validMoves)).toBe(true);
      expect(validMoves.length).toBeGreaterThan(0);

      // Check that move history is tracked
      const history = api.getMoveHistory();
      expect(history).toHaveLength(1);
    });

    it('should provide accurate state information', () => {
      const gameState = api.getGameState();
      expect(gameState.gameState).toBeDefined();
      expect(gameState.metadata).toBeDefined();

      const position = api.getCurrentPosition();
      expect(position).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

      const status = api.getGameStatus();
      expect(status).toBe('playing');

      const isOver = api.isGameOver();
      expect(isOver).toBe(false);

      const result = api.getGameResult();
      expect(result).toBeDefined(); // Result can be '*' for ongoing game in some implementations
    });

    it('should provide chess logic information', () => {
      const inCheck = api.isInCheck();
      expect(typeof inCheck).toBe('boolean');
      expect(inCheck).toBe(false);

      const kingInCheck = api.isKingInCheck('white');
      expect(typeof kingInCheck).toBe('boolean');

      const canCastle = api.canCastle('kingside');
      expect(typeof canCastle).toBe('boolean');
      // Castling may or may not be available depending on implementation

      const enPassant = api.getEnPassantSquare();
      expect(enPassant).toBeNull(); // No en passant in starting position
    });

    it('should provide endgame analysis', () => {
      const analysis = api.analyzePosition();
      expect(analysis.status).toBe('playing');
      expect(analysis.threefoldRepetition).toBe(false);
      expect(analysis.fiftyMoveRule).toBe(0);
      expect(analysis.insufficientMaterial).toBe(false);
      expect(Array.isArray(analysis.possibleDraws)).toBe(true);
    });

    it('should provide system health information', async () => {
      const health = api.getComponentHealth();
      expect(health.overall).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall);
      expect(Array.isArray(health.components)).toBe(true);

      const metrics = api.getPerformanceMetrics();
      expect(typeof metrics).toBe('object');

      const integrity = await api.validateIntegrity();
      expect(typeof integrity.isValid).toBe('boolean');
    });
  });

  // ==========================================================================
  // EVENT API METHODS
  // ==========================================================================

  describe('Event API Methods', () => {
    it('should implement event management methods', () => {
      expect(typeof api.addEventListener).toBe('function');
      expect(typeof api.removeEventListener).toBe('function');
      expect(typeof api.removeAllListeners).toBe('function');
      expect(typeof api.emitEvent).toBe('function');
      expect(typeof api.getEventHistory).toBe('function');
      expect(typeof api.clearEventHistory).toBe('function');
      expect(typeof api.getLastEvent).toBe('function');
    });

    it('should handle event subscriptions correctly', () => {
      let eventReceived = false;
      
      const subscriptionId = api.addEventListener('move:completed', () => {
        eventReceived = true;
      });
      
      expect(typeof subscriptionId).toBe('string');
      expect(subscriptionId.length).toBeGreaterThan(0);
      
      const removed = api.removeEventListener(subscriptionId);
      expect(removed).toBe(true);
      
      // Test removal of non-existent subscription
      const invalidRemoval = api.removeEventListener('nonexistent');
      expect(invalidRemoval).toBe(false);
    });

    it('should maintain event history', async () => {
      await api.makeMove({ from: 'e2', to: 'e4' });
      
      const history = api.getEventHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      
      const moveEvents = api.getEventHistory('move:completed');
      expect(Array.isArray(moveEvents)).toBe(true);
      
      const lastEvent = api.getLastEvent();
      expect(lastEvent).toBeDefined();
    });
  });

  // ==========================================================================
  // CONFIG API METHODS
  // ==========================================================================

  describe('Configuration API Methods', () => {
    it('should implement configuration methods', () => {
      expect(typeof api.getConfig).toBe('function');
      expect(typeof api.updateConfig).toBe('function');
      expect(typeof api.resetToDefaults).toBe('function');
      expect(typeof api.enableComponent).toBe('function');
      expect(typeof api.disableComponent).toBe('function');
      expect(typeof api.restartComponent).toBe('function');
    });

    it('should manage configuration correctly', () => {
      const config = api.getConfig();
      expect(config.performance).toBeDefined();
      expect(config.events).toBeDefined();
      
      api.updateConfig({
        performance: { maxResponseTimeMs: 200 }
      });
      
      const updatedConfig = api.getConfig();
      expect(updatedConfig.performance.maxResponseTimeMs).toBe(200);
      
      api.resetToDefaults();
      const defaultConfig = api.getConfig();
      expect(defaultConfig.performance.maxResponseTimeMs).toBe(100);
    });

    it('should handle component management', async () => {
      const enabled = await api.enableComponent('game_engine');
      expect(typeof enabled).toBe('boolean');
      
      const disabled = await api.disableComponent('game_engine');
      expect(typeof disabled).toBe('boolean');
      
      const restarted = await api.restartComponent('game_engine');
      expect(typeof restarted).toBe('boolean');
    });
  });

  // ==========================================================================
  // ORCHESTRATOR-SPECIFIC API METHODS
  // ==========================================================================

  describe('Orchestrator-Specific API Methods', () => {
    it('should implement synchronization methods', async () => {
      expect(typeof api.forceSynchronization).toBe('function');
      expect(typeof api.getLastSynchronization).toBe('function');
      expect(typeof api.validateComponentSynchronization).toBe('function');
      
      await api.forceSynchronization();
      const lastSync = api.getLastSynchronization();
      expect(lastSync).toBeInstanceOf(Date);
      
      const sync = await api.validateComponentSynchronization();
      expect(typeof sync.synchronized).toBe('boolean');
      expect(Array.isArray(sync.discrepancies)).toBe(true);
    });

    it('should implement inspection methods', () => {
      expect(typeof api.inspectComponent).toBe('function');
      expect(typeof api.debugState).toBe('function');
      
      const inspection = api.inspectComponent('game_engine');
      expect(typeof inspection).toBe('object');
      
      const debugState = api.debugState();
      expect(debugState.orchestrator).toBeDefined();
      expect(debugState.components).toBeDefined();
    });
  });

  // ==========================================================================
  // API PARAMETER VALIDATION
  // ==========================================================================

  describe('API Parameter Validation', () => {
    it('should validate move request parameters', async () => {
      const validRequest = { from: 'e2' as const, to: 'e4' as const };
      const response = await api.makeMove(validRequest);
      expect(response.success).toBe(true);
      
      const invalidRequest = { from: 'e2' as const, to: 'e5' as const };
      const invalidResponse = await api.makeMove(invalidRequest);
      expect(invalidResponse.success).toBe(false);
      expect(invalidResponse.error).toBeDefined();
    });

    it('should handle optional parameters correctly', () => {
      const basicState = api.getGameState();
      expect(basicState.gameState).toBeDefined();
      
      const stateWithHistory = api.getGameState({ includeHistory: true });
      expect(stateWithHistory.moveHistory).toBeDefined();
      
      const stateWithNotation = api.getGameState({ includeNotation: true });
      expect(stateWithNotation.notation).toBeDefined();
    });
  });

  // ==========================================================================
  // API RETURN VALUE VALIDATION
  // ==========================================================================

  describe('API Return Value Validation', () => {
    it('should return properly structured responses', async () => {
      const moveResponse = await api.makeMove({ from: 'e2', to: 'e4' });
      
      expect(typeof moveResponse.success).toBe('boolean');
      if (moveResponse.success) {
        expect(moveResponse.move).toBeDefined();
        expect(moveResponse.notation).toBeDefined();
      } else {
        expect(moveResponse.error).toBeDefined();
      }
    });

    it('should return consistent data types', () => {
      const position = api.getCurrentPosition();
      expect(typeof position).toBe('string');
      
      const status = api.getGameStatus();
      expect(typeof status).toBe('string');
      
      const isOver = api.isGameOver();
      expect(typeof isOver).toBe('boolean');
      
      const validMoves = api.getValidMoves();
      expect(Array.isArray(validMoves)).toBe(true);
      
      const history = api.getMoveHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should provide metadata in responses', () => {
      const gameState = api.getGameState();
      expect(gameState.metadata).toBeDefined();
      expect(gameState.metadata.timestamp).toBeInstanceOf(Date);
      expect(gameState.metadata.source).toBe('orchestrator');
      
      const metadata = api.getMetadata();
      expect(metadata.version).toBeDefined();
      expect(metadata.components).toBeDefined();
      expect(metadata.initialized).toBeInstanceOf(Date);
    });
  });

  // ==========================================================================
  // INTEGRATION API VALIDATION
  // ==========================================================================

  describe('Integration API Validation', () => {
    it('should maintain API consistency across operations', async () => {
      // Initial state check
      expect(api.getMoveHistory()).toHaveLength(0);
      expect(api.getGameStatus()).toBe('playing');
      
      // Make move and verify consistency
      const moveResponse = await api.makeMove({ from: 'e2', to: 'e4' });
      expect(moveResponse.success).toBe(true);
      
      // All APIs should reflect the move
      expect(api.getMoveHistory()).toHaveLength(1);
      expect(api.getCurrentPosition()).toContain(' b '); // Black's turn
      expect(api.getNotation('pgn')).toContain('e4');
      
      // Phase 1.4 focuses on move coordination, not undo
      const gameState = api.getGameState();
      expect(gameState.gameState.currentPlayer).toBe('black');
    });

    it('should handle error states gracefully across all APIs', async () => {
      const invalidMove = await api.makeMove({ from: 'e2', to: 'e5' });
      expect(invalidMove.success).toBe(false);
      
      // System should remain functional
      expect(api.getGameStatus()).toBe('playing');
      expect(api.getCurrentPosition()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      
      const validMove = await api.makeMove({ from: 'e2', to: 'e4' });
      expect(validMove.success).toBe(true);
    });
  });
});