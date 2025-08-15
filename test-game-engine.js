#!/usr/bin/env node

/**
 * Interactive test script for GameEngine
 * Run with: node test-game-engine.js
 */

import { GameEngine } from './src/engine/GameEngine.ts';
import { Chess } from 'chess.js';

console.log('Chess Program - Interactive GameEngine Test');
console.log('==========================================\n');

// Test 1: Basic Initialization
console.log('Test 1: Basic Initialization');
console.log('----------------------------');
const engine = new GameEngine();
console.log('✓ GameEngine created successfully');
console.log('Initial FEN:', engine.getFEN());
console.log('Current player:', engine.getCurrentPlayer());
console.log('');

// Test 2: Simple Move (e2-e4)
console.log('Test 2: Simple Pawn Move (e2-e4)');
console.log('---------------------------------');
const move1 = engine.makeMove('e2', 'e4');
console.log('Move result:', move1);
if (move1.isValid) {
  console.log('✓ Move successful!');
  console.log('  - Piece:', move1.move.piece);
  console.log('  - Notation:', move1.move.notation);
  console.log('  - New FEN:', engine.getFEN());
} else {
  console.log('✗ Move failed:', move1.error);
}
console.log('');

// Test 3: Valid Moves Query
console.log('Test 3: Get Valid Moves for Knight on g1');
console.log('----------------------------------------');
const knightMoves = engine.getValidMoves('g1');
console.log('Valid moves for g1 knight:', knightMoves);
console.log('');

// Test 4: Turn Validation
console.log('Test 4: Turn Validation (try another white move)');
console.log('-----------------------------------------------');
const wrongTurn = engine.makeMove('d2', 'd4');
console.log('Attempted d2-d4 result:', wrongTurn);
if (!wrongTurn.isValid) {
  console.log('✓ Correctly rejected:', wrongTurn.error);
} else {
  console.log('✗ Should have been rejected!');
}
console.log('');

// Test 5: Black's Move
console.log('Test 5: Black\'s Move (e7-e5)');
console.log('-----------------------------');
const blackMove = engine.makeMove('e7', 'e5');
console.log('Black move result:', blackMove);
if (blackMove.isValid) {
  console.log('✓ Black moved successfully');
  console.log('  - Notation:', blackMove.move.notation);
}
console.log('');

// Test 6: Move History
console.log('Test 6: Move History');
console.log('-------------------');
const history = engine.getMoveHistory();
console.log('Move history:');
history.forEach((move, index) => {
  console.log(`  ${index + 1}. ${move.color}: ${move.notation} (${move.from}-${move.to})`);
});
console.log('');

// Test 7: PGN Generation
console.log('Test 7: PGN Output');
console.log('------------------');
console.log(engine.getPGN());
console.log('');

// Test 8: Board State
console.log('Test 8: Current Board State');
console.log('---------------------------');
const board = engine.getBoard();
console.log('Current turn:', board.toMove);
console.log('Castling rights:', board.castlingRights);
console.log('Sample squares:');
console.log('  - e4 (should have white pawn):', board.squares[4][4]);
console.log('  - e5 (should have black pawn):', board.squares[3][4]);
console.log('');

// Test 9: Undo Functionality
console.log('Test 9: Undo Last Move');
console.log('----------------------');
const undoResult = engine.undo();
console.log('Undo successful:', undoResult);
console.log('Current player after undo:', engine.getCurrentPlayer());
console.log('Move count after undo:', engine.getMoveHistory().length);
console.log('');

// Interactive Section
console.log('\n=== Interactive Testing Complete ===');
console.log('All basic GameEngine functions tested successfully!');
console.log('\nYou can now use this script as a base for further testing.');
console.log('To test specific scenarios, modify this script and run again.');