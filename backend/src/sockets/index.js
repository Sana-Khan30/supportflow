const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Gracefully authenticate socket connection
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token || token === 'null' || token === 'undefined') {
        socket.userId = null;
        socket.userRole = 'guest';
        socket.userIsDemo = false;
        return next();
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userIsDemo = !!decoded.isDemo;
      next();
    } catch (err) {
      // Degrade to guest instead of rejecting handshake
      socket.userId = null;
      socket.userRole = 'guest';
      socket.userIsDemo = false;
      next();
    }
  });

  io.on('connection', (socket) => {
    if (socket.userId) {
      // Personal room — used for notifications & updates
      socket.join(`user:${socket.userId}`);

      // Agents room scoped to demo/real
      if (socket.userRole === 'agent') {
        socket.join(socket.userIsDemo ? 'agents:demo' : 'agents:real');
      }
    }

    socket.on('ticket:join', (ticketId) => {
      if (ticketId) socket.join(`ticket:${ticketId}`);
    });

    socket.on('ticket:leave', (ticketId) => {
      if (ticketId) socket.leave(`ticket:${ticketId}`);
    });

    socket.on('typing', ({ ticketId, isTyping }) => {
      if (!ticketId) return;
      socket.to(`ticket:${ticketId}`).emit('typing', {
        role: socket.userRole,
        isTyping: !!isTyping
      });
    });
  });

  return io;
};

const getIO = () => io;

const broadcastToTicket = (ticketId, event, payload) => {
  if (!io) return;
  io.to(`ticket:${ticketId}`).emit(event, payload);
};

const broadcastToAgents = (event, payload, isDemo = false) => {
  if (!io) return;
  io.to(isDemo ? 'agents:demo' : 'agents:real').emit(event, payload);
};

const notifyUser = (userId, notification) => {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit('notification:new', notification);
};

module.exports = { initSocket, getIO, broadcastToTicket, broadcastToAgents, notifyUser };