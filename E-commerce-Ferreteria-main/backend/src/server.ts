import { createRepository } from './config/repository.js';
import { createApp } from './app.js';
import { env } from './config/env.js';
const repo = await createRepository();
createApp(repo).listen(env.port, () =>
  console.log(`FerreMax API · http://localhost:${env.port} · ${env.driver}`),
);
