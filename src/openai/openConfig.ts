const { OpenAI } = require('openai');
import { HttpsProxyAgent } from 'https-proxy-agent'
import { OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_PROXY_URL } from '../env/env'

// 创建一个代理Agent
const proxyAgent = OPENAI_PROXY_URL ? new HttpsProxyAgent(OPENAI_PROXY_URL) : undefined

export const openai = new OpenAI({
    baseURL: OPENAI_BASE_URL,
    apiKey: OPENAI_API_KEY,
    httpAgent: proxyAgent,
    timeout: 20 * 1000,
})

export const openaiShort = new OpenAI({
    baseURL: OPENAI_BASE_URL,
    apiKey: OPENAI_API_KEY,
    httpAgent: proxyAgent,
    timeout: 3 * 1000,
})
