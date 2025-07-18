import Database from "./config/db.js";

const database = new Database({dialect: 'postgresql', name: 'supportly', user: 'postgres', password: 'root', host: 'localhost', port: 5432, appname: 'SupportlyApp'});

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