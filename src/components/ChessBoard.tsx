/**
 * ChessBoard Component - 8x8 chess board
 * Phase 2.1: Static board layout with squares and coordinates
 */

import React from 'react';
import './ChessBoard.css';

const ChessBoard: React.FC = () => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  // Determine if a square should be light or dark
  // a1 should be light (bottom-left from white's perspective)
  const isLightSquare = (fileIndex: number, rankIndex: number): boolean => {
    // Rank 1 is index 7 (since ranks array is ['8','7',...'1'])
    // So we need to invert the logic for correct coloring
    return (fileIndex + rankIndex) % 2 === 1;
  };
  
  return (
    <div className="chess-board" data-testid="chess-board">
      {/* Rank labels on the left */}
      <div className="rank-labels">
        {ranks.map(rank => (
          <div key={rank} className="rank-label">
            {rank}
          </div>
        ))}
      </div>
      
      {/* Board squares */}
      <div className="board-squares">
        {ranks.map((rank, rankIndex) => (
          <div key={rank} className="board-row">
            {files.map((file, fileIndex) => {
              const squareId = `${file}${rank}`;
              const isLight = isLightSquare(fileIndex, rankIndex);
              
              return (
                <div
                  key={squareId}
                  data-testid={`square-${squareId}`}
                  className={`square ${isLight ? 'light-square' : 'dark-square'}`}
                >
                  {/* Square content will go here */}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* File labels at the bottom */}
      <div className="file-labels">
        {files.map(file => (
          <div key={file} className="file-label">
            {file}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChessBoard;