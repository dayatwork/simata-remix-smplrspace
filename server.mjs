/* eslint-disable no-undef */
import { createRequestHandler } from "@remix-run/express";
import express from "express";
import mqtt from "mqtt";
import { PrismaClient } from "@prisma/client";

import { uploadDeviceLocation } from "./custom-server/feature.mjs";

export const prisma = new PrismaClient();

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? null
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const app = express();
app.use(
  viteDevServer ? viteDevServer.middlewares : express.static("build/client")
);

const build = viteDevServer
  ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
  : await import("./build/server/index.js");

app.all("*", createRequestHandler({ build }));

const client = mqtt.connect(process.env.VITE_MQTT_URL, {
  port: +process.env.VITE_MQTT_PORT,
  username: process.env.VITE_MQTT_USERNAME || "",
  password: process.env.VITE_MQTT_PASSWORD || "",
});

client.on("connect", () => {
  client.subscribe("sensor-data");
});

client.on("message", (topic, message) => {
  if (message && topic === "sensor-data") {
    const messageObj = JSON.parse(message);

    if (messageObj.apiKey !== process.env.MQTT_API_KEY) return;

    if (messageObj.roomCode && messageObj.deviceCode) {
      uploadDeviceLocation(client, {
        deviceCode: messageObj.deviceCode,
        roomCode: messageObj.roomCode,
      });
    }
  }
});

console.log({ env: process.env });

app.listen(3000, () => {
  console.log("App listening on http://localhost:3000");
});
