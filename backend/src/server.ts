import "dotenv/config";
import { buildApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const HOST = "0.0.0.0";

async function start() {
  await prisma.$connect();
  console.log("Connected to PostgreSQL");

  const app = buildApp();

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
