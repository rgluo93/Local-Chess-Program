/**
 * Game State Management Types
 * 
 * This file defines interfaces for managing the overall application state,
 * persistence, and game session management.
 */

import { GameState, Move, PieceColor, Square, GameStatus, GameResult, ChessBoard, SavedGame } from './Chess';

// =============================================================================
// APPLICATION STATE
// =============================================================================

export interface AppState {
  currentGame: GameState | null;
  gameHistory: SavedGame[];
  uiState: UIState;
  settings: AppSettings;
}

export interface UIState {
  selectedSquare: Square | null;
  validMoves: Square[];
  highlightedSquares: HighlightedSquares;
  dragState: DragState | null;
  zoomLevel: number; // 0.5 to 2.0 (representing 48px to 128px per square)
  boardDimensions: BoardDimensions;
  showCoordinates: boolean;
  animationSpeed: AnimationSpeed;
  modalState: ModalState;
}

export interface HighlightedSquares {
  check: Square | null;
  invalid: Square | null;
  selected: Square | null;
  validMoves: Square[];
}

export interface DragState {
  piece: {
    type: string;
    color: PieceColor;
  };
  startSquare: Square;
  currentPosition: {
    x: number;
    y: number;
  };
  offset: {
    x: number;
    y: number;
  };
  isDragging: boolean;
  startTime: number;
}

export interface BoardDimensions {
  width: number;
  height: number;
  squareSize: number;
  margin: number;
}

export type AnimationSpeed = 'slow' | 'normal' | 'fast' | 'instant';

// =============================================================================
// MODAL STATE MANAGEMENT
// =============================================================================

export interface ModalState {
  promotionModal: PromotionModalState | null;
  gameEndModal: GameEndModalState | null;
  saveGameModal: SaveGameModalState | null;
  loadGameModal: LoadGameModalState | null;
  settingsModal: SettingsModalState | null;
}

export interface PromotionModalState {
  square: Square;
  color: PieceColor;
  availablePieces: Array<'queen' | 'rook' | 'bishop' | 'knight'>;
}

export interface GameEndModalState {
  result: GameResult;
  reason: GameStatus;
  winner?: PieceColor;
  totalMoves: number;
  duration: string;
  finalPosition: string; // FEN
}

export interface SaveGameModalState {
  currentGame: GameState;
  suggestedFilename: string;
  overwriteWarning: boolean;
}

export interface LoadGameModalState {
  availableGames: SavedGame[];
  selectedGame: SavedGame | null;
  previewMode: boolean;
}

export interface SettingsModalState {
  currentSettings: AppSettings;
  hasUnsavedChanges: boolean;
}

// =============================================================================
// PERSISTENCE INTERFACES
// =============================================================================

export interface GameStorage {
  currentGame: GameState | null;
  savedGames: SavedGame[];
  settings: AppSettings;
  lastUpdated: Date;
}

// =============================================================================
// SETTINGS INTERFACES
// =============================================================================

export interface AppSettings {
  display: DisplaySettings;
  gameplay: GameplaySettings;
  performance: PerformanceSettings;
  accessibility: AccessibilitySettings;
}

export interface DisplaySettings {
  theme: 'classic' | 'modern' | 'custom';
  boardColors: {
    lightSquare: string;
    darkSquare: string;
  };
  pieceStyle: 'classic' | 'modern' | 'custom';
  showCoordinates: boolean;
  showMoveHistory: boolean;
  highlightValidMoves: boolean;
  animationSpeed: AnimationSpeed;
  zoomLevel: number;
}

export interface GameplaySettings {
  confirmMoves: boolean;
  allowUndo: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // in minutes
  soundEffects: boolean;
  moveNotation: 'algebraic' | 'descriptive';
  showThreats: boolean;
  highlightChecks: boolean;
}

export interface PerformanceSettings {
  enableAnimations: boolean;
  maxFPS: number;
  useGPUAcceleration: boolean;
  memoryOptimization: boolean;
  preloadAssets: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;
  reducedMotion: boolean;
  focusIndicators: boolean;
}

// =============================================================================
// ACTION INTERFACES
// =============================================================================

export interface GameAction {
  type: GameActionType;
  payload?: any;
  timestamp: number;
}

export type GameActionType =
  | 'MAKE_MOVE'
  | 'UNDO_MOVE'
  | 'REDO_MOVE'
  | 'NEW_GAME'
  | 'LOAD_GAME'
  | 'SAVE_GAME'
  | 'RESIGN'
  | 'OFFER_DRAW'
  | 'ACCEPT_DRAW'
  | 'DECLINE_DRAW'
  | 'SELECT_SQUARE'
  | 'DESELECT_SQUARE'
  | 'START_DRAG'
  | 'END_DRAG'
  | 'UPDATE_ZOOM'
  | 'UPDATE_BOARD_SIZE'
  | 'SHOW_MODAL'
  | 'HIDE_MODAL'
  | 'UPDATE_SETTINGS';

// =============================================================================
// GAME HISTORY INTERFACES
// =============================================================================

export interface GameReplay {
  moves: Move[];
  currentIndex: number;
  isReplaying: boolean;
  playbackSpeed: number; // moves per second
  autoPlay: boolean;
}

export interface MoveHistoryEntry {
  move: Move;
  position: string; // FEN before the move
  analysis?: MoveAnalysis;
  timeSpent?: number; // in milliseconds
  comments?: string[];
}

export interface MoveAnalysis {
  isBlunder: boolean;
  isMistake: boolean;
  isInaccuracy: boolean;
  isBrilliant: boolean;
  evaluation?: number; // in centipawns
  bestMove?: string;
  principalVariation?: string[];
}

// =============================================================================
// EXPORT/IMPORT INTERFACES
// =============================================================================

export interface ExportData {
  format: 'pgn' | 'fen' | 'json';
  data: string;
  filename: string;
  metadata: {
    exportDate: Date;
    gameCount: number;
    appVersion: string;
  };
}

export interface ImportResult {
  success: boolean;
  gamesImported: number;
  errors: string[];
  warnings: string[];
  importedGames?: SavedGame[];
}

// =============================================================================
// VALIDATION INTERFACES
// =============================================================================

export interface StateValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'INVALID_GAME_STATE' | 'CORRUPT_DATA' | 'VERSION_MISMATCH';
  message: string;
  field?: string;
  value?: any;
}

export interface ValidationWarning {
  type: 'DEPRECATED_FORMAT' | 'MISSING_OPTIONAL_FIELD' | 'UNUSUAL_STATE';
  message: string;
  field?: string;
  suggestion?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type GameStateUpdate = DeepPartial<GameState>;

export type UIStateUpdate = DeepPartial<UIState>;

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const DEFAULT_UI_STATE: UIState = {
  selectedSquare: null,
  validMoves: [],
  highlightedSquares: {
    check: null,
    invalid: null,
    selected: null,
    validMoves: []
  },
  dragState: null,
  zoomLevel: 1.0,
  boardDimensions: {
    width: 512,
    height: 512,
    squareSize: 64,
    margin: 20
  },
  showCoordinates: true,
  animationSpeed: 'normal',
  modalState: {
    promotionModal: null,
    gameEndModal: null,
    saveGameModal: null,
    loadGameModal: null,
    settingsModal: null
  }
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  display: {
    theme: 'classic',
    boardColors: {
      lightSquare: '#F0D9B5',
      darkSquare: '#B58863'
    },
    pieceStyle: 'classic',
    showCoordinates: true,
    showMoveHistory: true,
    highlightValidMoves: true,
    animationSpeed: 'normal',
    zoomLevel: 1.0
  },
  gameplay: {
    confirmMoves: false,
    allowUndo: true,
    autoSave: true,
    autoSaveInterval: 5,
    soundEffects: false,
    moveNotation: 'algebraic',
    showThreats: false,
    highlightChecks: true
  },
  performance: {
    enableAnimations: true,
    maxFPS: 60,
    useGPUAcceleration: true,
    memoryOptimization: false,
    preloadAssets: true
  },
  accessibility: {
    highContrast: false,
    fontSize: 'medium',
    keyboardNavigation: true,
    screenReaderSupport: false,
    reducedMotion: false,
    focusIndicators: true
  }
};