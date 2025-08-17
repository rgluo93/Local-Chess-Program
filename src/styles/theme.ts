/**
 * Phase 2.1: CSS Theme Constants
 * 
 * Defines the color palette and typography for the chess application
 * Based on requirements.md specifications
 */

export const COLORS = {
  PRIMARY: {
    DEEP_WALNUT_BROWN: '#3E2723',
    WARM_CREAM: '#FFF8E1',
    BURNT_AMBER: '#F28C28',
  },
  ACCENT: {
    MUTED_GOLD: '#D4AF37',
    SAGE_GREEN: '#7CB342',
    DUSTY_ROSE: '#C67171',
  },
  BOARD: {
    LIGHT_SQUARE: '#F0D9B5', // Light beige for board squares
    DARK_SQUARE: '#B58863',  // Medium brown for board squares
  },
  PIECE: {
    WHITE: '#FFFFFF',
    BLACK: '#000000',
  },
  FEEDBACK: {
    VALID_MOVE: '#5FA4E8', // Soft blue for valid move highlights
    CHECK: '#FF8A65',      // Soft orange for check highlight
    LAST_MOVE: '#F4E04D',   // Yellow for last move highlight
    SELECTED: '#7CB342',    // Green for selected square
    AI_MOVE: '#4CAF50',     // Green for AI move destination
  },
  TYPOGRAPHY: {
    FONT_FAMILY: "'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    SIZE_BUTTON: '14px',
    SIZE_COORDINATES: '12px',
    SIZE_STATUS: '16px',
    WEIGHT_BOLD: 'bold',
    WEIGHT_NORMAL: 'normal',
  },
};

export const CSS_VARIABLES = {
  // Primary colors
  '--color-primary-brown': COLORS.PRIMARY.DEEP_WALNUT_BROWN,
  '--color-primary-cream': COLORS.PRIMARY.WARM_CREAM,
  '--color-primary-amber': COLORS.PRIMARY.BURNT_AMBER,
  
  // Accent colors
  '--color-accent-gold': COLORS.ACCENT.MUTED_GOLD,
  '--color-accent-green': COLORS.ACCENT.SAGE_GREEN,
  '--color-accent-rose': COLORS.ACCENT.DUSTY_ROSE,
  
  // Board colors
  '--color-board-light': COLORS.BOARD.LIGHT_SQUARE,
  '--color-board-dark': COLORS.BOARD.DARK_SQUARE,
  
  // Piece colors
  '--color-piece-white': COLORS.PIECE.WHITE,
  '--color-piece-black': COLORS.PIECE.BLACK,
  
  // Feedback colors
  '--color-valid-move': COLORS.FEEDBACK.VALID_MOVE,
  '--color-check': COLORS.FEEDBACK.CHECK,
  '--color-last-move': COLORS.FEEDBACK.LAST_MOVE,
  '--color-selected': COLORS.FEEDBACK.SELECTED,
  '--color-ai-move': COLORS.FEEDBACK.AI_MOVE,
  
  // Hover state
  '--color-hover': COLORS.ACCENT.MUTED_GOLD,
  
  // Typography
  '--font-family': COLORS.TYPOGRAPHY.FONT_FAMILY,
  '--font-size-button': COLORS.TYPOGRAPHY.SIZE_BUTTON,
  '--font-size-coordinates': COLORS.TYPOGRAPHY.SIZE_COORDINATES,
  '--font-size-status': COLORS.TYPOGRAPHY.SIZE_STATUS,
  '--font-weight-bold': COLORS.TYPOGRAPHY.WEIGHT_BOLD,
};