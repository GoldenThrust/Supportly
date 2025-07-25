import "dotenv/config";
import { database } from "./config/db.js";
import express from 'express';
import { createServer } from "http";
import logger from "./config/logger.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 3000;
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Welcome to Supportly API');
});

app.use('/api/auth', authRoutes);

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
  await database.connect();
  logger.info('Server ready');
});