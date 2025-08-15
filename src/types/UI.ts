/**
 * UI Component Types and Interfaces
 * 
 * This file defines all TypeScript interfaces for React components,
 * props, events, and UI-specific functionality.
 */

import { MouseEvent, KeyboardEvent as ReactKeyboardEvent, DragEvent } from 'react';
import { Square, PieceType, PieceColor, Move } from './Chess';
import { DragState } from './GameState';

// =============================================================================
// COMPONENT PROP INTERFACES
// =============================================================================

export interface ChessBoardProps {
  width: number;
  height: number;
  pieces: BoardPiece[];
  selectedSquare?: Square | null;
  validMoves?: Square[];
  checkSquare?: Square | null;
  onSquareClick: (square: Square) => void;
  onPieceDragStart: (square: Square, piece: BoardPiece) => void;
  onPieceDragEnd: (fromSquare: Square, toSquare: Square | null) => void;
  onPieceDrag: (position: { x: number; y: number }) => void;
  isInteractive?: boolean;
  showCoordinates?: boolean;
  flipBoard?: boolean;
  highlightStyle?: HighlightStyle;
  className?: string;
}

export interface BoardPiece {
  type: PieceType;
  color: PieceColor;
  square: Square;
  isSelected?: boolean;
  isDragging?: boolean;
  canMove?: boolean;
}

export interface GameControlsProps {
  gameStatus: string;
  currentPlayer: PieceColor;
  canUndo: boolean;
  canRedo: boolean;
  canResign: boolean;
  onNewGame: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onResign: () => void;
  onSaveGame: () => void;
  onLoadGame: () => void;
  onCopyPGN: () => void;
  onCopyFEN: () => void;
  disabled?: boolean;
  className?: string;
}

export interface MoveHistoryProps {
  moves: Move[];
  currentMoveIndex: number;
  onMoveClick: (moveIndex: number) => void;
  onNavigateToMove: (moveIndex: number) => void;
  maxHeight?: number;
  showMoveNumbers?: boolean;
  highlightCurrentMove?: boolean;
  className?: string;
}

export interface ZoomControlsProps {
  currentZoom: number;
  minZoom: number;
  maxZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (zoom: number) => void;
  disabled?: boolean;
  showButtons?: boolean;
  showSlider?: boolean;
  className?: string;
}

// =============================================================================
// MODAL COMPONENT PROPS
// =============================================================================

export interface PromotionModalProps {
  isOpen: boolean;
  color: PieceColor;
  onSelectPiece: (piece: 'queen' | 'rook' | 'bishop' | 'knight') => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

export interface GameEndModalProps {
  isOpen: boolean;
  result: string;
  winner?: PieceColor;
  reason: string;
  moveCount: number;
  gameTime: string;
  onNewGame: () => void;
  onSaveGame: () => void;
  onClose: () => void;
}

export interface SaveGameModalProps {
  isOpen: boolean;
  currentGameName: string;
  onSave: (name: string) => Promise<boolean>;
  onClose: () => void;
  existingNames: string[];
}

export interface LoadGameModalProps {
  isOpen: boolean;
  savedGames: SavedGameInfo[];
  onLoad: (gameId: string) => Promise<boolean>;
  onDelete: (gameId: string) => Promise<boolean>;
  onClose: () => void;
}

export interface SavedGameInfo {
  id: string;
  name: string;
  date: Date;
  moveCount: number;
  result: string;
  preview: string; // FEN or thumbnail
}

// =============================================================================
// EVENT HANDLER INTERFACES
// =============================================================================

export interface SquareClickEvent {
  square: Square;
  piece: BoardPiece | null;
  mouseEvent: MouseEvent<HTMLElement>;
  isValidMove: boolean;
}

export interface PieceDragEvent {
  piece: BoardPiece;
  startSquare: Square;
  currentSquare: Square | null;
  position: { x: number; y: number };
  dragEvent: DragEvent<HTMLElement>;
}

export interface MoveEvent {
  move: Move;
  isValid: boolean;
  gameEnded: boolean;
  newGameStatus: string;
}

export interface ChessKeyboardEvent extends ReactKeyboardEvent<HTMLElement> {
  square?: Square;
  action?: KeyboardAction;
}

export type KeyboardAction = 
  | 'SELECT_SQUARE'
  | 'MOVE_PIECE'
  | 'CANCEL_SELECTION'
  | 'UNDO_MOVE'
  | 'REDO_MOVE'
  | 'NEW_GAME'
  | 'ZOOM_IN'
  | 'ZOOM_OUT'
  | 'TOGGLE_COORDINATES';

// =============================================================================
// STYLING AND THEMING
// =============================================================================

export interface ChessTheme {
  name: string;
  boardColors: {
    light: string;
    dark: string;
  };
  highlightColors: {
    selected: string;
    validMove: string;
    check: string;
    invalid: string;
  };
  pieceStyle: PieceStyle;
  boardStyle: BoardStyle;
  uiColors: UIColorScheme;
}

export interface PieceStyle {
  type: 'classic' | 'modern' | 'custom';
  strokeWidth: number;
  strokeColor: string;
  fillColors: {
    white: string;
    black: string;
  };
  shadowEnabled: boolean;
  shadowColor?: string;
  shadowBlur?: number;
}

export interface BoardStyle {
  showCoordinates: boolean;
  coordinateColor: string;
  coordinateFont: string;
  borderWidth: number;
  borderColor: string;
  cornerRadius: number;
}

export interface UIColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  error: string;
  warning: string;
  success: string;
}

export interface HighlightStyle {
  type: 'solid' | 'border' | 'glow';
  opacity: number;
  duration: number; // animation duration in ms
  color: string;
  thickness?: number; // for border type
  blur?: number; // for glow type
}

// =============================================================================
// ANIMATION INTERFACES
// =============================================================================

export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: AnimationEasing;
  fps: number;
}

export type AnimationEasing = 
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'cubic-bezier';

export interface PieceAnimation {
  from: { x: number; y: number };
  to: { x: number; y: number };
  piece: BoardPiece;
  duration: number;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}

export interface BoardAnimation {
  type: AnimationType;
  duration: number;
  delay?: number;
  onStart?: () => void;
  onComplete?: () => void;
}

export type AnimationType = 
  | 'PIECE_MOVE'
  | 'PIECE_CAPTURE'
  | 'PIECE_PROMOTION'
  | 'CASTLING'
  | 'EN_PASSANT'
  | 'BOARD_FLIP'
  | 'ZOOM_CHANGE'
  | 'HIGHLIGHT_FLASH';

// =============================================================================
// CANVAS RENDERING INTERFACES
// =============================================================================

export interface CanvasRenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  squareSize: number;
  devicePixelRatio: number;
}

export interface RenderLayer {
  name: string;
  zIndex: number;
  visible: boolean;
  render: (context: CanvasRenderContext) => void;
  needsRedraw: boolean;
}

export interface PieceImageCache {
  [key: string]: HTMLImageElement | ImageBitmap;
}

export interface BoardRenderState {
  pieces: BoardPiece[];
  highlights: HighlightedSquare[];
  dragState: DragState | null;
  showCoordinates: boolean;
  theme: ChessTheme;
  needsRedraw: boolean;
}

export interface HighlightedSquare {
  square: Square;
  type: HighlightType;
  color: string;
  opacity: number;
}

export type HighlightType = 
  | 'selected'
  | 'validMove'
  | 'check'
  | 'invalid'
  | 'hover';

// =============================================================================
// ACCESSIBILITY INTERFACES
// =============================================================================

export interface AccessibilityProps {
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-pressed'?: boolean;
  'aria-selected'?: boolean;
  'aria-disabled'?: boolean;
  'aria-expanded'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  tabIndex?: number;
}

export interface ScreenReaderAnnouncement {
  text: string;
  priority: 'low' | 'medium' | 'high';
  delay?: number;
}

// =============================================================================
// RESPONSIVE DESIGN INTERFACES
// =============================================================================

export interface ResponsiveConfig {
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  boardSizes: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  layoutMode: LayoutMode;
}

export type LayoutMode = 'compact' | 'standard' | 'expanded';

export interface ViewportInfo {
  width: number;
  height: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

export interface PerformanceMetrics {
  renderTime: number;
  frameRate: number;
  memoryUsage: number;
  lastUpdateTime: number;
  totalRenders: number;
  droppedFrames: number;
}

export interface RenderStats {
  averageFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  frameCount: number;
  isPerformanceGood: boolean;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type ComponentSize = 'small' | 'medium' | 'large';

export type ComponentVariant = 'primary' | 'secondary' | 'outlined' | 'text';

export type Position = {
  x: number;
  y: number;
};

export type Dimensions = {
  width: number;
  height: number;
};

export type Rectangle = Position & Dimensions;

// =============================================================================
// COMPONENT REFS AND FORWARDING
// =============================================================================

export interface ChessBoardRef {
  getCanvasElement: () => HTMLCanvasElement | null;
  redraw: () => void;
  exportImage: (format?: 'png' | 'jpeg') => string;
  focus: () => void;
  getSquareFromPixel: (x: number, y: number) => Square | null;
  getPixelFromSquare: (square: Square) => Position;
}

export interface GameControlsRef {
  focus: () => void;
  highlightButton: (action: string) => void;
}

// =============================================================================
// ERROR BOUNDARIES
// =============================================================================

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: { componentStack: string };
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  componentName: string;
}