import "dotenv/config";
import cors from 'cors';
import cookieParser from "cookie-parser";
import { database } from "./config/db.js";
import express from 'express';
import { createServer } from "http";
import logger from "./config/logger.js";
import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/supportSession.js";
import userRoutes from "./routes/user.js";
import teamRoutes from "./routes/team.js";
import { redis } from "./config/redis.js";
import { apiUrl } from "./utils/constants.js";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import { Server } from "socket.io";
import websocket from "./config/websocket.js";


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

app.get('/', (req, res) => {
  res.send('Welcome to Supportly API');
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);

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