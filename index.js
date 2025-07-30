import "dotenv/config";
import cors from 'cors';
import cookieParser from "cookie-parser";
import express from 'express';
import { createServer } from "http";
import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/supportSession.js";
import userRoutes from "./routes/user.js";
import teamRoutes from "./routes/team.js";
import database from "./config/db.js";
import redis from "./config/redis.js";
import { apiUrl } from "./utils/constants.js";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import { Server } from "socket.io";
import websocket from "./services/websocket.js";
import { authenticate, verifyToken } from "./middlewares/tokenManager.js";
import { COOKIE_NAME } from "./utils/constants.js";
import path from 'path';
import { fileURLToPath } from 'url';
import logger from "./services/logger.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = process.env.PORT || 3000;
const server = createServer(app);

var whitelist = [...process.env.CORS_ORIGIN.split(','), `http://localhost:${PORT}`, apiUrl]
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      logger.warn(`Cors: Origin ${origin} not allowed by Cors`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(cors(corsOptions));

// Serve static files from build/client
app.use(express.static(path.join(__dirname, 'build/client')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);


// Function to check if route needs authentication
function isProtectedRoute(path) {
  const protectedPaths = [
    '/dashboard',
    '/profile', 
    '/book-session',
    '/booking-confirmation',
    '/video-call',
    '/logout'
  ];
  
  return protectedPaths.some(protectedPath => {
    return path === protectedPath || path.startsWith(protectedPath + '/');
  });
}

// Function to check if route is public auth route
function isAuthRoute(path) {
  const authPaths = ['/auth/login', '/auth/signup', '/auth/forgot-password'];
  return authPaths.includes(path) || path.startsWith('/auth/');
}

// Handle home route with auth redirect
app.get('/', (req, res) => {
  const token = req.signedCookies[COOKIE_NAME];
  if (token && verifyToken(token)) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'build/client/index.html'));
});

// Catch-all handler for React Router
app.get(/(.*)/, (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API route not found' });
  }

  const token = req.signedCookies[COOKIE_NAME];
  const isAuthenticated = token && verifyToken(token);
  
  // If trying to access protected route without auth, redirect to login
  if (isProtectedRoute(req.path) && !isAuthenticated) {
    return res.redirect('/auth/login');
  }
  
  // If trying to access auth routes while authenticated, redirect to dashboard
  if (isAuthRoute(req.path) && isAuthenticated) {
    return res.redirect('/dashboard');
  }
  
  // Serve the React app
  res.sendFile(path.join(__dirname, 'build/client/index.html'));
});

function gracefulShutdown() {
  try {
    database.close()
    logger.warn('Database connection closed');
    process.exit(0);
  } catch (err) {
    logger.error('Error closing database connection:', err);
    process.exit(1);
  }
}


process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

server.listen(PORT, async () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
  const io = new Server(server, {
    adapter: createAdapter(redis.client),
    cors: {
      origin: whitelist,
      credentials: true
    },
  });

  await redis.connect();
  await database.connect();
  await websocket.connect(io);
  logger.info('Server ready');
});