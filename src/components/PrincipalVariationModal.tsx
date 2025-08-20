/**
 * PrincipalVariationModal Component - Display full principal variation in modal
 */

import React from 'react';
import { Chess } from 'chess.js';
import './PrincipalVariationModal.css';

interface PrincipalVariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  principalVariation: string[]; // Array of UCI moves
  currentFen: string;
  title?: string;
}

const PrincipalVariationModal: React.FC<PrincipalVariationModalProps> = ({ 
  isOpen, 
  onClose, 
  principalVariation, 
  currentFen,
  title = "Principal Variation"
}) => {
  if (!isOpen) return null;

  // Convert UCI moves to SAN notation starting from current position
  const convertPVToMoves = () => {
    if (!principalVariation || principalVariation.length === 0) {
      return { moves: [], startingMoveNumber: 1, startingTurn: 'white' };
    }

    try {
      const chess = new Chess(currentFen);
      const moves = [];

      // Get starting position info
      const fenParts = currentFen.split(' ');
      const startingTurn = fenParts[1] === 'w' ? 'white' : 'black';
      const startingMoveNumber = parseInt(fenParts[5]) || 1;

      for (const uciMove of principalVariation) {
        try {
          // Convert UCI to move object
          const from = uciMove.substring(0, 2);
          const to = uciMove.substring(2, 4);
          const promotion = uciMove.length === 5 ? uciMove[4] : undefined;

          const moveObj = {
            from,
            to,
            promotion
          };

          const move = chess.move(moveObj);
          if (move) {
            moves.push({
              notation: move.san,
              color: move.color === 'w' ? 'white' : 'black'
            });
          } else {
            break; // Invalid move, stop processing
          }
        } catch (error) {
          console.warn('Error converting UCI move:', uciMove, error);
          break;
        }
      }

      return { moves, startingMoveNumber, startingTurn };
    } catch (error) {
      console.error('Error processing principal variation:', error);
      return { moves: [], startingMoveNumber: 1, startingTurn: 'white' };
    }
  };

  const { moves, startingMoveNumber, startingTurn } = convertPVToMoves();

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="principal-variation-overlay" onClick={handleOverlayClick}>
      <div className="principal-variation-modal">
        <div className="modal-header">
          <h3 className="panel-title">{title}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="moves-list">
          {moves.length === 0 ? (
            <div className="no-moves">No variation available</div>
          ) : (
            (() => {
              const pairedMoves = [];
              let moveNumber = startingMoveNumber;
              let isWhiteTurn = startingTurn === 'white';
              
              for (let i = 0; i < moves.length; i++) {
                const currentMove = moves[i];
                const isCurrentMoveWhite = currentMove.color === 'white';
                
                if (isCurrentMoveWhite) {
                  // This is a white move
                  const nextMove = i + 1 < moves.length ? moves[i + 1] : null;
                  const nextMoveIsBlack = nextMove && nextMove.color === 'black';
                  
                  pairedMoves.push(
                    <div key={`${moveNumber}-w`} className="move-pair">
                      <span className="move-number">{moveNumber}.</span>
                      <span className="white-move">
                        {currentMove.notation}
                      </span>
                      {nextMoveIsBlack ? (
                        <span className="black-move">
                          {nextMove.notation}
                        </span>
                      ) : (
                        <span className="black-move">...</span>
                      )}
                    </div>
                  );
                  
                  // Skip the black move if we processed it
                  if (nextMoveIsBlack) {
                    i++; // Skip the next move since we already processed it
                  }
                  
                  moveNumber++;
                } else {
                  // This is a black move starting a move pair
                  pairedMoves.push(
                    <div key={`${moveNumber}-b`} className="move-pair">
                      <span className="move-number">{moveNumber}.</span>
                      <span className="white-move">...</span>
                      <span className="black-move">
                        {currentMove.notation}
                      </span>
                    </div>
                  );
                  
                  moveNumber++;
                }
              }
              
              return pairedMoves;
            })()
          )}
        </div>
        
        <div className="variation-info">
          <div className="status-item">
            Depth: {principalVariation.length} half-moves
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalVariationModal;