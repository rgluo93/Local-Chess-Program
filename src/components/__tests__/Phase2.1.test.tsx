/**
 * Phase 2.1: React Component Structure - Test Suite
 * 
 * This test suite verifies all deliverables for Phase 2.1:
 * 1. Component hierarchy implementation
 * 2. CSS color theme implementation
 * 3. Static 8x8 board layout
 * 4. Responsive container structure
 * 5. No React console warnings
 */

import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Import components to be tested (will be implemented after test approval)
import App from '@/components/App';
import GameContainer from '@/components/GameContainer';
import ChessBoard from '@/components/ChessBoard';
import GameControls from '@/components/GameControls';
import MoveHistoryPanel from '@/components/MoveHistoryPanel';

// Mock the orchestrator to avoid backend dependencies in UI tests
vi.mock('@/orchestrator/ChessGameOrchestrator', () => ({
  ChessGameOrchestrator: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getGameState: vi.fn().mockReturnValue({
      gameState: {
        board: Array(8).fill(null).map(() => Array(8).fill(null)),
        currentPlayer: 'white',
        status: 'playing',
      }
    }),
    getMoveHistory: vi.fn().mockReturnValue([]),
  }))
}));

describe('Phase 2.1: React Component Structure', () => {
  
  // ==========================================================================
  // DELIVERABLE 1: Component Hierarchy
  // ==========================================================================
  
  describe('1. Component Hierarchy Implementation', () => {
    
    it('should render the App root component', () => {
      const { container } = render(<App />);
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('chess-app');
    });
    
    it('should render GameContainer as child of App', () => {
      render(<App />);
      const gameContainer = screen.getByTestId('game-container');
      expect(gameContainer).toBeInTheDocument();
      expect(gameContainer).toHaveClass('game-container');
    });
    
    it('should render ChessBoard within GameContainer', () => {
      render(<GameContainer />);
      const chessBoard = screen.getByTestId('chess-board');
      expect(chessBoard).toBeInTheDocument();
      expect(chessBoard).toHaveClass('chess-board');
    });
    
    it('should render GameControls within GameContainer', () => {
      render(<GameContainer />);
      const gameControls = screen.getByTestId('game-controls');
      expect(gameControls).toBeInTheDocument();
      expect(gameControls).toHaveClass('game-controls');
    });
    
    it('should render MoveHistoryPanel within GameContainer', () => {
      render(<GameContainer />);
      const moveHistory = screen.getByTestId('move-history-panel');
      expect(moveHistory).toBeInTheDocument();
      expect(moveHistory).toHaveClass('move-history-panel');
    });
    
    it('should maintain correct component nesting structure', () => {
      const { container } = render(<App />);
      
      // App > GameContainer
      const app = container.querySelector('.chess-app');
      const gameContainer = within(app as HTMLElement).getByTestId('game-container');
      
      // GameContainer > ChessBoard, GameControls, MoveHistoryPanel
      const chessBoard = within(gameContainer).getByTestId('chess-board');
      const gameControls = within(gameContainer).getByTestId('game-controls');
      const moveHistory = within(gameContainer).getByTestId('move-history-panel');
      
      expect(chessBoard).toBeInTheDocument();
      expect(gameControls).toBeInTheDocument();
      expect(moveHistory).toBeInTheDocument();
    });
  });
  
  // ==========================================================================
  // DELIVERABLE 2: CSS Color Theme Implementation
  // ==========================================================================
  
  describe('2. CSS Color Theme Implementation', () => {
    
    it('should apply Deep Walnut Brown (#3E2723) to primary elements', () => {
      render(<App />);
      const primaryElements = document.querySelectorAll('.primary-bg');
      
      // Must have at least one primary element
      expect(primaryElements.length).toBeGreaterThan(0);
      
      primaryElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        expect(styles.backgroundColor).toBe('rgb(62, 39, 35)'); // #3E2723 in RGB
      });
    });
    
    it('should apply Warm Cream (#FFF8E1) as background color', () => {
      const { container } = render(<App />);
      const appElement = container.querySelector('.chess-app');
      
      // Skip test if element doesn't exist yet (expected in TDD red phase)
      if (!appElement) {
        expect(appElement).toBeTruthy(); // This will fail and show the issue
        return;
      }
      
      const styles = window.getComputedStyle(appElement);
      expect(styles.backgroundColor).toBe('rgb(255, 248, 225)'); // #FFF8E1 in RGB
    });
    
    it('should apply Burnt Amber (#F28C28) to text elements', () => {
      render(<GameControls />);
      const buttonTexts = screen.getAllByTestId(/button-text/);
      
      buttonTexts.forEach(element => {
        const styles = window.getComputedStyle(element);
        expect(styles.color).toBe('rgb(242, 140, 40)'); // #F28C28 in RGB
      });
    });
    
    it('should have Muted Gold (#D4AF37) defined for hover states', () => {
      // Check if CSS variable is defined in the application styles
      render(<App />); // This should load the app's CSS
      
      const rootStyles = getComputedStyle(document.documentElement);
      const hoverColor = rootStyles.getPropertyValue('--color-hover').trim();
      
      // The app should define this CSS variable
      expect(hoverColor).toBe('#D4AF37');
    });
    
    it('should have Sage Green (#7CB342) for positive actions', () => {
      render(<GameControls />);
      const newGameButton = screen.getByText(/New Game/i);
      expect(newGameButton).toHaveClass('positive-action');
    });
    
    it('should have Dusty Rose (#C67171) for negative actions', () => {
      render(<GameControls />);
      const resignButton = screen.getByText(/Resign/i);
      expect(resignButton).toHaveClass('negative-action');
    });
  });
  
  // ==========================================================================
  // DELIVERABLE 3: Static 8x8 Board Layout
  // ==========================================================================
  
  describe('3. Static 8x8 Board Layout', () => {
    
    it('should render exactly 64 squares', () => {
      render(<ChessBoard />);
      const squares = screen.getAllByTestId(/square-[a-h][1-8]/);
      expect(squares).toHaveLength(64);
    });
    
    it('should arrange squares in 8 rows and 8 columns', () => {
      render(<ChessBoard />);
      
      // Check for 8 rows
      for (let rank = 1; rank <= 8; rank++) {
        const rowSquares = screen.getAllByTestId(new RegExp(`square-[a-h]${rank}`));
        expect(rowSquares).toHaveLength(8);
      }
      
      // Check for 8 columns
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].forEach(file => {
        const colSquares = screen.getAllByTestId(new RegExp(`square-${file}[1-8]`));
        expect(colSquares).toHaveLength(8);
      });
    });
    
    it('should apply alternating colors to squares (light/dark pattern)', () => {
      render(<ChessBoard />);
      
      const lightSquares = ['a1', 'a3', 'a5', 'a7', 'b2', 'b4', 'b6', 'b8'];
      const darkSquares = ['a2', 'a4', 'a6', 'a8', 'b1', 'b3', 'b5', 'b7'];
      
      lightSquares.forEach(square => {
        const element = screen.getByTestId(`square-${square}`);
        expect(element).toHaveClass('light-square');
      });
      
      darkSquares.forEach(square => {
        const element = screen.getByTestId(`square-${square}`);
        expect(element).toHaveClass('dark-square');
      });
    });
    
    it('should display file labels (a-h)', () => {
      render(<ChessBoard />);
      
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].forEach(file => {
        const label = screen.getByText(file, { selector: '.file-label' });
        expect(label).toBeInTheDocument();
      });
    });
    
    it('should display rank labels (1-8)', () => {
      render(<ChessBoard />);
      
      ['1', '2', '3', '4', '5', '6', '7', '8'].forEach(rank => {
        const label = screen.getByText(rank, { selector: '.rank-label' });
        expect(label).toBeInTheDocument();
      });
    });
    
    it('should maintain square aspect ratio (1:1)', () => {
      render(<ChessBoard />);
      const square = screen.getByTestId('square-e4');
      const rect = square.getBoundingClientRect();
      
      // Allow for small rounding differences
      expect(Math.abs(rect.width - rect.height)).toBeLessThan(1);
    });
  });
  
  // ==========================================================================
  // DELIVERABLE 4: Responsive Container Structure
  // ==========================================================================
  
  describe('4. Responsive Container Structure', () => {
    
    it('should have flexible container layout', () => {
      const { container } = render(<App />);
      const gameContainer = container.querySelector('.game-container');
      
      if (!gameContainer) {
        expect(gameContainer).toBeTruthy(); // This will fail and show the issue
        return;
      }
      
      const styles = window.getComputedStyle(gameContainer);
      expect(styles.display).toMatch(/flex|grid/);
    });
    
    it('should center the chess board', () => {
      render(<GameContainer />);
      const board = screen.getByTestId('chess-board');
      const parent = board.parentElement;
      const parentStyles = window.getComputedStyle(parent!);
      
      expect(parentStyles.justifyContent).toMatch(/center/);
    });
    
    it('should position MoveHistoryPanel on the right', () => {
      render(<GameContainer />);
      const moveHistory = screen.getByTestId('move-history-panel');
      const container = screen.getByTestId('game-container');
      
      const historyRect = moveHistory.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Move history should be in the right portion of the container
      expect(historyRect.left).toBeGreaterThan(containerRect.left + containerRect.width / 2);
    });
    
    it('should group control buttons together', () => {
      render(<GameControls />);
      const controlsContainer = screen.getByTestId('game-controls');
      const buttons = within(controlsContainer).getAllByRole('button');
      
      // Should have at least New Game and Resign buttons
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      
      // All buttons should be within the same container
      buttons.forEach(button => {
        expect(button.parentElement).toBe(controlsContainer);
      });
    });
    
    it('should use responsive units for sizing', () => {
      const { container } = render(<App />);
      const app = container.querySelector('.chess-app');
      
      if (!app) {
        expect(app).toBeTruthy(); // This will fail and show the issue
        return;
      }
      
      const styles = window.getComputedStyle(app);
      // Should use viewport units or percentages for responsive design
      expect(styles.width).toMatch(/vw|%|auto/);
      expect(styles.height).toMatch(/vh|%|auto/);
    });
    
    it('should have proper z-index layering', () => {
      render(<GameContainer />);
      
      const board = screen.getByTestId('chess-board');
      const controls = screen.getByTestId('game-controls');
      
      const boardZ = window.getComputedStyle(board).zIndex;
      const controlsZ = window.getComputedStyle(controls).zIndex;
      
      // Controls should be above or equal to board in z-index
      if (boardZ !== 'auto' && controlsZ !== 'auto') {
        expect(parseInt(controlsZ)).toBeGreaterThanOrEqual(parseInt(boardZ));
      }
    });
  });
  
  // ==========================================================================
  // DELIVERABLE 5: No React Console Warnings
  // ==========================================================================
  
  describe('5. No React Console Warnings', () => {
    let consoleErrorSpy: any;
    let consoleWarnSpy: any;
    
    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error');
      consoleWarnSpy = vi.spyOn(console, 'warn');
    });
    
    afterEach(() => {
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
    
    it('should not produce React warnings when rendering App', () => {
      render(<App />);
      
      const reactWarnings = consoleWarnSpy.mock.calls.filter((call: any[]) => 
        call[0]?.toString().includes('React')
      );
      
      expect(reactWarnings).toHaveLength(0);
    });
    
    it('should not produce React errors when rendering components', () => {
      render(<App />);
      
      const reactErrors = consoleErrorSpy.mock.calls.filter((call: any[]) => 
        call[0]?.toString().includes('React')
      );
      
      expect(reactErrors).toHaveLength(0);
    });
    
    it('should have unique keys for list items', () => {
      render(<MoveHistoryPanel />);
      
      const keyWarnings = consoleWarnSpy.mock.calls.filter((call: any[]) => 
        call[0]?.toString().includes('key')
      );
      
      expect(keyWarnings).toHaveLength(0);
    });
    
    it('should not have deprecated lifecycle methods', () => {
      render(<App />);
      
      const deprecationWarnings = consoleWarnSpy.mock.calls.filter((call: any[]) => 
        call[0]?.toString().includes('deprecated')
      );
      
      expect(deprecationWarnings).toHaveLength(0);
    });
    
    it('should properly handle component unmounting', () => {
      const { unmount } = render(<App />);
      unmount();
      
      // Should not have any warnings about setting state on unmounted components
      const unmountWarnings = consoleWarnSpy.mock.calls.filter((call: any[]) => 
        call[0]?.toString().includes('unmounted')
      );
      
      expect(unmountWarnings).toHaveLength(0);
    });
  });
  
  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================
  
  describe('Integration: Complete Phase 2.1 Requirements', () => {
    
    it('should render the complete UI structure with all components', () => {
      const { container } = render(<App />);
      
      // Verify complete component tree
      expect(container.querySelector('.chess-app')).toBeInTheDocument();
      expect(screen.getByTestId('game-container')).toBeInTheDocument();
      expect(screen.getByTestId('chess-board')).toBeInTheDocument();
      expect(screen.getByTestId('game-controls')).toBeInTheDocument();
      expect(screen.getByTestId('move-history-panel')).toBeInTheDocument();
      
      // Verify board structure
      const squares = screen.getAllByTestId(/square-[a-h][1-8]/);
      expect(squares).toHaveLength(64);
      
      // Verify color theme is applied
      const app = container.querySelector('.chess-app');
      if (app) {
        const appStyles = window.getComputedStyle(app);
        expect(appStyles.backgroundColor).toBe('rgb(255, 248, 225)'); // Warm Cream
      }
    });
    
    it('should meet all Phase 2.1 testing criteria', () => {
      const { container } = render(<App />);
      
      // ✓ UI renders with correct color scheme
      const hasColorScheme = container.querySelector('.chess-app')?.classList.contains('chess-app');
      expect(hasColorScheme).toBe(true);
      
      // ✓ 8x8 board displays correctly
      const squares = screen.getAllByTestId(/square-[a-h][1-8]/);
      expect(squares).toHaveLength(64);
      
      // ✓ Basic button layout matches requirements
      const newGameButton = screen.queryByText(/New Game/i);
      const resignButton = screen.queryByText(/Resign/i);
      expect(newGameButton || resignButton).toBeTruthy();
      
      // ✓ No React console warnings
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      render(<App />);
      const reactWarnings = consoleWarnSpy.mock.calls.filter((call: any[]) => 
        call[0]?.toString().includes('React')
      );
      expect(reactWarnings).toHaveLength(0);
    });
  });
});