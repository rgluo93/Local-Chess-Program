# Claude Code Documentation - Chess Program

## Three-Fold Repetition Draw Detection

### Overview
The chess program implements automatic three-fold repetition draw detection using a manual position tracking system that replaces Chess.js's built-in functionality for improved reliability.

### Key Features

#### Manual Position Tracking
- **Implementation**: Custom FEN-based position history tracking in `GameEngine.ts`
- **Accuracy**: Tracks normalized FEN positions throughout the game
- **Reliability**: Bypasses Chess.js internal three-fold repetition logic which proved unreliable
- **Integration**: Seamlessly integrates with existing draw detection and game result systems

#### Position Normalization
- **FEN Components**: Only considers board position, active color, and castling rights
- **Ignored Elements**: Excludes en passant, halfmove clock, and fullmove number for accurate repetition detection
- **Format**: `"position active_color castling_rights"` (first 3 components of FEN)

#### Automatic Detection
- **Real-time Checking**: Evaluates three-fold repetition after every move
- **Game Status Integration**: Updates game status to 'draw' when detected
- **Result Handling**: Sets game result to '1/2-1/2' automatically
- **UI Integration**: Draw reason displayed as 'threefold_repetition'

### Technical Implementation

#### Core Files
```
src/engine/
├── GameEngine.ts             # Manual three-fold repetition implementation
├── GameStateManager.ts       # Game state coordination and draw handling
└── orchestrator/ChessGameOrchestrator.ts  # Move processing integration
```

#### Key Methods

##### GameEngine.ts
```typescript
// Position history tracking
private positionHistory: string[] = [];

// Manual three-fold repetition detection
private isThreefoldRepetitionManual(): boolean {
  if (this.positionHistory.length < 3) return false;
  const currentPosition = this.positionHistory[this.positionHistory.length - 1];
  const occurrences = this.countPositionOccurrences(currentPosition);
  return occurrences >= 3;
}

// FEN normalization for repetition comparison
private normalizeFENForRepetition(fen: string): string {
  const parts = fen.split(' ');
  return `${parts[0]} ${parts[1]} ${parts[2]}`; // position, turn, castling
}

// Position occurrence counting
private countPositionOccurrences(normalizedFEN: string): number {
  return this.positionHistory.filter(fen => fen === normalizedFEN).length;
}
```

#### State Management Integration
- **GameStatus**: `getGameStatus()` checks manual three-fold repetition
- **GameResult**: `getGameResult()` returns '1/2-1/2' for three-fold repetition
- **DrawReason**: `getDrawReason()` returns 'threefold_repetition' when applicable
- **Public Interface**: `isThreefoldRepetition()` uses manual implementation

#### Position History Management
- **Initialization**: Starting position added in constructor
- **Move Processing**: New position added after each valid move
- **Reset Handling**: Position history cleared and reinitialized on game reset
- **Load Position**: Position history reset when loading FEN positions

### Bug Fixes and Reliability

#### Resolved Issues
1. **Double Position Insertion**: Fixed `validateMove()` method that was adding test positions to history without proper cleanup
2. **Missing Starting Position**: Ensured starting position is always included at index 0
3. **Chess.js Reliability**: Replaced unreliable Chess.js `isThreefoldRepetition()` with manual tracking

#### Position History Integrity
- **Test Move Cleanup**: `validateMove()` properly removes test positions from history
- **Error Recovery**: Exception handling ensures position history consistency
- **Synchronization**: Position history stays synchronized with actual game moves

### Integration with Game Systems

#### UI Components
- **MoveHistoryPanel**: Displays draw results with proper formatting
- **GameControls**: Handles draw detection and game ending
- **Status Display**: Shows three-fold repetition as draw reason

#### AI Integration
- **Move Processing**: Three-fold repetition detection works with AI moves
- **Game Ending**: AI respects three-fold repetition draws
- **Status Updates**: AI state management handles draw conditions

### Testing and Validation

#### Test Scenarios
- **Exact Repetition**: Starting position repeated 3 times triggers draw
- **Knight Maneuvers**: Nf3-Ng1-Nf3-Ng1 pattern creates repetition
- **Position Counting**: Verified correct counting of position occurrences
- **History Tracking**: Confirmed proper position history management

#### Performance Characteristics
- **Memory Usage**: Linear growth with game length (one FEN string per move)
- **Computation**: O(n) position comparison for each move
- **Accuracy**: 100% accurate three-fold repetition detection
- **Integration**: Zero impact on existing game flow

### Development Commands
```bash
# Run development server with three-fold repetition
npm run dev

# Test three-fold repetition scenarios
npm test

# Build with manual implementation
npm run build
```

---

## Evaluation Bar Game Ending Display

### Overview
The analysis interface evaluation bar features intelligent game ending detection and display, providing clear visual feedback about how games concluded with specific ending reasons shown in the middle text overlay.

### Game Ending Text Display

#### Resignation Endings
- **"WHITE RESIGNS"**: Displayed when black wins due to white's resignation
- **"BLACK RESIGNS"**: Displayed when white wins due to black's resignation
- **Result Integration**: Coordinated with game result (1-0/0-1) display in evaluation sections

#### Draw Endings
- **"3-FOLD REPETITION"**: Shown for games ending by three-fold position repetition
- **"50-MOVE RULE"**: Displayed for fifty-move rule draws
- **"INSUFFICIENT MATERIAL"**: Shown when neither side has enough material to checkmate
- **"DRAW"**: Generic fallback for other draw conditions

#### Traditional Endings
- **"CHECKMATE"**: Displayed for checkmate positions during analysis
- **"STALEMATE"**: Shown for stalemate positions during analysis

### Smart Display Logic

#### Position-Aware Display
- **Final Position**: Shows actual game ending reason when analyzing the final position
- **Historical Analysis**: Shows current position status (checkmate/stalemate) when navigating through game history
- **Context Switching**: Automatically switches between actual ending reason and position analysis

#### Information Sources
- **Game Status**: Uses `gameState.status` to identify resignation vs. natural endings
- **Draw Reasons**: Leverages `GameEngine.getDrawReason()` for specific draw types
- **Position Analysis**: Falls back to chess.js position evaluation for historical moves

### Technical Implementation

#### Component Architecture
```
GameContainer.tsx → GameAnalysis.tsx → Evaluation Bar Display
     ↓                    ↓                    ↓
gameState.status    getGameEndingText()   game-over-text-overlay
gameState.result         ↓                    ↓
drawReason          Smart Logic         Conditional Rendering
```

#### Data Flow
```typescript
// GameContainer passes comprehensive ending information
<GameAnalysis
  pgn={gameState.pgn || ''}
  gameResult={gameState.result}
  gameStatus={gameState.status}
  drawReason={orchestrator.getDrawReason()}
  onClose={() => setShowAnalysis(false)}
/>

// GameAnalysis determines appropriate display text
const getGameEndingText = (): string | null => {
  // Check for resignations
  if (gameStatus === 'resigned') {
    return gameResult === 'white_wins' ? 'BLACK RESIGNS' : 'WHITE RESIGNS';
  }
  
  // Check for specific draw types
  if (gameStatus === 'draw') {
    switch (drawReason) {
      case 'threefold_repetition': return '3-FOLD REPETITION';
      case 'fifty_move_rule': return '50-MOVE RULE';
      case 'insufficient_material': return 'INSUFFICIENT MATERIAL';
      default: return 'DRAW';
    }
  }
  
  return null;
};
```

#### Orchestrator Integration
- **New API Method**: `ChessGameOrchestrator.getDrawReason()` exposes engine draw reasons
- **State Coordination**: GameContainer accesses both game state and draw reason information
- **Fallback Handling**: Graceful handling of missing or undefined ending information

### UI Integration

#### Visual Design
- **Overlay Text**: Game ending text appears as centered overlay on evaluation bar
- **Consistent Styling**: Matches existing checkmate/stalemate text formatting
- **Color Coordination**: Text color adapts to evaluation bar background sections

#### User Experience
- **Immediate Feedback**: Game ending reason visible immediately at final position
- **Historical Context**: Maintains position analysis capabilities during game review
- **Clear Communication**: Unambiguous text clearly indicates specific ending type

### Performance Considerations
- **Lazy Evaluation**: Draw reason only fetched when analysis interface is opened
- **Caching**: Game ending information cached for the duration of analysis session
- **Minimal Overhead**: No additional computation during regular gameplay

### Error Handling
- **Missing Information**: Graceful fallback to generic endings when specific reasons unavailable
- **Invalid States**: Validation of game status and result consistency
- **API Failures**: Safe handling of orchestrator getDrawReason() failures

### Future Enhancements
- **Multilingual Support**: Internationalization of game ending text
- **Custom Messages**: User-configurable ending messages
- **Animation Effects**: Subtle animations for game ending text display
- **Audio Feedback**: Optional sound effects for different ending types

---

## Game Analysis Interface

### Overview
The chess program features a comprehensive game analysis interface that provides real-time position evaluation using Stockfish.js v10.0.2. The analysis system offers post-game review capabilities with interactive navigation and visual feedback.

### Key Features

#### Real-Time Evaluation
- **Engine**: Stockfish.js v10.0.2 WebAssembly chess engine
- **Analysis Depth**: Configurable depth (default: 20 plies)
- **Progressive Updates**: Real-time evaluation updates from depth 1 to target depth
- **Evaluation Types**: Centipawn scores and mate-in-X positions
- **Perspective**: All evaluations shown from current player's perspective
- **Best Move Display**: Shows current best move recommendation from engine
- **Principal Variation**: Displays the main line of play from current position

#### Visual Evaluation Bar
- **Design**: Vertical evaluation bar with white/black sections
- **Scale**: Logarithmic scale for better visual representation (±500 centipawns)
- **Game States**: Special handling for checkmate/stalemate positions
- **Result Display**: Shows game results (1-0, 0-1, ½-½) in appropriate sections
- **Game Ending Text**: Intelligent display of specific ending reasons (resignations, draw types)
- **Context Awareness**: Shows actual game ending at final position, analysis results during navigation
- **Midline**: Red line indicating equal position (0.00)

#### Interactive Navigation
- **Move History**: Click any move to jump to that position
- **Keyboard Controls**: Arrow keys (↑↓←→) for move navigation
- **Starting Position**: Auto-analysis of opening position
- **Progressive FEN**: Accurate position calculation for each move

#### Game Result Integration
- **Resignation Support**: Displays resignation results using exact format from main game
- **Status Consistency**: Matches main interface styling and terminology
- **Result Types**: Handles all game endings (checkmate, stalemate, resignation, draw)
- **Enhanced Display**: See "Evaluation Bar Game Ending Display" section for detailed ending text features

### Technical Implementation

#### File Structure
```
src/components/
├── GameAnalysis.tsx          # Main analysis component with enhanced game ending display
├── GameAnalysis.css          # Analysis interface styling
├── GameContainer.tsx         # Integration with main game, passes ending information
└── GameControls.tsx          # Analyze button implementation

src/orchestrator/
└── ChessGameOrchestrator.ts  # Enhanced with getDrawReason() API method

src/ai/
└── StockfishEngine.ts        # Enhanced with evaluation callbacks
```

#### Dependencies
- **Chess.js**: Position management and PGN parsing
- **Stockfish.js**: Chess engine via Web Workers
- **React**: Component state management and UI
- **Canvas**: Board rendering through CanvasChessBoard component

#### Key Constants
```typescript
const ANALYSIS_DEPTH = 20; // Configurable analysis depth
```

#### State Management
- `evaluation`: Current position evaluation (centipawns or mate score)
- `currentDepth`: Current analysis depth (1-20)
- `mateInMoves`: Mate distance when applicable
- `engineReady`: Engine initialization status
- `moveFens`: Pre-calculated FEN strings for all positions

### Integration Points

#### Orchestrator Integration
- Launched via "Analyze" button (replaces "Resign" when game ends)
- Receives game PGN and result from `GameContainer`
- Uses `gameState.result` for consistent result display

#### Engine Communication
- Extended `StockfishEngine.ts` with evaluation callback system
- Real-time updates via `setEvaluationCallback()`
- Progressive depth analysis with `evaluatePosition(depth)`
- Proper turn-based score interpretation for both centipawn and mate scores

#### UI Components
- Modal overlay with three-panel layout (evaluation, board, moves)
- Responsive design for mobile devices
- Consistent styling with main interface color scheme

### Score Calculation Logic

#### Centipawn Scores
```typescript
// Current player perspective (same as mate scores)
if (currentTurn === 'w') {
  adjustedScore = info.score.cp;      // White's turn: use as-is
} else {
  adjustedScore = -info.score.cp;     // Black's turn: flip sign
}
```

#### Mate Scores
```typescript
// Mate scores relative to current player
if (currentTurn === 'w') {
  mateScore = info.score.mate > 0 ? 999999 : -999999;  // White advantage/disadvantage
} else {
  mateScore = info.score.mate > 0 ? -999999 : 999999;  // Black advantage becomes white disadvantage
}
```

### Keyboard Shortcuts
- **←/↑**: Previous move
- **→/↓**: Next move
- **Escape**: Close analysis (handled by modal)

### Performance Optimizations
- Pre-calculated FEN positions to avoid redundant computation
- Evaluation caching at component level
- Progressive loading with depth-based updates
- Web Worker isolation for engine calculations

### Error Handling
- Engine initialization failure gracefully handled
- Invalid FEN string validation
- Move parsing error recovery
- Timeout prevention for deep analysis (no timeout limit)

### Future Enhancements
- Multiple line analysis (Multi-PV support)
- Opening book integration
- Position annotation system
- Analysis export functionality

### Development Commands
```bash
# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Known Limitations
- Analysis depth fixed at component level (requires recompilation to change)
- Single line analysis only (no Multi-PV yet)
- No persistent analysis storage
- Engine warm-up time on first position

---

## Sandbox Mode - Real-Time Analysis Environment

### Overview
The chess program features a revolutionary Sandbox Mode that provides real-time chess analysis capabilities during active gameplay. Unlike traditional post-game analysis, Sandbox Mode allows players to analyze positions, explore variations, and create branches while playing, offering an immersive learning and exploration experience.

### Key Features

#### Real-Time Analysis During Gameplay
- **Live Evaluation**: Stockfish.js v10.0.2 engine provides continuous position evaluation
- **Best Move Arrows**: Visual arrows showing the engine's recommended best move
- **Principal Variation Display**: Shows the main line of play from the current position
- **Evaluation Bar**: Real-time evaluation bar updates with each position change
- **Multi-Depth Analysis**: Progressive analysis from depth 1 to 20 for comprehensive evaluation

#### Interactive Move Navigation
- **Keyboard Navigation**: Arrow keys (↑↓←→) for moving through game history
- **Click Navigation**: Click any move in the move history to jump to that position
- **Starting Position**: Navigate back to the initial board setup
- **Historical Analysis**: Analyze any position in the game's history
- **Seamless Transitions**: Smooth navigation without losing analysis context

#### Branch Creation and Exploration
- **Alternative Lines**: Play moves from any historical position to create new variations
- **Move Truncation**: Automatically removes future moves when branching from past positions
- **Position Restoration**: Uses orchestrator's undo/redo system for accurate position management
- **State Persistence**: Maintains proper game state throughout branch exploration
- **Incremental Navigation**: Efficient position changes using built-in orchestrator methods

#### Advanced Analysis Features
- **Continuous Evaluation**: Position evaluation updates in real-time as you navigate
- **Move Validation**: All moves are validated before allowing branch creation
- **Depth Progression**: Analysis depth increases progressively for better accuracy
- **Turn-Based Perspective**: Evaluations always shown from current player's perspective
- **Mate Detection**: Special handling for checkmate and stalemate positions

### Technical Implementation

#### Game Mode Integration
```typescript
// Sandbox mode added to GameMode enum
export enum GameMode {
  HUMAN_VS_HUMAN = 'human_vs_human',
  HUMAN_VS_AI = 'human_vs_ai',
  SANDBOX = 'sandbox'  // New analysis mode
}
```

#### Core Components
```
src/components/
├── GameContainer.tsx          # Sandbox state management and navigation
├── GameContainer.css          # Sandbox-specific styling matching analysis interface
├── GameModeSelector.tsx       # Sandbox mode selection with microscope icon
├── GameModeModal.tsx          # Sandbox option in game mode selection
└── GameControls.tsx           # Modified controls for sandbox mode

src/ai/
├── types/AITypes.ts          # Extended GameMode enum with SANDBOX
└── AIGameIntegration.ts       # Sandbox mode support in AI system

src/engine/
└── GameStateManager.ts        # Sandbox mode handling in state management
```

#### Sandbox-Specific State Management
```typescript
// Comprehensive sandbox analysis state
const [sandboxEvaluation, setSandboxEvaluation] = useState<number | null>(null);
const [sandboxCurrentDepth, setSandboxCurrentDepth] = useState<number>(0);
const [sandboxMateInMoves, setSandboxMateInMoves] = useState<number | null>(null);
const [sandboxBestMove, setSandboxBestMove] = useState<string | null>(null);
const [sandboxPrincipalVariation, setSandboxPrincipalVariation] = useState<string[]>([]);

// Navigation and branching state
const [sandboxCurrentMoveIndex, setSandboxCurrentMoveIndex] = useState<number>(0);
const [sandboxNavigationFens, setSandboxNavigationFens] = useState<string[]>([]);
const [sandboxIsNavigating, setSandboxIsNavigating] = useState<boolean>(false);
```

#### Branch Creation Algorithm
```typescript
// Robust position restoration using orchestrator's built-in methods
const resetOrchestratorToBranchPoint = async (moves: Move[]) => {
  const currentState = orchestrator.getGameState();
  const currentMoveCount = currentState.gameState.moves.length;
  
  // Navigate backwards using undoMove for positions behind current
  if (moves.length < currentMoveCount) {
    const movesToUndo = currentMoveCount - moves.length;
    for (let i = 0; i < movesToUndo; i++) {
      await orchestrator.undoMove();
    }
  }
  
  // Navigate forwards using makeMove for positions ahead of current
  else if (moves.length > currentMoveCount) {
    for (let i = currentMoveCount; i < moves.length; i++) {
      const move = moves[i];
      await orchestrator.makeMove({ 
        from: move.from, 
        to: move.to, 
        promotion: move.promotion 
      });
    }
  }
};
```

### User Interface Design

#### Analysis Panel Layout
- **Position**: Absolutely positioned evaluation panel on the left side of the chess board
- **Styling**: Matches post-game analysis interface for consistency
- **Evaluation Bar**: Vertical bar showing position evaluation with logarithmic scaling
- **Best Move Display**: Shows engine's recommended move in algebraic notation
- **Principal Variation**: Displays the main line as a sequence of moves
- **Analysis Depth**: Shows current analysis depth and engine status

#### Game Controls Modifications
- **Resign Button**: Disabled in sandbox mode (analysis-only environment)
- **New Game Button**: Always enabled for quick game resets
- **Analysis Integration**: Seamless transition between sandbox and post-game analysis
- **Mode Indicator**: Clear visual indication when in sandbox mode

#### Visual Feedback
- **Real-Time Updates**: All analysis information updates as positions change
- **Smooth Transitions**: Animated evaluation bar changes
- **Color Coding**: Evaluation colors match advantage/disadvantage
- **Move Highlighting**: Current position highlighted in move history

### Performance Optimizations

#### Engine Management
- **Dedicated Engine**: Separate Stockfish instance for sandbox analysis
- **Progressive Analysis**: Depth increases incrementally for responsive feedback
- **Web Worker Isolation**: Engine runs in background thread
- **Memory Management**: Proper cleanup when exiting sandbox mode

#### State Synchronization
- **Incremental Updates**: Uses orchestrator's built-in undo/redo for efficiency
- **FEN Caching**: Pre-calculated FEN strings for all historical positions
- **Lazy Evaluation**: Analysis only runs when in sandbox mode
- **Event Handling**: Optimized keyboard and mouse event processing

#### Navigation Efficiency
- **Batch Updates**: Efficient state updates during navigation
- **Position Validation**: Quick validation of legal moves before branch creation
- **Error Recovery**: Graceful handling of invalid positions or moves
- **Memory Usage**: Minimal memory footprint for navigation history

### Integration with Game Systems

#### Orchestrator Integration
- **State Management**: Full integration with ChessGameOrchestrator
- **Move Processing**: Uses existing move validation and execution systems
- **Undo/Redo System**: Leverages proven orchestrator undo/redo functionality
- **Error Handling**: Consistent error handling across all components

#### AI System Integration
- **Engine Status**: Proper handling of AI engine status in sandbox mode
- **Move Generation**: No AI moves generated in sandbox mode
- **Analysis Engine**: Separate engine instance for position analysis
- **Resource Management**: Efficient allocation of computational resources

#### UI Component Integration
- **Chess Board**: Full integration with CanvasChessBoard component
- **Move History**: Enhanced MoveHistoryPanel with navigation capabilities
- **Game Container**: Comprehensive state management in main game container
- **Modal System**: Consistent with existing modal and overlay systems

### User Experience Features

#### Keyboard Shortcuts
- **↑/←**: Navigate to previous move
- **↓/→**: Navigate to next move
- **Home**: Jump to starting position
- **End**: Jump to final position
- **Escape**: Exit navigation mode

#### Mouse Interactions
- **Move Clicking**: Click any move to jump to that position
- **Square Clicking**: Click empty squares to highlight or analyze
- **Board Interaction**: Full chess board interaction for move exploration
- **Scroll Support**: Mouse wheel navigation through moves

#### Visual Indicators
- **Current Position**: Clear highlighting of current position in move history
- **Navigation Mode**: Visual feedback when in navigation mode
- **Analysis Status**: Engine status and analysis progress indicators
- **Branch Points**: Visual indication of positions where branches can be created

### Error Handling and Recovery

#### Position Management Errors
- **Invalid FEN**: Graceful handling of corrupted position data
- **Move Validation**: Comprehensive move validation before execution
- **State Corruption**: Automatic recovery from inconsistent game states
- **Engine Failures**: Fallback mechanisms for engine communication errors

#### Navigation Errors
- **Boundary Conditions**: Proper handling of navigation beyond game bounds
- **Branch Creation**: Validation of branch points and move legality
- **State Restoration**: Recovery from failed position restoration attempts
- **Memory Issues**: Cleanup and recovery from memory-related problems

### Development and Testing

#### Test Coverage
- **Unit Tests**: Comprehensive testing of sandbox-specific functionality
- **Integration Tests**: Testing of sandbox mode with other game systems
- **Performance Tests**: Analysis of navigation and analysis performance
- **User Experience Tests**: Testing of keyboard and mouse interactions

#### Debugging Features
- **Console Logging**: Detailed logging of navigation and branching operations
- **State Inspection**: Tools for inspecting sandbox state during development
- **Performance Metrics**: Timing and memory usage analysis
- **Error Reporting**: Comprehensive error reporting and recovery logging

### Future Enhancements

#### Advanced Analysis Features
- **Multi-PV Support**: Multiple line analysis with best alternatives
- **Opening Book**: Integration with opening theory database
- **Endgame Tablebase**: Perfect play in endgame positions
- **Position Annotations**: User-created position annotations and comments

#### User Interface Improvements
- **Customizable Layout**: User-configurable analysis panel positioning
- **Analysis Export**: Export analysis results to PGN or other formats
- **Variation Trees**: Visual representation of explored variations
- **Analysis History**: History of analyzed positions and variations

#### Performance Enhancements
- **Analysis Caching**: Persistent caching of previously analyzed positions
- **Parallel Analysis**: Multiple engine instances for faster analysis
- **Cloud Integration**: Optional cloud-based analysis for deeper computation
- **Mobile Optimization**: Touch-friendly interface for mobile devices

### Development Commands
```bash
# Run development server with sandbox mode
npm run dev

# Test sandbox mode functionality
npm test

# Build with sandbox mode support
npm run build
```

---

*Last updated: Sandbox mode and enhanced analysis features with best move display and principal variation complete*