import { drizzle } from "drizzle-orm/d1";
import { env } from "../lib/local-env";
import * as schema from "./schema";

export function getDb() {
  return drizzle(env.DB, { schema });
}
