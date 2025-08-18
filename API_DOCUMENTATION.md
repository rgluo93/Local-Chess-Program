# API Documentation

This document provides comprehensive API documentation for all core modules, interfaces, and functions in the chess program.

## Table of Contents

1. [GameEngine API](#gameengine-api)
2. [Move Validation API](#move-validation-api)
3. [State Management API](#state-management-api)
4. [Persistence API](#persistence-api)
5. [AI Engine API](#ai-engine-api)
6. [Game Analysis API](#game-analysis-api)
7. [UI Component APIs](#ui-component-apis)
8. [Utility Functions](#utility-functions)
9. [Event System](#event-system)

## GameEngine API

### Class: `GameEngine`

Main chess game logic wrapper around Chess.js with extended functionality.

#### Constructor

```typescript
constructor(fen?: string)
```

**Parameters**:
- `fen` (optional): Starting position in FEN notation. Defaults to standard starting position.

**Example**:
```typescript
const engine = new GameEngine();
const engineFromPosition = new GameEngine('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
```

#### Core Methods

##### `makeMove(from: Square, to: Square, promotion?: PieceType): MoveResult`

Attempts to make a move on the board.

**Parameters**:
- `from`: Starting square (e.g., 'e2')
- `to`: Destination square (e.g., 'e4')
- `promotion`: Optional piece type for pawn promotion

**Returns**: `MoveResult` object
```typescript
interface MoveResult {
  isValid: boolean;
  move?: Move;
  error?: MoveErrorType;
  gameStatus: GameStatus;
  isGameOver: boolean;
}
```

**Example**:
```typescript
const result = engine.makeMove('e2', 'e4');
if (result.isValid) {
  console.log(`Move made: ${result.move.notation}`);
} else {
  console.error(`Invalid move: ${result.error}`);
}
```

##### `getValidMoves(square?: Square): Square[]`

Gets all valid moves for a piece or all pieces.

**Parameters**:
- `square` (optional): Specific square to get moves for

**Returns**: Array of valid destination squares

**Example**:
```typescript
const allMoves = engine.getValidMoves();
const pawnMoves = engine.getValidMoves('e2');
```

##### `isInCheck(color?: PieceColor): boolean`

Checks if a king is in check.

**Parameters**:
- `color` (optional): Which color to check. Defaults to current player.

**Returns**: Boolean indicating check status

##### `getGameStatus(): GameStatus`

Gets current game status.

**Returns**: One of: `'playing'`, `'check'`, `'checkmate'`, `'stalemate'`, `'draw'`, `'resigned'`

##### `getFEN(): string`

Gets current position in FEN notation.

**Returns**: FEN string representing current position

##### `getPGN(): string`

Gets game moves in PGN format.

**Returns**: PGN string with move history

##### `undo(): boolean`

Undoes the last move.

**Returns**: Boolean indicating success

##### `reset(): void`

Resets game to starting position.

#### Game State Methods

##### `getBoard(): ChessBoard`

Gets complete board state.

**Returns**: `ChessBoard` object with piece positions and game state

##### `getMoveHistory(): Move[]`

Gets complete move history.

**Returns**: Array of `Move` objects

##### `getCurrentPlayer(): PieceColor`

Gets current player to move.

**Returns**: `'white'` or `'black'`

## Move Validation API

### Class: `MoveValidator`

Handles move validation and legality checking.

#### Static Methods

##### `validateMove(board: ChessBoard, from: Square, to: Square): MoveValidationResult`

Validates a potential move.

**Parameters**:
- `board`: Current board state
- `from`: Starting square
- `to`: Destination square

**Returns**: `MoveValidationResult` with validation details

**Example**:
```typescript
const result = MoveValidator.validateMove(board, 'e2', 'e4');
if (!result.isValid) {
  console.log(`Invalid: ${result.errorType}`);
}
```

##### `getValidDestinations(board: ChessBoard, square: Square): Square[]`

Gets all valid destination squares for a piece.

##### `wouldBeInCheck(board: ChessBoard, move: Move): boolean`

Checks if a move would leave the king in check.

##### `isPinned(board: ChessBoard, square: Square): boolean`

Checks if a piece is pinned to the king.

## State Management API

### Class: `GameStateManager`

Manages application state and game state synchronization.

#### Constructor

```typescript
constructor()
```

#### State Methods

##### `getState(): AppState`

Gets complete application state.

**Returns**: `AppState` object

##### `updateGameState(update: GameStateUpdate): void`

Updates game state with partial update.

**Parameters**:
- `update`: Partial game state update

##### `updateUIState(update: UIStateUpdate): void`

Updates UI state.

**Parameters**:
- `update`: Partial UI state update

##### `subscribe(callback: StateChangeCallback): UnsubscribeFunction`

Subscribes to state changes.

**Parameters**:
- `callback`: Function called when state changes

**Returns**: Unsubscribe function

**Example**:
```typescript
const unsubscribe = stateManager.subscribe((newState, oldState) => {
  console.log('State changed:', newState);
});

// Later...
unsubscribe();
```

#### Game Flow Methods

##### `startNewGame(): void`

Initializes a new game.

##### `loadGame(gameData: SavedGame): boolean`

Loads a saved game.

**Returns**: Boolean indicating success

##### `saveCurrentGame(name: string): Promise<boolean>`

Saves current game to storage.

**Returns**: Promise resolving to success status

## Persistence API

### Class: `GamePersistence`

Handles save/load operations and localStorage interface.

#### Static Methods

##### `saveGame(gameState: GameState, name: string): Promise<boolean>`

Saves game to localStorage.

**Parameters**:
- `gameState`: Complete game state
- `name`: Save file name

**Returns**: Promise resolving to success status

**Example**:
```typescript
try {
  const success = await GamePersistence.saveGame(gameState, 'My Game');
  if (success) {
    console.log('Game saved successfully');
  }
} catch (error) {
  console.error('Save failed:', error);
}
```

##### `loadGame(gameId: string): Promise<GameState | null>`

Loads game from localStorage.

**Parameters**:
- `gameId`: Saved game identifier

**Returns**: Promise resolving to game state or null if not found

##### `getSavedGames(): Promise<SavedGameInfo[]>`

Gets list of all saved games.

**Returns**: Promise resolving to array of saved game information

##### `deleteGame(gameId: string): Promise<boolean>`

Deletes a saved game.

**Parameters**:
- `gameId`: Game identifier to delete

**Returns**: Promise resolving to success status

##### `exportPGN(gameState: GameState): string`

Exports game as PGN string.

##### `exportFEN(gameState: GameState): string`

Exports current position as FEN string.

##### `importPGN(pgnString: string): GameState | null`

Imports game from PGN string.

**Parameters**:
- `pgnString`: Valid PGN game notation

**Returns**: Game state or null if invalid PGN

## UI Component APIs

### ChessBoard Component

#### Props Interface

```typescript
interface ChessBoardProps {
  width: number;
  height: number;
  pieces: BoardPiece[];
  selectedSquare?: Square | null;
  validMoves?: Square[];
  lastMove?: [Square, Square] | null;
  checkSquare?: Square | null;
  onSquareClick: (square: Square) => void;
  onPieceDragStart: (square: Square, piece: BoardPiece) => void;
  onPieceDragEnd: (fromSquare: Square, toSquare: Square | null) => void;
  onPieceDrag: (position: { x: number; y: number }) => void;
  isInteractive?: boolean;
  showCoordinates?: boolean;
  flipBoard?: boolean;
  className?: string;
}
```

#### Ref Methods

```typescript
interface ChessBoardRef {
  getCanvasElement(): HTMLCanvasElement | null;
  redraw(): void;
  exportImage(format?: 'png' | 'jpeg'): string;
  focus(): void;
  getSquareFromPixel(x: number, y: number): Square | null;
  getPixelFromSquare(square: Square): Position;
}
```

**Example Usage**:
```typescript
const boardRef = useRef<ChessBoardRef>(null);

const handleExportImage = () => {
  const imageData = boardRef.current?.exportImage('png');
  // Use imageData...
};

<ChessBoard
  ref={boardRef}
  width={512}
  height={512}
  pieces={pieces}
  onSquareClick={handleSquareClick}
  // ... other props
/>
```

### GameControls Component

#### Props Interface

```typescript
interface GameControlsProps {
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
```

## AI Engine API

### Class: `StockfishEngine`

Provides integration with Stockfish chess engine via WebAssembly and Web Workers.

#### Constructor

```typescript
constructor()
```

Creates a new Stockfish engine instance. Must call `initialize()` before use.

#### Core Methods

##### `initialize(): Promise<void>`

Initializes the Stockfish engine and UCI communication.

**Returns**: Promise that resolves when engine is ready

**Example**:
```typescript
const engine = new StockfishEngine();
await engine.initialize();
```

##### `setPosition(fen: string): Promise<void>`

Sets the current position for analysis or move generation.

**Parameters**:
- `fen`: Position in FEN notation

**Example**:
```typescript
await engine.setPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
```

##### `getBestMove(options?: EngineOptions): Promise<Move>`

Gets the best move from the current position.

**Parameters**:
- `options`: Engine configuration options

```typescript
interface EngineOptions {
  depth?: number;
  timeLimit?: number;
  multiPV?: number;
}
```

**Returns**: Promise resolving to the best move

##### `evaluatePosition(depth: number): Promise<void>`

Evaluates the current position with real-time updates via callback.

**Parameters**:
- `depth`: Analysis depth (default: 12)

**Example**:
```typescript
engine.setEvaluationCallback((evaluation, depth, mateIn) => {
  console.log(`Depth ${depth}: ${evaluation} centipawns`);
});
await engine.evaluatePosition(20);
```

##### `setEvaluationCallback(callback: EvaluationCallback): void`

Sets callback for real-time evaluation updates.

**Parameters**:
- `callback`: Function to handle evaluation updates

```typescript
type EvaluationCallback = (evaluation: number, depth: number, mateIn?: number) => void;
```

##### `isReady(): boolean`

Checks if engine is initialized and ready.

##### `terminate(): void`

Terminates the engine and cleans up resources.

## Game Analysis API

### Component: `GameAnalysis`

Interactive post-game analysis interface with Stockfish integration.

#### Props Interface

```typescript
interface GameAnalysisProps {
  pgn: string;              // Game in PGN format
  gameResult?: string;      // Game result from main interface
  onClose: () => void;      // Close handler
}
```

#### Features

- **Real-time evaluation**: Progressive analysis from depth 1-20
- **Interactive navigation**: Click moves or use arrow keys
- **Visual evaluation bar**: Graphical position assessment
- **Game result display**: Shows resignation, checkmate, stalemate results
- **Keyboard shortcuts**: ←/→ and ↑/↓ for move navigation

#### Constants

```typescript
const ANALYSIS_DEPTH = 20; // Configurable analysis depth
```

#### State Interface

```typescript
interface AnalysisState {
  evaluation: number | null;           // Current position evaluation
  currentDepth: number;               // Analysis depth progress
  mateInMoves: number | null;         // Mate distance if applicable
  currentMoveIndex: number;           // Current position in game
  engineReady: boolean;               // Engine initialization status
  isEvaluating: boolean;             // Analysis in progress
}
```

#### Integration Points

- **Engine**: Uses `StockfishEngine` for position analysis
- **Chess Logic**: Integrates with Chess.js for position management
- **UI**: Modal overlay with three-panel layout
- **State**: Receives game data from `GameContainer`

### MoveHistory Component

#### Props Interface

```typescript
interface MoveHistoryProps {
  moves: Move[];
  currentMoveIndex: number;
  onMoveClick: (moveIndex: number) => void;
  onNavigateToMove: (moveIndex: number) => void;
  maxHeight?: number;
  showMoveNumbers?: boolean;
  highlightCurrentMove?: boolean;
  className?: string;
}
```

## Utility Functions

### Coordinate Utilities

#### `squareToCoordinates(square: Square): Coordinates`

Converts chess square to array coordinates.

**Example**:
```typescript
const coords = squareToCoordinates('e4'); // { file: 4, rank: 3 }
```

#### `coordinatesToSquare(coordinates: Coordinates): Square`

Converts array coordinates to chess square.

**Example**:
```typescript
const square = coordinatesToSquare({ file: 4, rank: 3 }); // 'e4'
```

#### `getSquareColor(square: Square): 'light' | 'dark'`

Gets square color.

### Animation Utilities

#### `createPieceAnimation(from: Position, to: Position, duration: number): PieceAnimation`

Creates piece movement animation.

#### `easeInOutQuad(t: number): number`

Quadratic easing function for smooth animations.

### FEN/PGN Utilities

#### `parseFEN(fen: string): FENComponents`

Parses FEN string into components.

#### `generateFEN(board: ChessBoard): string`

Generates FEN string from board state.

#### `parsePGN(pgn: string): PGNData`

Parses PGN string into structured data.

#### `generatePGN(moves: Move[], metadata: GameMetadata): string`

Generates PGN string from move list and metadata.

## Event System

### Event Types

```typescript
type GameEvent = 
  | 'GAME_STARTED'
  | 'MOVE_MADE'
  | 'GAME_ENDED'
  | 'PIECE_SELECTED'
  | 'PIECE_MOVED'
  | 'INVALID_MOVE'
  | 'CHECK'
  | 'CHECKMATE'
  | 'STALEMATE'
  | 'DRAW'
  | 'RESIGNATION';
```

### EventEmitter Interface

```typescript
interface GameEventEmitter {
  on(event: GameEvent, callback: EventCallback): void;
  off(event: GameEvent, callback: EventCallback): void;
  emit(event: GameEvent, data?: any): void;
}
```

### Usage Examples

```typescript
// Listen for game events
gameEngine.on('MOVE_MADE', (move: Move) => {
  console.log(`Move made: ${move.notation}`);
  updateUI();
});

gameEngine.on('CHECKMATE', (winner: PieceColor) => {
  showGameEndModal(`${winner} wins by checkmate!`);
});

// Emit custom events
gameEngine.emit('PIECE_SELECTED', { square: 'e2', piece: pawn });
```

## Error Handling

### Error Types

```typescript
type APIError = 
  | 'INVALID_POSITION'
  | 'ILLEGAL_MOVE'
  | 'GAME_OVER'
  | 'INVALID_FEN'
  | 'INVALID_PGN'
  | 'STORAGE_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR';
```

### Error Objects

```typescript
interface APIErrorObject {
  type: APIError;
  message: string;
  code?: number;
  details?: any;
}
```

### Error Handling Examples

```typescript
try {
  const result = await gameEngine.makeMove('e2', 'e5');
  if (!result.isValid) {
    throw new APIErrorObject({
      type: 'ILLEGAL_MOVE',
      message: 'Invalid move attempted',
      details: { from: 'e2', to: 'e5', reason: result.error }
    });
  }
} catch (error) {
  handleGameError(error);
}
```

## Performance Considerations

### Optimization Guidelines

1. **State Updates**: Use immutable state updates to prevent unnecessary re-renders
2. **Move Validation**: Cache validation results for frequently accessed positions
3. **Animation Performance**: Use `requestAnimationFrame` for smooth 60fps animations
4. **Memory Management**: Clean up event listeners and cancel ongoing animations

### Performance Monitoring

```typescript
// Monitor API performance
const startTime = performance.now();
const result = await gameEngine.makeMove('e2', 'e4');
const endTime = performance.now();
console.log(`Move took ${endTime - startTime} milliseconds`);
```

### Memory Usage

```typescript
// Monitor memory usage
if ('memory' in performance) {
  console.log('JS Heap Size:', performance.memory.usedJSHeapSize);
}
```

## Version Compatibility

### API Versioning

Current API version: `1.0.0`

### Breaking Changes

Future breaking changes will be documented here with migration guides.

### Deprecation Warnings

Deprecated APIs will include console warnings and migration guidance.

---

**Note**: This API documentation should be kept updated as the implementation progresses. All examples should be tested and verified during development.