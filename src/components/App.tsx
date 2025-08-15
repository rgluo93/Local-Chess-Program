/**
 * App Component - Root component for the chess application
 * Phase 2.1: Basic component structure
 */

import React, { useEffect } from 'react';
import GameContainer from './GameContainer';
import { CSS_VARIABLES } from '../styles/theme';
import '../styles/global.css';
import './App.css';

const App: React.FC = () => {
  useEffect(() => {
    // Apply CSS variables to root element
    const root = document.documentElement;
    Object.entries(CSS_VARIABLES).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);
  
  return (
    <div className="chess-app">
      <GameContainer />
    </div>
  );
};

export default App;