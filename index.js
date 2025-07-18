import "dotenv/config";
import { database } from "./config/db.js";

function gracefulShutdown() {
     try {
      database.close()
      console.log('Database connection closed');
      process.exit(0);
    } catch (err) {
      console.error('Error closing database connection:', err);
      process.exit(1);
    }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

database.connect();