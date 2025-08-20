/**
 * BestMoveDisplay Component - Shows the engine's best move recommendation
 */

import React, { useState } from 'react';
import { Chess } from 'chess.js';
import PrincipalVariationModal from './PrincipalVariationModal';
import './BestMoveDisplay.css';

interface BestMoveDisplayProps {
  bestMoveUci: string | null;
  currentFen: string | null;
  className?: string;
  principalVariation?: string[];
}

const BestMoveDisplay: React.FC<BestMoveDisplayProps> = ({ bestMoveUci, currentFen, className = '', principalVariation = [] }) => {
  const [showPVModal, setShowPVModal] = useState(false);
  // Helper function to convert UCI move to algebraic notation
  const uciToAlgebraic = (uciMove: string, fen: string): string => {
    if (!uciMove) return '';
    
    try {
      const tempChess = new Chess(fen);
      const move = tempChess.move(uciMove);
      return move ? move.san : uciMove;
    } catch (error) {
      return uciMove;
    }
  };

  // Helper function to format the move display with consistent notation
  const formatMoveDisplay = (bestMoveUci: string | null, currentFen: string): { moveNumber: string; move: string } | null => {
    if (!bestMoveUci || !currentFen) return null;
    
    try {
      const tempChess = new Chess(currentFen);
      const algebraicMove = uciToAlgebraic(bestMoveUci, currentFen);
      
      if (!algebraicMove) return null;
      
      // Get the current move number and turn
      const parts = currentFen.split(' ');
      const turn = parts[1]; // 'w' or 'b'
      const fullMoveNumber = parseInt(parts[5]) || 1;
      
      if (turn === 'w') {
        // For white's move, show: "1." and "e4 ..."
        return {
          moveNumber: `${fullMoveNumber}.`,
          move: `${algebraicMove} ...`
        };
      } else {
        // For black's move, show: "1." and "... e5"
        return {
          moveNumber: `${fullMoveNumber}.`,
          move: `... ${algebraicMove}`
        };
      }
    } catch (error) {
      return null;
    }
  };

  if (!bestMoveUci || !currentFen) {
    return null;
  }

  const moveDisplay = formatMoveDisplay(bestMoveUci, currentFen);

  if (!moveDisplay) {
    return null;
  }

  const handleClick = () => {
    if (principalVariation && principalVariation.length > 0) {
      setShowPVModal(true);
    }
  };

  const hasPrincipalVariation = principalVariation && principalVariation.length > 0;

  return (
    <>
      <div 
        className={`best-move-display ${className} ${hasPrincipalVariation ? 'clickable' : ''}`}
        onClick={handleClick}
        title={hasPrincipalVariation ? "Click to view full principal variation" : undefined}
      >
        <div className="best-move-title">
          Best Move
        </div>
        <div className="best-move-notation">
          <span className="move-number">{moveDisplay.moveNumber}</span>
          <span className="move-text">{moveDisplay.move}</span>
        </div>
      </div>
      
      <PrincipalVariationModal
        isOpen={showPVModal}
        onClose={() => setShowPVModal(false)}
        principalVariation={principalVariation}
        currentFen={currentFen || ''}
        title="Principal Variation"
      />
    </>
  );
};

export default BestMoveDisplay;