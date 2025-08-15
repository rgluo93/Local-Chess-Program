/**
 * GameStateSerialization Unit Tests
 * 
 * Tests for the GameStateSerialization class covering:
 * - Complete state serialization/deserialization
 * - Data compression and efficiency
 * - Version compatibility handling
 * - Error handling for corrupted data
 * - Export/import functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateSerialization } from '../GameStateSerialization';
import type { GameState, SavedGame } from '@/types/Chess';

describe('GameStateSerialization', () => {
  let serializer: GameStateSerialization;
  let sampleGameState: GameState;
  let sampleSavedGame: SavedGame;

  beforeEach(() => {
    serializer = GameStateSerialization.getInstance();
    
    sampleGameState = {
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      pgn: '1. e4',
      moves: [{
        from: 'e2',
        to: 'e4',
        piece: 'pawn',
        color: 'white',
        notation: 'e4',
        timestamp: Date.now(),
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      }],
      currentPlayer: 'black',
      status: 'playing',
      result: 'ongoing',
      startDate: new Date('2024-01-01T10:00:00Z'),
      endDate: undefined,
      board: {
        squares: [],
        toMove: 'black',
        castlingRights: {
          whiteKingside: true,
          whiteQueenside: true,
          blackKingside: true,
          blackQueenside: true,
        },
        enPassantTarget: 'e3',
        halfmoveClock: 0,
        fullmoveNumber: 1,
      },
    };

    sampleSavedGame = {
      id: 'test-game-1',
      name: 'Test Game',
      gameState: sampleGameState,
      saveDate: new Date('2024-01-01T12:00:00Z'),
      gameDate: new Date('2024-01-01T10:00:00Z'),
      moveCount: 1,
      status: 'playing',
      result: 'ongoing',
      duration: 3600000, // 1 hour
    };
  });

  // =============================================================================
  // SINGLETON TESTS
  // =============================================================================

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = GameStateSerialization.getInstance();
      const instance2 = GameStateSerialization.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  // =============================================================================
  // GAME STATE SERIALIZATION TESTS
  // =============================================================================

  describe('Game State Serialization', () => {
    it('should serialize and deserialize game state', () => {
      const serialized = serializer.serializeGameState(sampleGameState);
      expect(serialized).toBeDefined();
      expect(typeof serialized).toBe('string');

      const deserialized = serializer.deserializeGameState(serialized);
      expect(deserialized).not.toBeNull();
      expect(deserialized!.fen).toBe(sampleGameState.fen);
      expect(deserialized!.pgn).toBe(sampleGameState.pgn);
      expect(deserialized!.moves).toHaveLength(1);
      expect(deserialized!.currentPlayer).toBe(sampleGameState.currentPlayer);
    });

    it('should handle serialization with compression', () => {
      const serialized = serializer.serializeGameState(sampleGameState, { compress: true });
      expect(serialized).toBeDefined();
      expect(serialized).toContain('CHESS_GAME:compressed:');

      const deserialized = serializer.deserializeGameState(serialized);
      expect(deserialized).not.toBeNull();
      expect(deserialized!.fen).toBe(sampleGameState.fen);
    });

    it('should handle serialization without metadata', () => {
      const serialized = serializer.serializeGameState(sampleGameState, { includeMetadata: false });
      const parsed = JSON.parse(serialized);
      
      expect(parsed.metadata).toBeUndefined();
      expect(parsed.gameState).toBeDefined();
    });

    it('should preserve date objects', () => {
      const serialized = serializer.serializeGameState(sampleGameState);
      const deserialized = serializer.deserializeGameState(serialized);
      
      expect(deserialized!.startDate).toBeInstanceOf(Date);
      expect(deserialized!.startDate.getTime()).toBe(sampleGameState.startDate.getTime());
    });

    it('should handle invalid serialized data', () => {
      const result = serializer.deserializeGameState('invalid json data');
      expect(result).toBeNull();
    });
  });

  // =============================================================================
  // COMPRESSION TESTS
  // =============================================================================

  describe('Compression', () => {
    it('should compress and decompress game state', () => {
      const result = serializer.compressGameState(sampleGameState);
      
      expect(result.data).toBeDefined();
      expect(result.stats.originalSize).toBeGreaterThan(0);
      expect(result.stats.compressedSize).toBeGreaterThan(0);
      expect(result.stats.compressionTime).toBeGreaterThanOrEqual(0);

      const decompressed = serializer.decompressGameState(result.data);
      expect(decompressed).not.toBeNull();
      expect(decompressed!.fen).toBe(sampleGameState.fen);
    });

    it('should handle compression errors gracefully', () => {
      const result = serializer.decompressGameState('invalid compressed data');
      expect(result).toBeNull();
    });
  });

  // =============================================================================
  // EXPORT TESTS
  // =============================================================================

  describe('Export Functionality', () => {
    it('should export games to PGN format', () => {
      const games = [sampleSavedGame];
      const exportData = serializer.exportToPGN(games);
      
      expect(exportData.format).toBe('pgn');
      expect(exportData.data).toContain('[Event "Test Game"]');
      expect(exportData.data).toContain('1. e4');
      expect(exportData.filename).toMatch(/\.pgn$/);
      expect(exportData.metadata.gameCount).toBe(1);
    });

    it('should export games to FEN format', () => {
      const games = [sampleSavedGame];
      const exportData = serializer.exportToFEN(games);
      
      expect(exportData.format).toBe('fen');
      expect(exportData.data).toContain(sampleGameState.fen);
      expect(exportData.filename).toMatch(/\.json$/);
      expect(exportData.metadata.gameCount).toBe(1);
    });

    it('should export games to JSON format', () => {
      const games = [sampleSavedGame];
      const exportData = serializer.exportToJSON(games);
      
      expect(exportData.format).toBe('json');
      const parsed = JSON.parse(exportData.data);
      expect(parsed.games).toHaveLength(1);
      expect(parsed.games[0].name).toBe('Test Game');
      expect(exportData.filename).toMatch(/\.json$/);
    });

    it('should handle empty games array', () => {
      const exportData = serializer.exportToPGN([]);
      expect(exportData.data).toBe('');
      expect(exportData.metadata.gameCount).toBe(0);
    });
  });

  // =============================================================================
  // IMPORT TESTS
  // =============================================================================

  describe('Import Functionality', () => {
    it('should import from JSON format', () => {
      const games = [sampleSavedGame];
      const exportData = serializer.exportToJSON(games);
      const importResult = serializer.importFromJSON(exportData.data);
      
      expect(importResult.success).toBe(true);
      expect(importResult.gamesImported).toBe(1);
      expect(importResult.errors).toHaveLength(0);
      expect(importResult.importedGames).toHaveLength(1);
      expect(importResult.importedGames![0].name).toBe('Test Game');
    });

    it('should handle invalid JSON import', () => {
      const importResult = serializer.importFromJSON('invalid json');
      
      expect(importResult.success).toBe(false);
      expect(importResult.gamesImported).toBe(0);
      expect(importResult.errors.length).toBeGreaterThan(0);
      expect(importResult.errors[0]).toContain('JSON parsing failed');
    });

    it('should handle malformed JSON structure', () => {
      const malformedData = JSON.stringify({ notGames: [] });
      const importResult = serializer.importFromJSON(malformedData);
      
      expect(importResult.success).toBe(false);
      expect(importResult.errors[0]).toContain('missing games array');
    });

    it('should import from PGN format', () => {
      const pgnData = `[Event "Test Tournament"]
[Site "Test Site"]
[Date "2024.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 1-0`;

      const importResult = serializer.importFromPGN(pgnData);
      
      expect(importResult.success).toBe(true);
      expect(importResult.gamesImported).toBe(1);
      expect(importResult.importedGames).toHaveLength(1);
      expect(importResult.importedGames![0].name).toBe('Test Tournament');
    });

    it('should handle empty PGN data', () => {
      const importResult = serializer.importFromPGN('');
      
      expect(importResult.success).toBe(false);
      expect(importResult.gamesImported).toBe(0);
      expect(importResult.errors[0]).toContain('No valid games found');
    });
  });

  // =============================================================================
  // VALIDATION TESTS
  // =============================================================================

  describe('Validation', () => {
    it('should validate correct serialized game', () => {
      const serialized = {
        version: '1.0.0',
        timestamp: Date.now(),
        gameState: sampleGameState,
      };

      const validation = serializer.validateSerializedGame(serialized);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing version', () => {
      const serialized = {
        timestamp: Date.now(),
        gameState: sampleGameState,
      } as any;

      const validation = serializer.validateSerializedGame(serialized);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.field === 'version')).toBe(true);
    });

    it('should detect invalid game state', () => {
      const serialized = {
        version: '1.0.0',
        timestamp: Date.now(),
        gameState: { ...sampleGameState, fen: null },
      } as any;

      const validation = serializer.validateSerializedGame(serialized);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.field === 'gameState.fen')).toBe(true);
    });

    it('should warn about version mismatch', () => {
      const serialized = {
        version: '0.9.0',
        timestamp: Date.now(),
        gameState: sampleGameState,
      };

      const validation = serializer.validateSerializedGame(serialized);
      expect(validation.warnings.some(w => w.type === 'VERSION_MISMATCH')).toBe(true);
    });
  });

  // =============================================================================
  // ERROR HANDLING TESTS
  // =============================================================================

  describe('Error Handling', () => {
    it('should handle deserialization with validation disabled', () => {
      const invalidData = JSON.stringify({
        version: '1.0.0',
        gameState: { ...sampleGameState, fen: null },
      });

      const result = serializer.deserializeGameState(invalidData, { validateOnImport: false });
      expect(result).not.toBeNull(); // Should succeed without validation
    });

    it('should handle deserialization with validation enabled', () => {
      const invalidData = JSON.stringify({
        version: '1.0.0',
        gameState: { ...sampleGameState, fen: null },
      });

      const result = serializer.deserializeGameState(invalidData, { validateOnImport: true });
      expect(result).toBeNull(); // Should fail with validation
    });

    it('should handle corrupted compressed data', () => {
      const result = serializer.deserializeGameState('CHESS_GAME:compressed:invalid-base64');
      expect(result).toBeNull();
    });
  });

  // =============================================================================
  // INTEGRATION TESTS
  // =============================================================================

  describe('Integration Tests', () => {
    it('should handle complete export-import cycle', () => {
      const originalGames = [sampleSavedGame];
      
      // Export to JSON
      const exportData = serializer.exportToJSON(originalGames);
      
      // Import back
      const importResult = serializer.importFromJSON(exportData.data);
      
      expect(importResult.success).toBe(true);
      expect(importResult.importedGames).toHaveLength(1);
      
      const importedGame = importResult.importedGames![0];
      expect(importedGame.name).toBe(originalGames[0].name);
      expect(importedGame.gameState.fen).toBe(originalGames[0].gameState.fen);
      expect(importedGame.moveCount).toBe(originalGames[0].moveCount);
    });

    it('should preserve all data through serialization cycle', () => {
      const serialized = serializer.serializeGameState(sampleGameState, { 
        compress: true, 
        includeMetadata: true 
      });
      
      const deserialized = serializer.deserializeGameState(serialized);
      
      expect(deserialized).not.toBeNull();
      expect(deserialized!.fen).toBe(sampleGameState.fen);
      expect(deserialized!.pgn).toBe(sampleGameState.pgn);
      expect(deserialized!.moves).toEqual(sampleGameState.moves);
      expect(deserialized!.currentPlayer).toBe(sampleGameState.currentPlayer);
      expect(deserialized!.status).toBe(sampleGameState.status);
      expect(deserialized!.result).toBe(sampleGameState.result);
      expect(deserialized!.startDate).toEqual(sampleGameState.startDate);
    });
  });
});