/**
 * AI Worker - Real Stockfish WASM Engine
 * 
 * Runs real open-source Stockfish in a separate thread to prevent UI blocking
 * during move calculations.
 */

let stockfish: Worker | null = null;
let currentCommandId: string | null = null;

// Initialize real Stockfish WASM
const initializeStockfish = async () => {
  try {
    console.log('🏗️ Initializing real Stockfish WASM engine...');
    
    // Check if SharedArrayBuffer is available
    if (typeof SharedArrayBuffer === 'undefined') {
      console.warn('⚠️ SharedArrayBuffer is not available. Real Stockfish requires proper security headers.');
      console.log('Make sure the server is running with COOP and COEP headers enabled.');
    } else {
      console.log('✅ SharedArrayBuffer is available');
    }
    
    // Create Stockfish worker from public directory
    console.log('📦 Creating Stockfish WASM worker...');
    
    // Use the WASM version for better performance
    stockfish = new Worker('/stockfish.wasm.js');
    
    if (!stockfish) {
      throw new Error('Failed to create Stockfish worker');
    }
    
    console.log('🔧 Setting up Stockfish event handlers...');
    
    // Setup message handler for Stockfish responses
    stockfish.onmessage = (event) => {
      const response = event.data;
      console.log('📥 Real Stockfish response:', response);
      
      // Send UCI response to main thread
      self.postMessage({
        type: 'uci_response',
        response,
        id: currentCommandId
      });
      
      // Also send info messages for thinking visualization
      if (response.startsWith('info')) {
        self.postMessage({
          type: 'info',
          response
        });
      }
    };
    
    stockfish.onerror = (error) => {
      console.error('❌ Stockfish worker error:', error);
      self.postMessage({
        type: 'error',
        message: `Stockfish worker error: ${error.message}`
      });
    };
    
    console.log('✅ Real Stockfish WASM worker initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize Stockfish:', error);
    self.postMessage({
      type: 'error',
      message: `Stockfish initialization failed: ${error}`
    });
    throw error;
  }
};

// Handle messages from main thread
self.onmessage = async (event) => {
  const { command, id } = event.data;
  
  if (command === 'init') {
    await initializeStockfish();
    return;
  }
  
  if (!stockfish) {
    self.postMessage({
      type: 'error',
      message: 'Stockfish not initialized'
    });
    return;
  }
  
  currentCommandId = id;
  
  console.log('📤 Sending command to real Stockfish WASM:', command);
  
  // Send command to Stockfish worker
  stockfish.postMessage(command);
};

// Initialize when worker starts
initializeStockfish();