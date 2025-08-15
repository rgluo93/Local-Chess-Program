# Testing Guide

This document provides comprehensive testing procedures, setup instructions, and validation criteria for the chess program.

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Setup Instructions](#setup-instructions)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [Manual Testing](#manual-testing)
6. [Performance Testing](#performance-testing)
7. [Test Scenario Reference](#test-scenario-reference)
8. [Troubleshooting Tests](#troubleshooting-tests)

## Testing Overview

### Testing Strategy

The chess program uses a multi-layered testing approach:

- **Unit Tests**: Individual functions and components
- **Integration Tests**: Component interactions and workflows
- **End-to-End Tests**: Complete user scenarios
- **Performance Tests**: Animation smoothness and response times
- **Manual Tests**: Visual validation and user experience

### Test Tools

- **Vitest**: Unit and integration testing framework
- **React Testing Library**: Component testing utilities
- **jsdom**: Browser environment simulation
- **User Event**: User interaction simulation

## Setup Instructions

### Initial Test Setup

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Verify test framework**:
   ```bash
   npm test -- --version
   ```

3. **Run basic test suite**:
   ```bash
   npm test
   ```

### Test Configuration Files

The following configuration files should be present:

- `vitest.config.ts` - Test runner configuration
- `src/setupTests.ts` - Global test setup
- `src/__tests__/` - Test files directory

## Unit Testing

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test GameEngine.test.ts

# Run tests matching pattern
npm test -- --grep "move validation"
```

### Unit Test Categories

#### Chess Logic Tests (`src/engine/__tests__/`)

**GameEngine.test.ts**
- Game initialization
- Move validation
- Game state updates
- Special moves (castling, en passant, promotion)
- Check/checkmate detection

**MoveValidator.test.ts**
- Piece movement rules
- Move legality checking
- Path obstruction detection
- King safety validation

**EndgameDetector.test.ts**
- Checkmate scenarios
- Stalemate detection
- Draw conditions (50-move rule, threefold repetition, insufficient material)

**NotationGenerator.test.ts**
- PGN generation and parsing
- FEN generation and parsing
- Algebraic notation conversion

#### Component Tests (`src/components/__tests__/`)

**ChessBoard.test.tsx**
- Board rendering
- Piece positioning
- Click event handling
- Visual highlighting

**GameControls.test.tsx**
- Button functionality
- State management
- User interactions

**MoveHistory.test.tsx**
- Move list display
- Navigation functionality
- PGN export

### Writing Unit Tests

```typescript
// Example unit test structure
import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../GameEngine';

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  it('should initialize with standard starting position', () => {
    expect(engine.getFEN()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  });

  it('should validate basic pawn moves', () => {
    const result = engine.makeMove('e2', 'e4');
    expect(result.isValid).toBe(true);
    expect(result.move.notation).toBe('e4');
  });
});
```

## Integration Testing

### Running Integration Tests

```bash
# Run integration tests
npm test -- --grep "integration"

# Run specific integration suite
npm test integration/GameFlow.test.ts
```

### Integration Test Scenarios

#### Game Flow Integration
- Complete game workflow from start to finish
- Save/load game functionality
- Multi-move sequences
- Game ending scenarios

#### Component Integration
- Board and controls interaction
- Modal and game state synchronization
- Responsive layout behavior

#### State Management Integration
- Game state persistence
- UI state synchronization
- Local storage integration

## Manual Testing

### Manual Test Execution

Manual tests correspond to the 20 test scenarios from `IMPLEMENTATION_PLAN.md`. These require human verification of visual and interactive elements.

### Test Scenario Execution

#### Test Environment Setup
1. Start development server: `npm start`
2. Open browser to `http://localhost:3000`
3. Open browser developer tools (F12)
4. Enable performance monitoring if testing animations

#### Executing Specific Scenarios

**Example: Test Scenario #1 - Basic Pawn Double Move**

1. **Setup**: Fresh game (click "New Game" if needed)
2. **Action**: Drag white pawn from e2 to e4
3. **Expected Outcome**: 
   - Pawn appears on e4 square
   - Move recorded in history as "1. e4"
   - No error messages
   - White turn indicator changes to black
4. **Validation**: ✅ Pass / ❌ Fail
5. **Notes**: Record any issues or observations

#### Test Scenario Checklist

Use this checklist for systematic testing:

```
□ Test #1: Basic Pawn Double Move
□ Test #2: Illegal Knight Move
□ Test #3: Kingside Castling (Legal)
□ Test #4: Queenside Castling Blocked
□ Test #5: En Passant Capture
□ Test #6: Pawn Promotion to Knight
□ Test #7: Checkmate Detection
□ Test #8: Stalemate Detection
□ Test #9: Threefold Repetition Draw
□ Test #10: 50-Move Rule Draw
□ Test #11: Undo Last Move
□ Test #12: Resignation
□ Test #13: PGN & FEN Export
□ Test #14: Reactive Drag Animation
□ Test #15: Zoom Buttons
□ Test #16: Gesture Zoom
□ Test #17: Responsive Window Resize
□ Test #18: Move While Zoomed
□ Test #19: Offline Integrity
□ Test #20: Performance Stress
```

## Performance Testing

### Performance Test Setup

1. **Enable performance monitoring**:
   ```typescript
   // Add to test environment
   window.performance.mark('test-start');
   ```

2. **Use browser tools**:
   - Chrome DevTools Performance tab
   - Firefox Performance panel
   - Built-in performance API

### Performance Criteria

#### Response Time Testing
- **Target**: All user actions respond within 100ms
- **Test**: Measure time from user input to visual feedback
- **Method**: 
  ```javascript
  const start = performance.now();
  // Perform action
  const end = performance.now();
  console.log(`Action took ${end - start} milliseconds`);
  ```

#### Animation Performance Testing
- **Target**: Smooth 60fps animations
- **Test**: Monitor frame rate during drag operations and zoom
- **Method**: Use browser frame rate monitor or performance timeline

#### Memory Usage Testing
- **Target**: No memory leaks during extended use
- **Test**: Monitor memory usage over extended gameplay
- **Method**: Chrome DevTools Memory tab, record heap snapshots

### Automated Performance Tests

```typescript
// Example performance test
describe('Performance Tests', () => {
  it('should respond to moves within 100ms', async () => {
    const start = performance.now();
    await gameEngine.makeMove('e2', 'e4');
    const end = performance.now();
    
    expect(end - start).toBeLessThan(100);
  });

  it('should maintain 60fps during animations', async () => {
    const frameRates: number[] = [];
    
    // Monitor frame rates during animation
    const animation = startPieceAnimation();
    
    animation.onFrame((frameRate) => {
      frameRates.push(frameRate);
    });
    
    await animation.complete();
    
    const averageFrameRate = frameRates.reduce((a, b) => a + b) / frameRates.length;
    expect(averageFrameRate).toBeGreaterThan(58); // Allow slight variance
  });
});
```

## Test Scenario Reference

### Complete Test Scenarios

For detailed test scenarios with setup, actions, and expected outcomes, refer to:

- `IMPLEMENTATION_PLAN.md` - Phase-by-phase test scenarios
- `requirements.md` - Original 20 test scenario specifications

### Test Data

#### Standard Test Positions

**Starting Position FEN**:
```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
```

**Checkmate Position (Scholar's Mate)**:
```
r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4
```

**Stalemate Position**:
```
7k/5Q2/6K1/8/8/8/8/8 w - - 0 1
```

**En Passant Test Position**:
```
rnbqkbnr/pp1ppppp/8/2pP4/8/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 3
```

#### Test Game PGN

```pgn
[Event "Test Game"]
[Site "localhost:3000"]
[Date "2024.01.01"]
[White "Player 1"]
[Black "Player 2"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 *
```

## Troubleshooting Tests

### Common Test Issues

#### Tests Not Running
```bash
# Check Node.js version
node --version  # Should be 16+

# Reinstall dependencies
rm -rf node_modules
npm install

# Clear test cache
npm test -- --clearCache
```

#### TypeScript Errors in Tests
```bash
# Run type checker
npm run type-check

# Check test file imports
# Ensure proper TypeScript configuration
```

#### Browser Tests Failing
```bash
# Check jsdom setup
# Verify React Testing Library configuration
# Ensure proper cleanup between tests
```

#### Performance Tests Inconsistent
- Run tests multiple times for average
- Ensure consistent test environment
- Close other applications during testing
- Use dedicated performance testing setup

### Test Debugging

#### Debugging Individual Tests
```bash
# Run single test with debug output
npm test -- --grep "specific test name" --reporter=verbose

# Add debugging to test
console.log('Debug info:', testData);
expect.soft(condition).toBe(expected); // Soft assertion for debugging
```

#### Visual Test Debugging
```typescript
// Add to component tests for visual inspection
import { screen } from '@testing-library/react';

// After rendering
screen.debug(); // Prints DOM structure
```

### Continuous Integration

For automated testing in CI/CD:

```yaml
# Example GitHub Actions configuration
- name: Run Tests
  run: |
    npm test -- --coverage --reporter=junit
    npm run test:e2e
```

## Test Reports

### Coverage Reports

```bash
# Generate coverage report
npm test -- --coverage

# View coverage in browser
npm test -- --coverage --reporter=html
open coverage/index.html
```

### Test Results Export

```bash
# Export test results as JSON
npm test -- --reporter=json > test-results.json

# Export as JUnit XML (for CI)
npm test -- --reporter=junit > test-results.xml
```

---

**Note**: This testing guide should be used in conjunction with the implementation phases defined in `IMPLEMENTATION_PLAN.md`. Each phase has specific test requirements that should be executed before proceeding to the next phase.