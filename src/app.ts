import "dotenv/config";
import { ChatCompletionMessageParam } from "openai/resources";

import { Markup, Telegraf, Context, Telegram } from "telegraf";
import { message } from "telegraf/filters";
import { OpenAI } from "openai";

import fs from "fs";

import { Message, Update } from "telegraf/typings/core/types/typegram";

type ContextType = Context<{
  message: Update.New & Update.NonChannel & Message.TextMessage;
  update_id: number;
}>;

const REGISTERED_USERS_FILE = "./registered-users.json";

if (!fs.existsSync(REGISTERED_USERS_FILE)) {
  throw new Error("Please provide a registered-users.json file");
}

const bot_token = process.env.BOT_TOKEN;
if (!bot_token) {
  throw new Error("BOT_TOKEN must be provided!");
}

const openAiApiKey = process.env.OPENAI_API_KEY;
if (!openAiApiKey) {
  throw new Error("OPENAI_API_KEY must be provided!");
}

const openai = new OpenAI({
  apiKey: openAiApiKey,
});

type Username = string;
const messages: Record<Username, ChatCompletionMessageParam[]> = {};

const bot = new Telegraf(bot_token);
console.log("Starting the bot...", Boolean(bot));

const MODELS = {
  "gpt-3.5": "gpt-3.5-turbo",
  "gpt-4": "gpt-4",
  "gpt-4-turbo": "gpt-4-1106-preview",
};

let currentModel = Object.keys(MODELS)[0] as keyof typeof MODELS;

function checkUser(ctx: ContextType) {
  let registeredUsers: string[] = [];

  if (fs.existsSync(REGISTERED_USERS_FILE)) {
    const data = fs.readFileSync(REGISTERED_USERS_FILE, "utf8");
    registeredUsers = JSON.parse(data).users;
  } else {
    return {
      notRegisteredReply: ctx.reply(
        `Sorry ${ctx.update.message.from.first_name}, cannot check if you are registered`,
      ),
      registered: false,
    };
  }
  const username = ctx.update.message.from.username;

  if (!username || !registeredUsers.includes(username)) {
    return {
      notRegisteredReply: ctx.reply(
        `Sorry ${ctx.update.message.from.first_name}, you are not registered`,
      ),
      registered: false,
    };
  }
  return { notRegisteredReply: null, registered: true, username };
}

bot.start((ctx: ContextType) => {
  const { notRegisteredReply, registered } = checkUser(ctx);
  if (!registered && notRegisteredReply) {
    return notRegisteredReply;
  }
  return ctx.reply(`Hello ${ctx.update.message.from.first_name}!`);
});

bot.command("newchat", (ctx: ContextType) => {
  const { notRegisteredReply, registered, username } = checkUser(ctx);
  if (!registered && notRegisteredReply) {
    return notRegisteredReply;
  }
  if (username && messages[username]) {
    messages[username].length = 0;
  }
  return ctx.reply(`New chat created!`);
});

bot.command("setmodel", (ctx: ContextType) => {
  const { notRegisteredReply, registered } = checkUser(ctx);
  if (!registered && notRegisteredReply) {
    return notRegisteredReply;
  }
  return ctx.reply(
    "Select the model",
    Markup.keyboard(
      Object.keys(MODELS).map((model) => Markup.button.text(model)),
    )
      .oneTime(true)
      .resize(),
  );
});

bot.hears(Object.keys(MODELS), (ctx) => {
  const { notRegisteredReply, registered, username } = checkUser(ctx);
  if (!registered && notRegisteredReply) {
    return notRegisteredReply;
  }
  if (username && messages[username]) {
    messages[username].length = 0;
  }
  currentModel = ctx.message.text as keyof typeof MODELS;
  return ctx.reply(`Selected model: ${currentModel}`);
});

bot.on(message("text"), async (ctx) => {
  const { notRegisteredReply, registered, username } = checkUser(ctx);
  if (!registered && notRegisteredReply) {
    return notRegisteredReply;
  }

  if (!username) {
    return ctx.reply(`Sorry, I cannot find your username`);
  }

  const requestMessage: ChatCompletionMessageParam = {
    role: "user",
    content: ctx.message.text,
  };

  if (!messages[username]) {
    messages[username] = [];
  }

  messages[username].push(requestMessage);

  const completion = await openai.chat.completions.create({
    model: MODELS[currentModel],
    messages: messages[username],
  });

  const responseMessage = completion.choices[0].message;
  if (responseMessage) {
    if (!messages[username]) {
      messages[username] = [];
    }

    messages[username].push({
      role: responseMessage.role,
      content: responseMessage.content,
    });
    await ctx.sendMessage(responseMessage.content ?? "-");
  }
});

bot.launch().then();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
