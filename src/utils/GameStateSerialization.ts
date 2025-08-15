/**
 * GameStateSerialization - Game State Serialization System
 * 
 * This utility provides comprehensive game state serialization including:
 * - Complete game state serialization to JSON format
 * - State compression for efficient storage
 * - Version management for backward compatibility
 * - Import/export functionality for saved games
 */

// Note: In a real implementation, you would install pako for compression
// For this implementation, we'll use simple base64 encoding as a placeholder
import type {
  Move,
  SavedGame,
  GameState,
} from '@/types/Chess';
import type {
  AppState,
  GameStorage,
  ExportData,
  ImportResult,
  StateValidationResult,
  ValidationError,
  ValidationWarning,
} from '@/types/GameState';

export interface SerializationOptions {
  compress?: boolean;
  includeMetadata?: boolean;
  validateOnImport?: boolean;
  version?: string;
}

export interface SerializedGame {
  version: string;
  timestamp: number;
  gameState: GameState;
  metadata?: GameMetadata;
  checksum?: string;
}

export interface GameMetadata {
  playerNames?: [string, string];
  timeControl?: string;
  tournament?: string;
  round?: string;
  opening?: string;
  eco?: string;
  annotations?: string[];
  tags?: Record<string, string>;
}

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionTime: number;
}

const CURRENT_VERSION = '1.0.0';
const MAGIC_HEADER = 'CHESS_GAME';

export class GameStateSerialization {
  private static instance: GameStateSerialization;

  public static getInstance(): GameStateSerialization {
    if (!GameStateSerialization.instance) {
      GameStateSerialization.instance = new GameStateSerialization();
    }
    return GameStateSerialization.instance;
  }

  // =============================================================================
  // GAME STATE SERIALIZATION
  // =============================================================================

  public serializeGameState(
    gameState: GameState,
    options: SerializationOptions = {}
  ): string {
    const opts = {
      compress: false,
      includeMetadata: true,
      version: CURRENT_VERSION,
      ...options,
    };

    const serialized: SerializedGame = {
      version: opts.version,
      timestamp: Date.now(),
      gameState: this.cleanGameState(gameState),
    };

    if (opts.includeMetadata) {
      serialized.metadata = this.extractMetadata(gameState);
    }

    const jsonString = JSON.stringify(serialized);
    
    if (opts.compress) {
      return this.compressData(jsonString);
    }

    return jsonString;
  }

  public deserializeGameState(
    data: string,
    options: SerializationOptions = {}
  ): GameState | null {
    const opts = {
      validateOnImport: true,
      ...options,
    };

    try {
      // Try to decompress first
      let jsonString = data;
      if (this.isCompressed(data)) {
        jsonString = this.decompressData(data);
      }

      const serialized: SerializedGame = JSON.parse(jsonString, this.dateReviver);

      if (opts.validateOnImport) {
        const validation = this.validateSerializedGame(serialized);
        if (!validation.isValid) {
          console.warn('Game state validation failed:', validation.errors);
          return null;
        }
      }

      return this.restoreGameState(serialized.gameState);
    } catch (error) {
      console.error('Failed to deserialize game state:', error);
      return null;
    }
  }

  // =============================================================================
  // COMPLETE APP STATE SERIALIZATION
  // =============================================================================

  public serializeAppState(appState: AppState, options: SerializationOptions = {}): string {
    const opts = {
      compress: true,
      includeMetadata: true,
      version: CURRENT_VERSION,
      ...options,
    };

    const serializedData = {
      version: opts.version,
      timestamp: Date.now(),
      magic: MAGIC_HEADER,
      appState: {
        currentGame: appState.currentGame ? this.cleanGameState(appState.currentGame) : null,
        gameHistory: appState.gameHistory.map(game => this.cleanSavedGame(game)),
        settings: appState.settings,
        // Note: UI state is not serialized as it's session-specific
      },
    };

    const jsonString = JSON.stringify(serializedData, this.dateReplacer);
    
    if (opts.compress) {
      return this.compressData(jsonString);
    }

    return jsonString;
  }

  public deserializeAppState(data: string, options: SerializationOptions = {}): Partial<AppState> | null {
    try {
      let jsonString = data;
      if (this.isCompressed(data)) {
        jsonString = this.decompressData(data);
      }

      const parsed = JSON.parse(jsonString, this.dateReviver);

      if (parsed.magic !== MAGIC_HEADER) {
        throw new Error('Invalid file format');
      }

      return {
        currentGame: parsed.appState.currentGame ? this.restoreGameState(parsed.appState.currentGame) : null,
        gameHistory: parsed.appState.gameHistory?.map((game: any) => this.restoreSavedGame(game)) || [],
        settings: parsed.appState.settings,
      };
    } catch (error) {
      console.error('Failed to deserialize app state:', error);
      return null;
    }
  }

  // =============================================================================
  // EXPORT FUNCTIONALITY
  // =============================================================================

  public exportToPGN(games: SavedGame[]): ExportData {
    let pgnContent = '';
    
    for (const game of games) {
      // Add headers
      pgnContent += `[Event "${game.name}"]\n`;
      pgnContent += `[Date "${game.gameDate.toISOString().split('T')[0].replace(/-/g, '.')}"]\n`;
      pgnContent += `[White "White Player"]\n`;
      pgnContent += `[Black "Black Player"]\n`;
      pgnContent += `[Result "${this.gameResultToPGN(game.result)}"]\n`;
      if (game.duration) {
        pgnContent += `[TimeControl "${Math.floor(game.duration / 1000)}s"]\n`;
      }
      pgnContent += '\n';

      // Add moves
      for (let i = 0; i < game.gameState.moves.length; i++) {
        const move = game.gameState.moves[i];
        const moveNumber = Math.floor(i / 2) + 1;
        
        if (i % 2 === 0) {
          pgnContent += `${moveNumber}. `;
        }
        
        pgnContent += move.notation;
        
        if (i < game.gameState.moves.length - 1) {
          pgnContent += ' ';
        }
      }

      pgnContent += ` ${this.gameResultToPGN(game.result)}\n\n`;
    }

    return {
      format: 'pgn',
      data: pgnContent.trim(),
      filename: `chess_games_${new Date().toISOString().split('T')[0]}.pgn`,
      metadata: {
        exportDate: new Date(),
        gameCount: games.length,
        appVersion: CURRENT_VERSION,
      },
    };
  }

  public exportToFEN(games: SavedGame[]): ExportData {
    const fenData = games.map(game => ({
      name: game.name,
      fen: game.gameState.fen,
      date: game.gameDate.toISOString(),
      result: game.result,
    }));

    return {
      format: 'fen',
      data: JSON.stringify(fenData, null, 2),
      filename: `chess_positions_${new Date().toISOString().split('T')[0]}.json`,
      metadata: {
        exportDate: new Date(),
        gameCount: games.length,
        appVersion: CURRENT_VERSION,
      },
    };
  }

  public exportToJSON(games: SavedGame[]): ExportData {
    const exportData = {
      version: CURRENT_VERSION,
      exportDate: new Date(),
      games: games.map(game => this.cleanSavedGame(game)),
    };

    return {
      format: 'json',
      data: JSON.stringify(exportData, this.dateReplacer, 2),
      filename: `chess_games_${new Date().toISOString().split('T')[0]}.json`,
      metadata: {
        exportDate: new Date(),
        gameCount: games.length,
        appVersion: CURRENT_VERSION,
      },
    };
  }

  // =============================================================================
  // IMPORT FUNCTIONALITY
  // =============================================================================

  public importFromPGN(pgnData: string): ImportResult {
    const result: ImportResult = {
      success: false,
      gamesImported: 0,
      errors: [],
      warnings: [],
      importedGames: [],
    };

    try {
      const games = this.parsePGN(pgnData);
      result.importedGames = games;
      result.gamesImported = games.length;
      result.success = games.length > 0;
      
      if (games.length === 0) {
        result.errors.push('No valid games found in PGN data');
      }
    } catch (error) {
      result.errors.push(`PGN parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  public importFromJSON(jsonData: string): ImportResult {
    const result: ImportResult = {
      success: false,
      gamesImported: 0,
      errors: [],
      warnings: [],
      importedGames: [],
    };

    try {
      const parsed = JSON.parse(jsonData, this.dateReviver);
      
      if (!parsed.games || !Array.isArray(parsed.games)) {
        result.errors.push('Invalid JSON format: missing games array');
        return result;
      }

      const games = parsed.games.map((game: any) => this.restoreSavedGame(game));
      result.importedGames = games;
      result.gamesImported = games.length;
      result.success = true;

      if (parsed.version !== CURRENT_VERSION) {
        result.warnings.push(`Version mismatch: imported ${parsed.version}, current ${CURRENT_VERSION}`);
      }
    } catch (error) {
      result.errors.push(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  // =============================================================================
  // COMPRESSION
  // =============================================================================

  public compressGameState(gameState: GameState): { data: string; stats: CompressionStats } {
    const startTime = performance.now();
    const originalJson = JSON.stringify(gameState);
    const originalSize = originalJson.length;

    // Simple base64 encoding as placeholder for real compression
    const compressed = btoa(originalJson);
    const compressedSize = compressed.length;
    const compressionTime = performance.now() - startTime;

    return {
      data: compressed,
      stats: {
        originalSize,
        compressedSize,
        compressionRatio: originalSize / compressedSize,
        compressionTime,
      },
    };
  }

  public decompressGameState(compressedData: string): GameState | null {
    try {
      const decompressed = atob(compressedData);
      return JSON.parse(decompressed, this.dateReviver);
    } catch {
      return null;
    }
  }

  // =============================================================================
  // VALIDATION
  // =============================================================================

  public validateSerializedGame(serialized: SerializedGame): StateValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check version
    if (!serialized.version) {
      errors.push({
        type: 'MISSING_OPTIONAL_FIELD',
        message: 'Missing version information',
        field: 'version',
      });
    } else if (serialized.version !== CURRENT_VERSION) {
      warnings.push({
        type: 'VERSION_MISMATCH',
        message: `Version mismatch: ${serialized.version} vs ${CURRENT_VERSION}`,
        field: 'version',
        suggestion: 'Consider updating the file format',
      });
    }

    // Validate game state
    if (!serialized.gameState) {
      errors.push({
        type: 'INVALID_GAME_STATE',
        message: 'Missing game state',
        field: 'gameState',
      });
    } else {
      if (!serialized.gameState.fen || typeof serialized.gameState.fen !== 'string') {
        errors.push({
          type: 'INVALID_GAME_STATE',
          message: 'Invalid or missing FEN string',
          field: 'gameState.fen',
          value: serialized.gameState.fen,
        });
      }

      if (!Array.isArray(serialized.gameState.moves)) {
        errors.push({
          type: 'INVALID_GAME_STATE',
          message: 'Invalid move history',
          field: 'gameState.moves',
          value: serialized.gameState.moves,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private compressData(data: string): string {
    try {
      // Simple base64 encoding as placeholder
      const compressed = btoa(data);
      return MAGIC_HEADER + ':compressed:' + compressed;
    } catch {
      return data; // Return original if compression fails
    }
  }

  private decompressData(data: string): string {
    if (!this.isCompressed(data)) return data;

    try {
      const compressedPart = data.split(':compressed:')[1];
      return atob(compressedPart);
    } catch {
      throw new Error('Failed to decompress data');
    }
  }

  private isCompressed(data: string): boolean {
    return data.startsWith(MAGIC_HEADER + ':compressed:');
  }

  private cleanGameState(gameState: GameState): GameState {
    return {
      fen: gameState.fen,
      pgn: gameState.pgn,
      moves: gameState.moves.map(move => ({ ...move })),
      currentPlayer: gameState.currentPlayer,
      status: gameState.status,
      result: gameState.result,
      startDate: gameState.startDate,
      endDate: gameState.endDate,
      board: gameState.board,
    };
  }

  private restoreGameState(gameState: any): GameState {
    return {
      fen: gameState.fen,
      pgn: gameState.pgn,
      moves: gameState.moves || [],
      currentPlayer: gameState.currentPlayer,
      status: gameState.status,
      result: gameState.result,
      startDate: gameState.startDate ? new Date(gameState.startDate) : new Date(),
      endDate: gameState.endDate ? new Date(gameState.endDate) : undefined,
      board: gameState.board,
    };
  }

  private cleanSavedGame(game: SavedGame): SavedGame {
    return {
      id: game.id,
      name: game.name,
      gameState: this.cleanGameState(game.gameState),
      saveDate: game.saveDate,
      gameDate: game.gameDate,
      moveCount: game.moveCount,
      status: game.status,
      result: game.result,
      duration: game.duration,
      thumbnail: game.thumbnail,
    };
  }

  private restoreSavedGame(game: any): SavedGame {
    return {
      ...game,
      gameState: this.restoreGameState(game.gameState),
      saveDate: new Date(game.saveDate),
      gameDate: new Date(game.gameDate),
    };
  }

  private extractMetadata(gameState: GameState): GameMetadata {
    return {
      opening: 'Unknown', // Could be determined from moves
      annotations: [],
      tags: {},
    };
  }

  private gameResultToPGN(result: string): string {
    switch (result) {
      case 'white_wins': return '1-0';
      case 'black_wins': return '0-1';
      case 'draw': return '1/2-1/2';
      default: return '*';
    }
  }

  private parsePGN(pgnData: string): SavedGame[] {
    // This is a simplified PGN parser - in a real implementation,
    // you would use a more robust PGN parsing library
    const games: SavedGame[] = [];
    const gameStrings = pgnData.split(/\n\s*\n/);

    for (const gameString of gameStrings) {
      if (gameString.trim()) {
        try {
          const game = this.parseIndividualPGN(gameString.trim());
          if (game) {
            games.push(game);
          }
        } catch (error) {
          console.warn('Failed to parse PGN game:', error);
        }
      }
    }

    return games;
  }

  private parseIndividualPGN(pgnString: string): SavedGame | null {
    // Extract headers
    const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g;
    const headers: Record<string, string> = {};
    let match;

    while ((match = headerRegex.exec(pgnString)) !== null) {
      headers[match[1]] = match[2];
    }

    // Extract moves (simplified)
    const movesSection = pgnString.replace(/\[.*?\]\s*/g, '').trim();
    const moves: Move[] = []; // Would need proper PGN move parsing

    return {
      id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: headers.Event || 'Imported Game',
      gameState: {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Starting position
        pgn: movesSection,
        moves,
        currentPlayer: 'white' as const,
        status: 'playing' as const,
        result: '*' as const,
        startDate: headers.Date ? new Date(headers.Date.replace(/\./g, '-')) : new Date(),
        board: {} as any, // Would need actual board state
      },
      saveDate: new Date(),
      gameDate: headers.Date ? new Date(headers.Date.replace(/\./g, '-')) : new Date(),
      moveCount: moves.length,
      status: 'playing' as const,
      result: headers.Result || '*',
    };
  }

  private pgnResultToGameResult(pgnResult: string): string {
    switch (pgnResult) {
      case '1-0': return 'white_wins';
      case '0-1': return 'black_wins';
      case '1/2-1/2': return 'draw';
      default: return 'ongoing';
    }
  }

  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', __value: value.toISOString() };
    }
    return value;
  }

  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.__value);
    }
    return value;
  }
}