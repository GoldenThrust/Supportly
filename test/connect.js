import "dotenv/config";
import redis from "../config/redis.js";
import database from "../config/db.js";

export default async function connect() {
  await redis.connect();
  await database.connect();
}