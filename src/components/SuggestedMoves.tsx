/**
 * SuggestedMoves Component - Displays top 3 continuation moves from Stockfish multi-PV
 */

import React from 'react';
import { Chess } from 'chess.js';
import './SuggestedMoves.css';

interface SuggestedMovesProps {
  currentFen: string;
  pvLines: Array<{
    move: string; // UCI format move
    evaluation: number;
    depth: number;
    mateIn?: number;
  }>;
}

const SuggestedMoves: React.FC<SuggestedMovesProps> = ({ currentFen, pvLines }) => {
  // Convert UCI move to SAN notation and get move number
  const convertToDisplayFormat = (uciMove: string, fen: string): { moveNumber: number; isBlackMove: boolean; san: string } | null => {
    try {
      const tempChess = new Chess(fen);
      const move = tempChess.move(uciMove);
      if (!move) return null;
      
      // Get full move number and determine if it's black's move
      const fenParts = fen.split(' ');
      const fullMoveNumber = parseInt(fenParts[5] || '1');
      const isWhiteToMove = fenParts[1] === 'w';
      
      return {
        moveNumber: fullMoveNumber,
        isBlackMove: !isWhiteToMove,
        san: move.san
      };
    } catch (error) {
      console.error('Error converting UCI move:', error);
      return null;
    }
  };

  // Format evaluation for display
  const formatEvaluation = (evaluation: number, mateIn?: number): string => {
    if (mateIn !== undefined) {
      return `M${mateIn}`;
    }
    const pawns = (evaluation / 100).toFixed(1);
    return evaluation >= 0 ? `+${pawns}` : pawns;
  };

  if (pvLines.length === 0) {
    return (
      <div className="suggested-moves-container">
        <h4>Suggested Moves</h4>
        <div className="no-suggestions">Analyzing...</div>
      </div>
    );
  }

  return (
    <div className="suggested-moves-container">
      <h4>Suggested Moves</h4>
      <div className="moves-list">
        {pvLines.slice(0, 3).map((line, index) => {
          const moveInfo = convertToDisplayFormat(line.move, currentFen);
          if (!moveInfo) return null;

          return (
            <div key={index} className="suggested-move-pair">
              <span className="move-number">
                {moveInfo.moveNumber}{moveInfo.isBlackMove ? '. ...' : '.'}
              </span>
              <span className={`suggested-move ${moveInfo.isBlackMove ? 'black-move' : 'white-move'}`}>
                {moveInfo.san}
              </span>
              <span className="move-evaluation">
                {formatEvaluation(line.evaluation, line.mateIn)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedMoves;