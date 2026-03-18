import http from "node:http";
import { createApp } from "./app.js";
import { connectMongo } from "./shared/mongo.js";
import { env } from "./shared/env.js";

await connectMongo(env.MONGODB_URI);

const app = createApp();
const server = http.createServer(app);

server.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});

