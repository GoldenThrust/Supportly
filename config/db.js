import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import logger from './logger.js';

class Database {
    constructor({ dialect = "mongodb", name = "supportly", user = "", password = "", host = "localhost", port = 27017, url = '', appname = "" } = {}) {
        this.dialect = dialect;
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
            logger.info(`Connecting to ${this.dialect} at ${this.url ? this.url : `${this.host}:${this.port}/${this.name}`}`);
            if (this.dialect === 'mongodb') {
                await this.connectMongoDB();
            } else if (this.dialect === 'postgresql') {
                await this.connectPostgreSQL();
            } else {
                throw new Error(`Unsupported database dialect: ${this.dialect}`);
            }

            logger.info(`Connected to ${this.dialect} database: ${this.name}`);
        } catch (error) {
            logger.error(`Error connecting to ${this.dialect} database:`, error);
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

    async connectPostgreSQL() {
        this.model = new Sequelize(this.url ? this.url : this.name, this.user, this.password, {
            host: this.host,
            port: this.port,
            dialect: this.dialect,
            logging: msg => logger.debug(msg),
        });

        await this.model.authenticate();
        await this.model.sync();
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
    dialect: process.env.DB_DIALECT || 'postgresql',
    name: process.env.DB_NAME || 'supportly',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    appname: process.env.DB_APPNAME || 'SupportlyApp'
});

export default Database;
