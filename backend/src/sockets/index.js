const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // Authenticate every socket connection using the same JWT used for REST auth
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userIsDemo = !!decoded.isDemo;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Personal room — used for notifications & cross-tab updates
    socket.join(`user:${socket.userId}`);

    // Agents join a room scoped to their own demo/real world, so a fresh
    // ticket broadcast never reaches an agent on the wrong side of the
    // demo/real boundary.
    if (socket.userRole === 'agent') {
      socket.join(socket.userIsDemo ? 'agents:demo' : 'agents:real');
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

// Broadcasts an event + payload to everyone currently viewing a ticket
const broadcastToTicket = (ticketId, event, payload) => {
  if (!io) return;
  io.to(`ticket:${ticketId}`).emit(event, payload);
};

// Broadcasts an event + payload to every connected agent (e.g. a fresh ticket landing).
// isDemo picks which world's agents receive it — pass the ticket's own isDemo flag.
const broadcastToAgents = (event, payload, isDemo = false) => {
  if (!io) return;
  io.to(isDemo ? 'agents:demo' : 'agents:real').emit(event, payload);
};

// Pushes an already-created notification document live to the target user, if online
const notifyUser = (userId, notification) => {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit('notification:new', notification);
};

module.exports = { initSocket, getIO, broadcastToTicket, broadcastToAgents, notifyUser };