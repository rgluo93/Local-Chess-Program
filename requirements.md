# Local Chess Program – Requirements Document

## 1. Introduction

### 1.1 Purpose

The purpose of this document is to define the requirements for a local chess program that allows users to play complete chess games with a visual user interface (UI).

### 1.2 Scope

The chess program will:

* **Run offline only**, either via the command line or through a localhost-based interface in a browser (e.g., `http://localhost:3000`).
* Support local human-vs-human gameplay on the same device.
* Provide a drag-and-drop or click-to-move user interface.
* Validate all moves according to standard chess rules.
* Allow players to resign.
* Track and export games in both PGN (Portable Game Notation) and FEN format.
* Allow players to see intermediate positions after a game is finished, using arrow keys to scroll backward and forward to specific move numbers/positions in the game.

**Note:** Online play is not part of the MVP and will only be considered as a future enhancement.

### 1.3 Objectives

* Deliver a fully functional Minimum Viable Product (MVP) for offline two-player games.
* Ensure high usability and strict adherence to official chess rules.
* Build an architecture suitable for future enhancements, including online multiplayer.

---

## 2. Functional Requirements

### 2.1 Game Setup

1. The program must initialize a standard 8×8 chessboard with pieces in their correct starting positions.
2. The player using White must go first.
3. A "New Game" button must reset the board and game state.

### 2.2 Move Validation

1. All moves must be validated according to the [official chess rules](https://www.chess.com/learn-how-to-play-chess).

   * Pawns: Move forward 1 square (or 2 squares from starting position); capture diagonally.
   * Knights: Move in L-shape; can jump over pieces.
   * Bishops, Rooks, Queens: Move along ranks, files, or diagonals without obstruction.
   * Kings: Move 1 square in any direction.
2. Special moves:

   * **Castling**: Allowed if neither the King nor the Rook has moved, no pieces between them, and the King is not in check before, during, or after castling.
   * **En Passant**: Allowed if a pawn moves two squares and lands adjacent to an opponent's pawn, which may capture it on the next move.
   * **Pawn Promotion**: When a pawn reaches the final rank, a promotion dialog must appear, allowing the user to select a Queen, Rook, Bishop, or Knight.
3. Illegal moves:

   * The program must reject moves that leave the player’s King in check.
   * Any invalid move attempt must display a clear visual red highlight on the piece that the user tried to move, with the piece returned to (for attempted drag-and-drop) its original square or remaining in (for attempted click-and-move) its original square.

### 2.3 Endgame Conditions

1. Checkmate: Detect and declare when the opposing King is in check and has no legal moves.
2. Stalemate: Detect when a player has no legal moves and is not in check.
3. Draw conditions:

   * Insufficient material.
   * Threefold repetition.
   * 50-move rule (50 moves without a pawn move or capture).
4. Resignation:

   * A "Resign" button must allow a player to forfeit the game.

### 2.4 User Controls

1. Drag-and-drop piece movement.
2. Click-to-select, click-to-destination interaction.
3. Buttons for:

   * Resign
   * New Game (at the end of a game, or upon opening the application)
   * Copy PGN/FEN (at the end of a game)
   * Save Game (if there is a game in progress upon closing the application)
   * Load Game (if there is a saved game upon opening the application)

### 2.5 Game Tracking

1. Maintain move history in algebraic notation.
2. Allow users to copy the PGN/FEN for use in external chess platforms.
3. If a game is in progress when users close the application, prompt users if they want to Save Game.
4. If there is a saved game upon opening the application, give options for users to either select to begin a New Game or to Load Game from the saved game.

---

## 3. Non-Functional Requirements

1. **Offline-only**: The program must run fully offline via command line or localhost. There must be no dependencies on online services.
2. **Performance**: The program must respond to all user actions within 100ms.
3. **Reliability**: The program must not crash during typical use; edge cases must be handled gracefully.
4. **Compatibility**:

   * Desktop: Windows, macOS, Linux.
   * Web (localhost only): Major browsers (Chrome, Firefox, Edge, Safari).
5. **Extensibility**: Architecture must support future AI integration, online multiplayer, and advanced analysis without significant refactoring.

---

## 4. UI/UX Specifications

### 4.1 Visual Style

* The UI must adopt the same style as the attached **reference image** (see below).
  ![Reference Board Style](Visual Assets/Screenshot_2025-07-30_at_6.48.34_PM.png)

### 4.2 Detailed Description of Style

* The board uses a light beige (for light squares) and medium brown (for dark squares) alternating square color scheme.
* Pieces use **2D flat vector graphics** with bold outlines and simple, high-contrast shapes. [see "Visual Assets/Piece Set" directory for piece graphic example images]
* **Piece Rendering**: Chess pieces are rendered using Canvas API at 95% of square size with proper aspect ratio preservation and centered positioning for optimal visual quality.
* The board includes coordinate labels along the files (a-h) and ranks (1-8).
* The piece shapes (king, queen, rook, bishop, knight, pawn) match the classic Staunton design, with clear white (#FFFFFF) base color for white pieces and clear black (#000000) base color for black pieces.
* **High-DPI Support**: Canvas rendering includes devicePixelRatio scaling for crisp display on all screen types.
* The interface is minimalistic: no distracting backgrounds or effects.

### 4.2.1 UI Color Theme

* **Primary Colors:**
  * Deep Walnut Brown (#3E2723) - Used as the button base for primary actions and active states
  * Warm Cream (#FFF8E1) - Used as the surrounding background color, creating clean, minimal contrast
  * Burnt Amber (#F28C28) - Used for button text to provide a warm, readable accent that stands out clearly
* **Accent Colors:**
  * Muted Gold (#D4AF37) - For hover states and important actions
  * Sage Green (#7CB342) - For positive actions (New Game, Save)
  * Dusty Rose (#C67171) - For negative actions (Resign)
* **Button Design:** (See `Visual Assets/example_button_style.png` for reference)
  * Flat 2D base with smooth, rounded corners and slight depth via highlight/shadow
  * Bold, high-contrast burnt amber text (#F28C28) for enhanced legibility
  * Minimalist focus with no gradients or complex decorations
  * Subtle inner shadow and gentle edge highlight for tactile clarity
* **Typography:**
  * Clean sans-serif font (Inter, Roboto, or system font)
  * Bold weight for high-contrast readability with burnt amber color
  * 14px for buttons, 12px for coordinates, 16px for game status

### 4.3 Layout & Interactions

1. **Layout**:

   * A centered 8×8 board.
   * Move history panel on the right.
   * Control buttons (New Game [if game is over], Resign, PGN/FEN) grouped together.
2. **Interactions**:

   * Drag-and-drop pieces with smooth animations.
   * Destination squares highlight valid moves in a soft color (e.g., blue).
   * Illegal move attempts provide immediate feedback (e.g., shake animation or red highlight).
3. **Visual Feedback**:

   * Check status highlights the King’s square.

### 4.4 Advanced Interactions

1. **Reactive Drag-and-Drop Animation**
   * When a user initiates a drag action on a piece, the piece must visually follow the mouse cursor from its original square in real-time.
   * When the piece is released (dropped), it must smoothly recenter itself into the exact center of the destination square with a short easing animation (100 ms or less).
   * If the move is illegal, the piece must immediately return to its original square and the original square must be highlighted in red.

2. **Elastic Board Scaling (Zoom)**
   * The board must support zoom-in and zoom-out interactions.
      * Keyboard: "Ctrl" + "=" to zoom in; "Ctrl" + "-" to zoom out.
      * Mouse: "Ctrl" + "Scroll Up" to zoom in; "Ctrl" + "Scroll Down" to zoom out.
      * Buttons: Show two small, always-visible “＋ / －” circular buttons that float just above the top-right corner of the board (z-index above pieces). Fade to 40 % opacity when idle, return to 100 % on hover/touch.
   * Both the board and all pieces must scale proportionally without distortion when zooming.
   * Coordinate labels (a-h, 1-8) must also scale or reposition accordingly to remain clearly legible at all zoom levels.
   * The zoom action must include smooth transitions (elastic easing) so the board resizes naturally.
   * *The default board size is 560x560 px (each square 70x70 px). The minimum board size should be 384x384 px (each square 48x48 px) and maximum 1024x1024 px (squares 128x128 px).*

3. **Responsive Board Resizing**
   * The chessboard, pieces, coordinate labels, move-history panel, and all control buttons must resize continuously and proportionally while the application window itself is being resized (e.g., the user drags a window edge or changes device orientation).
   * Real-time reaction: During the drag gesture the board must scale at the same cadence as the window’s size change, with frame updates targeting 60 fps to preserve a smooth “elastic” feel identical to the drag-and-drop animation.
   * Aspect & limits: The board must always remain a perfect square; each individual square's edge length is recalculated on every resize but clamped to the 48 px – 128 px range defined in the zoom limits requirement. The default square size is 70px. The window resizing action should stop at these sizes even if the user continues dragging.
   * Layout integrity: When the board shrinks or grows, adjacent UI elements (move list, +/- zoom buttons, resign/new-game controls) must re-flow or re-anchor so they never overlap the board.

---

## 5. Technical Requirements



1. **Languages & Frameworks**:
   * **Implementation Type**: Web-based (localhost) application
   * **Frontend**:
     * TypeScript with React for UI components
     * Canvas API or SVG for board rendering and animations
     * CSS animations for drag-and-drop and elastic effects
   * **Backend**:
     * Node.js with Express for serving the application
     * Chess.js library for move validation and game logic
   * **Storage**:
     * LocalStorage API for game persistence
2. **Data Structures**:
   * *Claude Code Instruction: Prompt the user and wait for approval every time there is a major data structure choice/decision, or major algorithmic choice/decision.*
3. **Storage**:
   * The program must implement local storage for saving and resuming games.
4. **Architecture**:
   * Modular design: Separate UI layer, game logic, and persistence.
   * Interfaces for potential AI engines or multiplayer backends.

---

## 6. Test Scenarios
* After each phase of implementation, all of the features (that have been implemented) must pass the following tests.
* *Claude Code Instruction: For each test scenario, set up the test, run it if possible, then prompt for user/coder approval. For any tests involving visuals/UI, do not run it but set it up for the user to run and approve.*

| # | Scenario | Setup | Action | Expected Outcome |
|---|----------|-------|--------|------------------|
| **1** | **Basic Pawn Double Move** | Fresh game | Drag white pawn **e2 → e4** | Pawn lands on **e4**; move recorded; no error |
| **2** | **Illegal Knight Move** | Fresh game | Drag white knight **g1 → g3** (straight) | Piece snaps back; square **g3** flashes red; “Illegal move” message |
| **3** | **Kingside Castling (Legal)** | Clear path; king & rook unmoved | Drag king **e1 → g1** | King on **g1**, rook on **f1**; move recorded as **O-O** |
| **4** | **Queenside Castling Blocked (Illegal)** | Bishop placed on **d1** | Attempt king **e1 → c1** | Move rejected; king returns; error shown |
| **5** | **En Passant Capture** | FEN: `rnbqkbnr/pp1ppppp/8/2pP4/8/8/PP2PPPP/RNBQKBNR b KQkq d3 0 3` | Black plays **cxd3 e.p.** | Black pawn appears **d3**; white pawn removed; notation “cxd3 e.p.” |
| **6** | **Pawn Promotion to Knight** | White pawn on **h7** | Drag **h7 → h8**; choose “Knight” | Knight appears on **h8** after dialog |
| **7** | **Checkmate Detection** | Scholar’s mate setup after **4.Qxf7#** | Validate state | Black king (**e8**) highlighted; result “Checkmate — White wins” |
| **8** | **Stalemate Detection** | FEN: `7k/5Q2/6K1/8/8/8/8/8 w - - 0 1` | White to move | Game ends “Draw — Stalemate” |
| **9** | **Threefold Repetition Draw** | Position repeats three times | Click **Claim Draw** | Game ends “Draw — Threefold repetition” |
| **10** | **50-Move Rule Draw** | 50 moves without capture/pawn move | Validate automatically | Game ends “Draw — 50-move rule” |
| **11** | **Undo Last Move** | Any mid-game | Click **Undo** | Board reverts; move removed; clocks adjust |
| **12** | **Resignation** | Any mid-game | Click **Resign** | Opponent declared winner; PGN result **1-0** or **0-1** |
| **13** | **PGN & FEN Export** | After 15 moves | Click **Copy PGN/FEN** | Clipboard holds valid PGN & FEN |
| **14** | **Reactive Drag Animation** | Fresh game | Drag rook **a1** slowly in circles | Piece follows cursor smoothly; on drop **a3** recenters |
| **15** | **Zoom Buttons** | Default zoom | Click **＋** ×5, **−** ×6 | Square size clamped 48 – 128 px |
| **16** | **Gesture Zoom** | Desktop browser | Pinch-zoom in/out | Board scales smoothly; limits respected |
| **17** | **Responsive Window Resize** | 1920 × 1080 → 800 × 600 → back | Drag window edges | Board resizes live at ~60 fps; UI never overlaps |
| **18** | **Move While Zoomed** | Board at max zoom (128 px squares) | Drag bishop **c1 → h6** | Move executes; animation fluid; no clipping |
| **19** | **Offline Integrity** | Disconnect network | Launch app, play 10 moves | No external requests; game fully functional |
| **20** | **Performance Stress** | Script 100 rapid moves | Measure UI latency | Avg input-to-paint ≤ 100 ms; no memory leaks |

> **Coverage:** Tests 1–8 validate core chess logic; 9–12 handle draws & finishes; 13 checks notation export; 14–18 exercise UI reactivity (drag, zoom, resize); 19 confirms offline mode; 20 enforces performance constraints.


---

## 7. Future Enhancements

1. **AI Opponent**:

   * Integrate chess engines (e.g., Stockfish).
2. **Online Multiplayer**:

   * Add server-client support for real-time games (not part of MVP).
3. **Game Analysis**:

   * Highlight best moves and mistakes using AI.
4. **Custom Board Themes**:

   * Allow users to change piece and board designs.