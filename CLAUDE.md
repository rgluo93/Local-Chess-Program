# Claude Code Documentation - Chess Program

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

#### Visual Evaluation Bar
- **Design**: Vertical evaluation bar with white/black sections
- **Scale**: Logarithmic scale for better visual representation (±500 centipawns)
- **Game States**: Special handling for checkmate/stalemate positions
- **Result Display**: Shows game results (1-0, 0-1, ½-½) in appropriate sections
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

### Technical Implementation

#### File Structure
```
src/components/
├── GameAnalysis.tsx          # Main analysis component
├── GameAnalysis.css          # Analysis interface styling
├── GameContainer.tsx         # Integration with main game
└── GameControls.tsx          # Analyze button implementation

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

*Last updated: Implementation complete with all requested features*