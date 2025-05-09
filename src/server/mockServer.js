import { createServer } from 'http';
import { Server } from 'socket.io';
import { generateMockData } from '../utils/mockData.js';

// Create HTTP server
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Connection event
io.on('connection', (socket) => {
  console.log('A client connected');
  
  // Send initial data
  socket.emit('initial-data', generateMockData());
  
  // Set up interval to send mock data updates
  const interval = setInterval(() => {
    const mockData = generateMockData();
    socket.emit('data-update', mockData);
  }, 5000);
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('A client disconnected');
    clearInterval(interval);
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`);
});