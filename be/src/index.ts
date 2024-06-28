"use strict";

import Hapi from "@hapi/hapi";
import { generateNonce, SiweMessage } from "siwe";

let temporaryStorage: { address?: string; chainId?: number } = {};

const init = async () => {
  const server = Hapi.server({
    port: 8000,
    host: "localhost",
    routes: {
      cors: {
        origin: ["*"],
        headers: ["Accept", "Content-Type"],
        exposedHeaders: ["WWW-Authenticate", "Server-Authorization"],
        additionalExposedHeaders: ["x-custom-header"],
        maxAge: 60,
        credentials: true,
      },
    },
  });

  server.route({
    method: "GET",
    path: "/",
    handler: (request, h) => {
      return "Hello World!";
    },
  });

  server.route({
    method: "GET",
    path: "/api/session",
    handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
      if (temporaryStorage.address && temporaryStorage.chainId) {
        return {
          address: temporaryStorage.address,
          chainId: temporaryStorage.chainId,
        };
      } else {
        return null;
      }
    },
  });

  server.route({
    method: "DELETE",
    path: "/api/session",
    handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
      temporaryStorage = {};
      return { message: "Stored data cleared successfully" };
    },
  });

  server.route({
    method: "POST",
    path: "/api/verify",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
      const { message, signature, address, chainId } = request.payload as {
        message: string;
        signature: string;
        address: string;
        chainId: number;
      };
      const siweMessage = new SiweMessage(message);
      try {
        await siweMessage.verify({ signature });
        temporaryStorage = { address, chainId };

        return { success: true };
      } catch {
        return { success: false };
      }
    },
  });

  server.route({
    method: "GET",
    path: "/api/nonce",
    handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
      const nonce = generateNonce();
      return { nonce };
    },
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
