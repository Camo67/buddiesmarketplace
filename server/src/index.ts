import { buildServer } from "./app";
import { getServerEnv } from "./config/env";

async function start() {
  const env = getServerEnv();
  const app = await buildServer();

  try {
    await app.listen({
      host: env.apiHost,
      port: env.apiPort,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
