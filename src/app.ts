import 'dotenv/config'

import { Telegraf } from "telegraf";

const bot_token = process.env.BOT_TOKEN;

if (!bot_token) {
    throw new Error('BOT_TOKEN must be provided!');
}
const bot = new Telegraf(bot_token);
console.log(bot)