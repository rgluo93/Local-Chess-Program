# Chess Application System Design Document

## 1. Executive Summary

This document outlines the modular system architecture for a localhost-based chess application supporting offline human-vs-human games with a comprehensive visual UI. The system is designed to meet all functional and non-functional requirements while maintaining extensibility for future enhancements.

**Technology Stack:**
- **Frontend**: TypeScript + React, Canvas/SVG rendering, CSS animations
- **Backend**: Node.js + Express server
- **Game Logic**: Chess.js library with custom extensions
- **Storage**: Browser LocalStorage API
- **Deployment**: Localhost web application (http://localhost:3000)

## 2. System Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Client                       │
├─────────────────────────────────────────────────────────┤
│  Presentation Layer (React Components)                  │
│  ├─ Board Renderer (Canvas/SVG)                        │
│  ├─ UI Controls (Buttons, Dialogs)                     │
│  ├─ Animation Engine (CSS + Canvas)                    │
│  └─ Event Handlers (Drag/Drop, Keyboard)              │
├─────────────────────────────────────────────────────────┤
│  Application Layer (React State Management)             │
│  ├─ Game State Manager                                 │
│  ├─ Move History Tracker                              │
│  ├─ UI State Controller                               │
│  └─ Persistence Manager                               │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer                                   │
│  ├─ Chess Engine (Extended Chess.js)                  │
│  ├─ Move Validator                                     │
│  ├─ Endgame Detector                                   │
│  └─ Notation Generator (PGN/FEN)                      │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                            │
│  ├─ LocalStorage Interface                            │
│  ├─ Game Serialization                                │
│  └─ State Persistence                                 │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                   Express Server                        │
│  ├─ Static File Serving                               │
│  ├─ API Endpoints (Optional)                          │
│  └─ Offline Asset Management                          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Core Modules

## 3. Detailed Architecture

### 3.1 Presentation Layer

#### 3.1.1 Board Renderer Module
**Responsibility**: Render 8×8 chessboard with pieces and visual feedback
- **Technology**: Canvas API for performance-critical animations
- **Components**:
  - `BoardCanvas`: Main board rendering component
  - `PieceRenderer`: Individual piece rendering with SVG assets
  - `SquareHighlighter`: Visual feedback for moves/checks/selections
  - `CoordinateLabels`: File (a-h) and rank (1-8) labels with zoom scaling

#### 3.1.2 Animation Engine Module
**Responsibility**: Handle all visual animations and transitions
- **Components**:
  - `DragDropAnimator`: Real-time piece dragging with mouse cursor tracking
  - `MoveAnimator`: Smooth piece transitions between squares
  - `ZoomController`: Elastic board scaling (384px-1024px, 48px-128px per square)
  - `TransitionManager`: Coordinate all animations at 60fps

#### 3.1.3 UI Controls Module
**Responsibility**: All user interface components
- **Components**:
  - `GameControls`: New Game, Resign, Save/Load buttons
  - `MoveHistory`: Right-side panel with algebraic notation
  - `PromotionDialog`: Pawn promotion piece selection modal
  - `GameStatus`: Checkmate/stalemate/draw notifications
  - `ZoomButtons`: Floating +/- controls with opacity management

### 3.2 Application Layer

#### 3.2.1 Game State Manager
**Responsibility**: Central state management for entire application
```typescript
interface GameState {
  board: ChessBoard;
  currentPlayer: 'white' | 'black';
  gameStatus: 'playing' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';
  moveHistory: Move[];
  gameMetadata: {
    startTime: Date;
    players: { white: string; black: string; };
  };
}
```

#### 3.2.2 UI State Controller
**Responsibility**: Manage UI-specific state separate from game logic
```typescript
interface UIState {
  selectedSquare: Square | null;
  validMoves: Square[];
  dragState: DragState | null;
  zoomLevel: number; // 48-128px per square
  highlightedSquares: {
    lastMove: [Square, Square] | null;
    check: Square | null;
    invalid: Square | null;
  };
}
```

#### 3.2.3 Persistence Manager
**Responsibility**: Handle save/load operations and localStorage interface
- **Functions**:
  - `saveGame(gameState: GameState): void`
  - `loadGame(): GameState | null`
  - `exportPGN(): string`
  - `exportFEN(): string`
  - `checkForSavedGame(): boolean`

### 3.3 Business Logic Layer

#### 3.3.1 Extended Chess Engine
**Responsibility**: Core game logic extending Chess.js
- **Base**: Chess.js library for standard rule validation
- **Extensions**:
  - Enhanced move validation with detailed error reporting
  - Threefold repetition tracking
  - 50-move rule enforcement
  - Insufficient material detection
  - Custom FEN/PGN generation

#### 3.3.2 Move Validator
**Responsibility**: Pre-validation and move legality checking
```typescript
interface MoveValidationResult {
  isValid: boolean;
  errorType?: 'illegal' | 'check' | 'blocked' | 'outOfBounds';
  validMoves?: Square[];
  specialMoveType?: 'castle' | 'enPassant' | 'promotion';
}
```

#### 3.3.3 Endgame Detector
**Responsibility**: Detect all game-ending conditions
- **Detection Methods**:
  - Checkmate analysis
  - Stalemate detection
  - Draw by insufficient material
  - Draw by threefold repetition
  - Draw by 50-move rule
  - Resignation handling

### 3.4 Data Layer

#### 3.4.1 LocalStorage Interface
**Responsibility**: Browser storage abstraction
- **Storage Keys**:
  - `chess-game-current`: Current game state
  - `chess-game-history`: Game history for replay
  - `chess-settings`: UI preferences and zoom levels

#### 3.4.2 Serialization Module
**Responsibility**: Convert game state to/from storable formats
- **Formats**: JSON for localStorage, PGN/FEN for export
- **Compression**: Minimize storage footprint for move history

## 4. Component Specifications

### 4.1 React Component Hierarchy

```
App
├── GameContainer
│   ├── ChessBoard
│   │   ├── BoardCanvas
│   │   ├── PieceLayer
│   │   ├── HighlightLayer
│   │   └── CoordinateLabels
│   ├── GameControls
│   │   ├── NewGameButton
│   │   ├── ResignButton
│   │   ├── SaveButton
│   │   ├── LoadButton
│   │   └── CopyNotationButton
│   ├── MoveHistoryPanel
│   ├── GameStatusDisplay
│   ├── ZoomControls
│   └── PromotionModal
└── GlobalModals
    ├── SaveGameModal
    └── LoadGameModal
```

### 4.2 Key Interfaces

#### 4.2.1 Move Interface
```typescript
interface Move {
  from: Square;
  to: Square;
  piece: PieceType;
  captured?: PieceType;
  promotion?: PieceType;
  specialMove?: 'castle' | 'enPassant';
  notation: string;
  timestamp: number;
  fen: string; // Board state after move
}
```

#### 4.2.2 Board State Interface
```typescript
interface ChessBoard {
  squares: (Piece | null)[][];  // 8x8 array
  toMove: 'white' | 'black';
  castlingRights: CastlingRights;
  enPassantTarget: Square | null;
  halfmoveClock: number;
  fullmoveNumber: number;
}
```

## 5. Performance Requirements

### 5.1 Response Time Targets
- **User Input Response**: ≤ 16ms (60fps for animations)
- **Move Validation**: ≤ 10ms per move
- **Board Rendering**: ≤ 16ms per frame
- **Game State Persistence**: ≤ 50ms
- **Overall Action Response**: ≤ 100ms (requirement compliance)

### 5.2 Optimization Strategies
- **Canvas Rendering**: Use layered canvases for pieces, highlights, and board
- **Event Throttling**: Limit resize and drag events to 60fps
- **Memoization**: Cache expensive calculations (valid moves, board evaluation)
- **Asset Optimization**: SVG pieces with optimized paths
- **State Updates**: Minimize React re-renders with proper state management

## 6. Responsive Design System

### 6.1 Zoom System
- **Range**: 48px to 128px per square (384px to 1024px board)
- **Controls**: Keyboard (Ctrl+/-), Mouse (Ctrl+Scroll), Button controls
- **Scaling**: Proportional scaling of all elements including coordinates
- **Animation**: Elastic easing transitions (200ms)

### 6.2 Window Resize Handling
- **Real-time**: 60fps updates during window resize
- **Constraints**: Maintain square aspect ratio, respect zoom limits
- **Layout**: Prevent UI overlap, automatic reflow of adjacent elements
- **Performance**: Optimized DOM updates, minimal repaints

## 7. Error Handling & Edge Cases

### 7.1 Move Validation Errors
- **Visual Feedback**: Red highlight on invalid piece, snap-back animation
- **Error Types**: Illegal move, leaves king in check, piece blocked
- **Recovery**: Automatic piece return, clear visual state

### 7.2 Game State Corruption
- **Detection**: Validate game state integrity on load
- **Recovery**: Fallback to last known good state or new game
- **Logging**: Console warnings for debugging

### 7.3 Browser Compatibility
- **Fallbacks**: SVG rendering if Canvas not available
- **LocalStorage**: Graceful degradation if storage unavailable
- **Event Handling**: Cross-browser event normalization

## 8. Testing Strategy

### 8.1 Unit Testing
- **Game Logic**: Chess rule validation, move generation
- **State Management**: Game state transitions, persistence
- **Utilities**: FEN/PGN parsing, serialization

### 8.2 Integration Testing
- **Component Interaction**: Board rendering with game state
- **User Workflows**: Complete game scenarios from test suite
- **Performance**: Animation smoothness, response times

### 8.3 End-to-End Testing
- **Test Scenarios**: All 20 test cases from requirements
- **Visual Validation**: Screenshot comparison for UI consistency
- **User Experience**: Complete game workflow testing

## 9. Development Phases

### Phase 1: Core Game Logic
- Chess.js integration and extension
- Basic move validation and game state management
- FEN/PGN export functionality

### Phase 2: Basic UI
- React component structure
- Canvas board rendering
- Basic piece movement (click-to-move)

### Phase 3: Advanced Interactions
- Drag-and-drop implementation
- Animation system
- Visual feedback and highlights

### Phase 4: Responsive Design
- Zoom system implementation
- Window resize handling
- UI layout optimization

### Phase 5: Game Features
- Save/load functionality
- Move history panel
- Special moves (castling, en passant, promotion)

### Phase 6: Polish & Testing
- Complete test suite implementation
- Performance optimization
- Bug fixes and edge case handling

## 10. Extensibility Considerations

### 10.1 Future AI Integration
- **Interface**: `AIPlayer` interface for engine integration
- **Communication**: Standard UCI protocol support preparation
- **Threading**: Web Workers for AI calculations without UI blocking

### 10.2 Online Multiplayer Preparation
- **State Synchronization**: Centralized state management ready for networking
- **Message Protocol**: Move transmission format defined
- **Conflict Resolution**: Preparatory structures for move validation conflicts

### 10.3 Advanced Analysis
- **Move Evaluation**: Interface for external analysis engines
- **Position Database**: Structure for opening book integration
- **Game Review**: Framework for post-game analysis features