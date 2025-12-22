import { Client } from "mysql/mod.ts";
// lee del archivo .env
import "std/dotenv/load.ts"; // deno_std/dotenv

const client = await new Client().connect({
  hostname: Deno.env.get("DB_HOST") ?? "127.0.0.1",
  username: Deno.env.get("DB_USER") ?? "root",
  password: Deno.env.get("DB_PASS") ?? "root",
  db: Deno.env.get("DB_NAME") ?? "eguzkilore_patients",
//   poolSize: 3, // optional
});

export default client;
