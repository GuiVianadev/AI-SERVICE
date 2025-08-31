import postgres from "postgres";
import { env } from "../env";
import { drizzle} from "drizzle-orm/postgres-js"


const client = postgres(env.DATABASE_URL)
export const db = drizzle(client)