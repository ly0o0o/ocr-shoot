"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiShort = exports.openai = void 0;
const openai_1 = __importDefault(require("openai"));
const https_proxy_agent_1 = require("https-proxy-agent");
const env_1 = require("../env/env");
// 创建一个代理Agent
const proxyAgent = env_1.OPENAI_PROXY_URL ? new https_proxy_agent_1.HttpsProxyAgent(env_1.OPENAI_PROXY_URL) : undefined;
exports.openai = new openai_1.default({
    baseURL: "https://aihubmix.com/v1",
    apiKey: "sk-IqgKaL97MVe3bdDS09F952C6264c4f349c665834C9E1C678",
    httpAgent: proxyAgent,
    timeout: 20 * 1000,
});
exports.openaiShort = new openai_1.default({
    baseURL: env_1.OPENAI_BASE_URL,
    apiKey: "sk-IqgKaL97MVe3bdDS09F952C6264c4f349c665834C9E1C678",
    httpAgent: proxyAgent,
    timeout: 3 * 1000,
});
