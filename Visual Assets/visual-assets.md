# Visual Assets Requirements

This document lists all visual images and assets needed for the chess program, based on the requirements document.

## 1. Chess Piece Set (SVG/PNG)

### White Pieces
- **King** - White piece with #FFFFFF base color
- **Queen** - White piece with #FFFFFF base color
- **Rook** - White piece with #FFFFFF base color
- **Bishop** - White piece with #FFFFFF base color
- **Knight** - White piece with #FFFFFF base color
- **Pawn** - White piece with #FFFFFF base color

### Black Pieces
- **King** - Black piece with #000000 base color
- **Queen** - Black piece with #000000 base color
- **Rook** - Black piece with #000000 base color
- **Bishop** - Black piece with #000000 base color
- **Knight** - Black piece with #000000 base color
- **Pawn** - Black piece with #000000 base color

**Style Requirements**: 2D flat vector graphics with bold outlines, simple high-contrast shapes, classic Staunton design

## 2. Board Square Highlights

- **Valid Move Highlight** - Soft blue semi-transparent overlay for destination squares
- **Check Highlight** - Red/orange highlight for King's square when in check
- **Last Move Highlight** - Subtle highlight showing both origin and destination squares
- **Illegal Move Highlight** - Red flash/highlight for invalid move attempts

**Description**: Semi-transparent overlays that can be dynamically applied to board squares

## 3. UI Control Buttons

- **New Game Button** - Icon or styled button for starting a new game
- **Resign Button** - Icon or styled button for resigning
- **Copy PGN/FEN Button** - Icon or styled button for copying game notation
- **Save Game Button** - Icon or styled button for saving current game
- **Load Game Button** - Icon or styled button for loading saved game
- **Zoom In Button (＋)** - Circular button with plus symbol
- **Zoom Out Button (－)** - Circular button with minus symbol

**Style Requirements**: Minimalistic button designs matching the board aesthetic, zoom buttons at 40% opacity when idle, 100% on hover

## 4. Pawn Promotion Dialog

- **Promotion Modal** - Dialog box or overlay for pawn promotion
- **Piece Selection Icons** - Visual selection UI showing Queen, Rook, Bishop, Knight options

**Description**: Clean modal interface for selecting promotion piece

## 5. Game State Indicators

- **Checkmate Banner** - "Checkmate — White wins" / "Checkmate — Black wins" display
- **Stalemate Banner** - "Draw — Stalemate" display
- **Draw Banners** - Messages for various draw conditions:
  - "Draw — Threefold repetition"
  - "Draw — 50-move rule"
  - "Draw — Insufficient material"
- **Turn Indicator** - Visual indicator showing whose turn it is (White/Black)

**Description**: Clean, non-intrusive status messages that don't obstruct gameplay

## 6. Cursor States

- **Drag Cursor** - Custom cursor icon when dragging a piece
- **Hover Cursor** - Pointer cursor when hovering over moveable pieces
- **Default Cursor** - Standard cursor for non-interactive areas

**Description**: Context-appropriate cursor icons for better user feedback

## 7. Board Coordinates

- **File Labels** - Letters a through h for columns
- **Rank Labels** - Numbers 1 through 8 for rows

**Requirements**: Clear, scalable text labels that adjust proportionally with board zoom level

## 8. Animation Sprites/States

- **Piece Drag Shadow** - Shadow effect under piece while dragging
- **Snap-back Animation** - Visual effect for piece returning to original square on illegal move
- **Castling Animation** - Smooth transition paths for both King and Rook movement
- **En Passant Animation** - Special capture animation for en passant moves
- **Piece Movement Trail** - Optional subtle trail effect during piece movement

**Description**: Smooth transition effects enhancing the drag-and-drop experience

## 9. Reference Board Style

- **Existing Reference**: `Screenshot_2025-07-30_at_6.48.34_PM.png`
- **Board Colors**: 
  - Light squares: Light beige
  - Dark squares: Medium brown
- **Overall Style**: Clean, classic chess board appearance

## 10. Loading/Saving Indicators

- **Loading Spinner** - Simple animation for game loading states
- **Save Confirmation** - Visual checkmark or notification for successful save
- **Error Indicator** - Visual feedback for failed operations

**Description**: Simple, unobtrusive loading and status indicators

## UI Color Theme and Design System

### Color Palette

**Primary Colors:**
- **Deep Walnut Brown** (#3E2723) - Used as the button base for primary actions and active states
- **Warm Cream** (#FFF8E1) - Used as the surrounding background color, creating clean, minimal contrast
- **Burnt Amber** (#F28C28) - Used for button text to provide a warm, readable accent that stands out clearly

**Accent Colors:**
- **Muted Gold** (#D4AF37) - For hover states and important actions
- **Sage Green** (#7CB342) - For positive actions (New Game, Save)
- **Dusty Rose** (#C67171) - For negative actions (Resign)

**Board Colors (from requirements):**
- **Light Squares**: Light beige
- **Dark Squares**: Medium brown

### Button Design System

**Example Reference**: See `Visual Assets/example_button_style.png` for visual reference

**Base Style:**
- Flat 2D base with smooth, rounded corners
- Slight depth via subtle inner shadow and gentle edge highlight
- No gradients, icons, or complex decorations beyond essential shading
- Smooth 200ms transitions on hover
- Minimalist focus with tactile clarity

**Button States:**
- **Default**: Deep walnut brown base (#3E2723), burnt amber text (#F28C28)
- **Hover**: Enhanced highlight and shadow for visual feedback
- **Active**: Slightly pressed appearance with adjusted shadows
- **Disabled**: 50% opacity, no hover effects

### Specific Button Treatments

**Game Control Buttons:**
- New Game: Sage green (#7CB342) accent on hover
- Resign: Dusty rose (#C67171) accent on hover
- Save/Load: Standard treatment
- Copy PGN/FEN: Icon-based with tooltip

**Zoom Buttons:**
- Circular design matching the 2D piece aesthetic
- Thin 2px border
- Plus/minus symbols in charcoal
- 40% opacity when idle, smooth fade to 100% on hover

### Typography
- Font Family: Clean sans-serif (Inter, Roboto, or system font)
- Font Weight: Bold for high-contrast readability
- Button Text Color: Burnt amber (#F28C28) for warm, readable accent
- Button Text Size: 14px
- Coordinate Labels: 12px
- Game Status Messages: 16px

### Visual Enhancements
- Subtle inner shadow and gentle edge highlight for hint of 3D depth
- Bold, high-contrast typography in burnt amber (#F28C28)
- Icons use same bold outline style as chess pieces (2px stroke)
- Consistent earth-toned color scheme aligned with chessboard's natural tones

## Technical Specifications

- **Format**: Preferably SVG for scalability, with PNG fallbacks
- **Size Range**: Must support board sizes from 384x384px to 1024x1024px
- **Color Depth**: Full color support with transparency
- **Optimization**: Images should be optimized for web delivery
- **Accessibility**: High contrast between pieces and board for visibility

## Notes

- All visual assets should maintain clarity when scaled between 48x48px and 128x128px per square
- Animations should be smooth at 60fps
- All interactive elements should have clear hover/active states
- The overall aesthetic should be minimalistic and focused on gameplay clarity
- UI elements should use the defined color palette to maintain visual consistency
- All colors should meet WCAG AA contrast requirements for accessibility