/**
 * Interactive GameEngine Test
 * Run with: npx tsx test-interactive.ts
 */

import { GameEngine } from './src/engine/GameEngine';

console.log('Chess Program - Interactive GameEngine Test');
console.log('==========================================\n');

const engine = new GameEngine();

// Test 1: Basic Initialization
console.log('Test 1: Basic Initialization');
console.log('----------------------------');
console.log('✓ GameEngine created');
console.log('Initial position (FEN):', engine.getFEN());
console.log('Starting player:', engine.getCurrentPlayer());
console.log('Game status:', engine.getGameStatus());
console.log('');

// Test 2: Make a move (e2-e4)
console.log('Test 2: Make Move e2-e4');
console.log('-----------------------');
const result1 = engine.makeMove('e2', 'e4');
console.log('Move valid:', result1.isValid);
console.log('Move details:', result1.move);
console.log('Current player:', engine.getCurrentPlayer());
console.log('');

// Test 3: Get valid moves
console.log('Test 3: Get Valid Moves for Knight (g1)');
console.log('---------------------------------------');
const validMoves = engine.getValidMoves('g1');
console.log('Knight can move to:', validMoves);
console.log('');

// Test 4: Wrong turn test
console.log('Test 4: Wrong Turn Test');
console.log('-----------------------');
const wrongTurn = engine.makeMove('d2', 'd4');
console.log('Attempted white move when black\'s turn');
console.log('Result:', wrongTurn);
console.log('');

// Test 5: Black move
console.log('Test 5: Black Move (e7-e5)');
console.log('--------------------------');
const blackMove = engine.makeMove('e7', 'e5');
console.log('Move valid:', blackMove.isValid);
console.log('Notation:', blackMove.move?.notation);
console.log('');

// Test 6: Move history
console.log('Test 6: Move History');
console.log('-------------------');
const history = engine.getMoveHistory();
console.log('Moves played:');
history.forEach((move, i) => {
  console.log(`  ${Math.floor(i/2) + 1}. ${move.color === 'white' ? '' : '...'}${move.notation}`);
});
console.log('');

// Test 7: Game state
console.log('Test 7: Game State');
console.log('------------------');
console.log('PGN:', engine.getPGN());
console.log('FEN:', engine.getFEN());
console.log('');

// Test 8: Undo
console.log('Test 8: Undo Move');
console.log('-----------------');
console.log('Moves before undo:', engine.getMoveHistory().length);
engine.undo();
console.log('Moves after undo:', engine.getMoveHistory().length);
console.log('Current player:', engine.getCurrentPlayer());
console.log('');

console.log('=== All Tests Completed Successfully! ===');