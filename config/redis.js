import { createClient } from "redis";
import logger from "./logger.js";

class RedisClient {
    constructor() {
        this.client = createClient(process.env.REDIS_URL || "redis://localhost:6379");

        this.client;
    }

    async connect() {
        try {
            logger.info('Connecting to redis....')
            this.client = await this.client.on("error", (err) => {
                logger.error("Redis failed to connect:", err);
            }).connect();
            logger.info("Successfully connected to Redis!");
        } catch (err) {
            logger.error("Redis failed to connect:", err);
        }
    }

    set(key, value, exp) {
        return this.client.SETEX(key, exp, value);
    }

    get(key) {
        return this.client.GET(key);
    }

    del(key) {
        return this.client.DEL(key);
    }

    hset(key, field, value) {
        this.client.HSET(key, field, value);
    }

    hget(key, field) {
        return this.client.HGET(key, field);
    }

    hdel(key, field) {
        return this.client.HDEL(key, field);
    }

    async setArray(key, value, exp) {
        const cache = await this.get(key);

        if (!cache) {
            this.set(key, JSON.stringify([value]), exp);
        } else {
            const parse = JSON.parse(cache);
            parse.push(value);
            this.set(key, JSON.stringify(parse), exp);
        }
    }

    async getArray(key) {
        const cache = await this.get(key);

        return JSON.parse(cache);
    }

    async delArray(key, value) {
        let arr = await this.getArray(key);

        if (!arr || arr.length < 1) {
            await this.del(key);
            return;
        }

        arr = arr.filter(x => {
            return x !== value
        });


        await this.set(key, JSON.stringify(arr), 24 * 60 * 60)
    }

    hgetall(key) {
        return this.client.HGETALL(key);
    }
}

export const redis = new RedisClient();