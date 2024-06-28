"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hapi_1 = __importDefault(require("@hapi/hapi"));
const siwe_1 = require("siwe");
let temporaryStorage = {};
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    const server = hapi_1.default.server({
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
        handler: (request, h) => {
            if (temporaryStorage.address && temporaryStorage.chainId) {
                return {
                    address: temporaryStorage.address,
                    chainId: temporaryStorage.chainId,
                };
            }
            else {
                return null;
            }
        },
    });
    server.route({
        method: "DELETE",
        path: "/api/session",
        handler: (request, h) => {
            temporaryStorage = {};
            return { message: "Stored data cleared successfully" };
        },
    });
    server.route({
        method: "POST",
        path: "/api/verify",
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            const { message, signature, address, chainId } = request.payload;
            const siweMessage = new siwe_1.SiweMessage(message);
            try {
                yield siweMessage.verify({ signature });
                temporaryStorage = { address, chainId };
                return { success: true };
            }
            catch (_a) {
                return { success: false };
            }
        }),
    });
    server.route({
        method: "GET",
        path: "/api/nonce",
        handler: (request, h) => {
            const nonce = (0, siwe_1.generateNonce)();
            return { nonce };
        },
    });
    yield server.start();
    console.log("Server running on %s", server.info.uri);
});
process.on("unhandledRejection", (err) => {
    console.log(err);
    process.exit(1);
});
init();
