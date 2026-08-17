import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";
import * as schema from "./schema.js";

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, {
  schema,
  logger: {
    logQuery(query, params) {
      logger.debug({ query, params }, "drizzle query");
    },
  },
});
