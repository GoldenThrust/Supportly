import mongoose from 'mongoose';
import logger from '../services/logger.js';

class Database {
    constructor({ name = "supportly", user = "", password = "", host = "localhost", port = 27017, url = '', appname = "" } = {}) {
        this.name = name;
        this.user = user;
        this.password = password;
        this.host = host;
        this.port = port;
        this.url = url
        this.appname = appname;
        this.model = null;
    }

    async connect() {
        try {
            logger.info(`Connecting to mongodb at ${this.url ? this.url : `${this.host}:${this.port}/${this.name}`}`);
            const uri = this.url ? this.url : `mongodb://${this.user}${this.password ? `:${this.password}@` : ''}${this.host}:${this.port}/${this.name}`;

            this.model = await mongoose.connect(uri, {
                ...(this.appname ? { appname: this.appname } : {}),
                dbName: this.name,
            });

            mongoose.connection.on('error', err => {
                logger.error(err);
            });

            logger.info(`Connected to mongo database: ${this.name}`);
        } catch (error) {
            logger.error(`Error connecting to mongo database:`, error);
            throw error;
        }
    }

    async connectMongoDB() {
        const uri = this.url ? this.url : `mongodb://${this.user}${this.password ? `:${this.password}@` : ''}${this.host}:${this.port}/${this.name}`;

        this.model = await mongoose.connect(uri, {
            ...(this.appname ? { appname: this.appname } : {}),
            dbName: this.name,
        });

        mongoose.connection.on('error', err => {
            logger.error(err);
        });
    }

    async close() {
        if (this.dialect !== 'mongodb') {
            this.model.close();
        } else {
            await mongoose.disconnect()
        }
    }
}

export const database = new Database({
    dialect: process.env.DB_DIALECT || 'mongodb',
    name: process.env.DB_NAME || 'supportly',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 27017,
    appname: process.env.DB_APPNAME || 'SupportlyApp',
    url: process.env.DB_URL || '',
});

export default Database;
