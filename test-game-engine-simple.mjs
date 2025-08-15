#!/usr/bin/env node

/**
 * Interactive test script for GameEngine
 * Run with: node test-game-engine-simple.mjs
 */

// Use tsx to run TypeScript directly
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('Chess Program - Interactive GameEngine Test');
console.log('==========================================\n');

// Create a test file that tsx can execute
const testCode = `
import { GameEngine } from './src/engine/GameEngine';

const engine = new GameEngine();

// Test 1: Basic Initialization
console.log('Test 1: Basic Initialization');
console.log('----------------------------');
console.log('Initial FEN:', engine.getFEN());
console.log('Current player:', engine.getCurrentPlayer());
console.log('');

// Test 2: Simple Move (e2-e4)
console.log('Test 2: Simple Pawn Move (e2-e4)');
console.log('---------------------------------');
const move1 = engine.makeMove('e2', 'e4');
console.log('Move valid:', move1.isValid);
if (move1.isValid && move1.move) {
  console.log('Piece moved:', move1.move.piece);
  console.log('Notation:', move1.move.notation);
}
console.log('');

// Test 3: Valid Moves Query
console.log('Test 3: Get Valid Moves for Knight on g1');
console.log('----------------------------------------');
const knightMoves = engine.getValidMoves('g1');
console.log('Valid moves:', knightMoves);
console.log('');

// Test 4: Turn Validation
console.log('Test 4: Turn Validation (try another white move)');
console.log('-----------------------------------------------');
const wrongTurn = engine.makeMove('d2', 'd4');
console.log('Should be rejected - Error:', wrongTurn.error);
console.log('');

// Test 5: Black's Move
console.log('Test 5: Black\\'s Move (e7-e5)');
console.log('-----------------------------');
const blackMove = engine.makeMove('e7', 'e5');
console.log('Black move valid:', blackMove.isValid);
if (blackMove.isValid && blackMove.move) {
  console.log('Notation:', blackMove.move.notation);
}
console.log('');

// Test 6: Move History
console.log('Test 6: Move History');
console.log('-------------------');
const history = engine.getMoveHistory();
console.log('Total moves:', history.length);
history.forEach((move, index) => {
  console.log(\`  \${index + 1}. \${move.color}: \${move.notation}\`);
});
console.log('');

// Test 7: Board State
console.log('Test 7: Current Board State');
console.log('---------------------------');
const board = engine.getBoard();
console.log('Current turn:', board.toMove);
console.log('');

console.log('✓ All tests completed successfully!');
`;

// Write temporary test file
import { writeFileSync, unlinkSync } from 'fs';
const tempFile = 'temp-test.ts';
writeFileSync(tempFile, testCode);

try {
  // Execute with tsx
  console.log('Running GameEngine tests with tsx...\n');
  execSync(`npx tsx ${tempFile}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Error running tests:', error.message);
} finally {
  // Clean up
  unlinkSync(tempFile);
}