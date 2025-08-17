/**
 * UCI (Universal Chess Interface) protocol type definitions
 */

export interface UCICommand {
  command: string;
  params?: string[];
}

export interface UCIResponse {
  type: 'bestmove' | 'info' | 'readyok' | 'uciok' | 'error';
  data: any;
  raw: string;
}

export interface UCIInfo {
  depth?: number;
  seldepth?: number;
  time?: number;
  nodes?: number;
  pv?: string[]; // Principal variation
  multipv?: number;
  score?: {
    cp?: number; // Centipawns
    mate?: number; // Mate in X moves
  };
  currmove?: string;
  currmovenumber?: number;
  hashfull?: number;
  nps?: number; // Nodes per second
  tbhits?: number;
  sbhits?: number;
  cpuload?: number;
  string?: string;
}

export interface UCIBestMove {
  move: string;
  ponder?: string;
}

export interface UCIOptions {
  [key: string]: {
    type: 'check' | 'spin' | 'combo' | 'button' | 'string';
    default?: any;
    min?: number;
    max?: number;
    var?: string[];
  };
}

export interface EngineState {
  initialized: boolean;
  ready: boolean;
  thinking: boolean;
  position: string; // FEN
  options: UCIOptions;
}