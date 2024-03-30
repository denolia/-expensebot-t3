import "dotenv/config";
import { ChatCompletionMessageParam } from "openai/resources";

import { Markup, Telegraf, Context, Telegram } from "telegraf";
import { message } from "telegraf/filters";
import { OpenAI } from "openai";

import fs from "fs";

import { Message, Update } from "telegraf/typings/core/types/typegram";

type ContextType =
  | Context<{
      message: Update.New & Update.NonChannel & Message.TextMessage;
      update_id: number;
    }>
  | Context<{
      message: Update.New & Update.NonChannel & Message.PhotoMessage;
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

enum ModelName {
  GPT3_5 = "gpt-3.5",
  GPT4 = "gpt-4-turbo",
  DALLE_3 = "image (dall-e-3)",
}

const ModelIds = {
  [ModelName.GPT3_5]: "gpt-3.5-turbo",
  [ModelName.GPT4]: "gpt-4-1106-preview",
  [ModelName.DALLE_3]: "dall-e-3",
};

// map username -> selected model
const currentModels: Record<Username, ModelName | undefined> = {};

function checkUser(ctx: ContextType) {
  let registeredUsers: string[] = [];

  if (fs.existsSync(REGISTERED_USERS_FILE)) {
    const data = fs.readFileSync(REGISTERED_USERS_FILE, "utf8");
    registeredUsers = JSON.parse(data).users;
  } else {
    console.error("Cannot find registered-users.json file");
    return {
      notRegisteredReply: ctx.reply(
        `🤯 ${ctx.update.message.from.first_name}, cannot check if you are registered`,
      ),
      registered: false,
    };
  }
  const username = ctx.update.message.from.username;

  if (!username || !registeredUsers.includes(username)) {
    console.log(`User ${username} is not registered`);
    return {
      notRegisteredReply: ctx.reply(
        `👿 ${ctx.update.message.from.first_name}, you are not registered`,
      ),
      registered: false,
    };
  }
  return { notRegisteredReply: null, registered: true, username };
}

// bot commands
bot.start((ctx: ContextType) => {
  const { notRegisteredReply, registered } = checkUser(ctx);
  if (!registered && notRegisteredReply) {
    return notRegisteredReply;
  }
  return ctx.reply(`Meowello 😺 ${ctx.update.message.from.first_name}!`);
});

bot.command("newchat", (ctx: ContextType) => {
  const { notRegisteredReply, registered, username } = checkUser(ctx);
  if (!registered && notRegisteredReply) {
    return notRegisteredReply;
  }
  if (username && messages[username]) {
    messages[username].length = 0;
  }
  console.log("New chat created for", username);
  return ctx.reply(`Meow! 🐈 New chat created!`);
});

bot.command("setmodel", (ctx: ContextType) => {
  const { notRegisteredReply, registered } = checkUser(ctx);
  if (!registered && notRegisteredReply) {
    return notRegisteredReply;
  }
  return ctx.reply(
    "Meow! 😸 Select the model",
    Markup.keyboard(
      Object.keys(ModelIds).map((model) => Markup.button.text(model)),
    )
      .oneTime(true)
      .resize(),
  );
});

bot.hears(Object.keys(ModelIds), (ctx) => {
  const { notRegisteredReply, registered, username } = checkUser(ctx);
  if (!registered && notRegisteredReply) {
    return notRegisteredReply;
  }

  if (!username) {
    return ctx.reply("😾 Who are you?!");
  }

  if (username && messages[username]) {
    messages[username].length = 0;
  }

  currentModels[username] = ctx.message.text as ModelName;
  return ctx.reply(`Meow! 😸 Selected model: ${currentModels[username]}`);
});

// receive plain text message
bot.on(message("text"), async (ctx) => {
  const { notRegisteredReply, registered, username } = checkUser(ctx);
  if (!registered && notRegisteredReply) {
    return notRegisteredReply;
  }

  if (!username) {
    console.error("Cannot find username", ctx.message.from);
    return ctx.reply("😾 Who are you?!");
  }

  const selectedUserModel = currentModels[username] ?? ModelName.GPT3_5;

  console.log("Got a message from:", username, "model:", selectedUserModel);

  const requestMessage: ChatCompletionMessageParam = {
    role: "user",
    content: ctx.message.text,
  };

  if (!messages[username]) {
    messages[username] = [];
  }

  messages[username].push(requestMessage);

  const tgMessage = await ctx.reply("🐈🤔‍Mrrrrrrr...", {
    reply_to_message_id: ctx.message.message_id,
  });
  const tgMessageId = tgMessage.message_id;

  if (selectedUserModel === ModelName.DALLE_3) {
    try {
      // Generate image from prompt
      const response = await openai.images.generate({
        model: ModelIds[ModelName.DALLE_3],
        prompt: ctx.message.text,
        n: 1, // number of images, it supports rn only 1 anyway
        size: "1024x1024",
      });
      // no usage info in dalle-3 response
      // console.log("Usage:");

      const image_url = response?.data[0]?.url;

      if (image_url) {
        await ctx.replyWithPhoto(image_url, {
          reply_to_message_id: ctx.message.message_id,
        });
        await ctx.telegram.deleteMessage(ctx.chat.id, tgMessageId);
        console.log("Responded with an image to", username);
      } else {
        await ctx.editMessageText("Meow! 😿 I cannot generate an image");
        console.log("Could not generate an image response to", username);
      }
    } catch (e: any) {
      console.error("Error generating image:", e);
      await ctx.editMessageText("Meow! 😿 An error happened:\n" + e.message);
    }
  } else {
    // text reply
    try {
      const completion = await openai.chat.completions.create({
        model: ModelIds[selectedUserModel],
        messages: messages[username],
      });
      console.log("Usage:", completion.usage);

      const responseMessage = completion.choices[0].message;
      if (responseMessage) {
        if (!messages[username]) {
          messages[username] = [];
        }

        messages[username].push({
          role: responseMessage.role,
          content: responseMessage.content,
        });
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          tgMessageId,
          undefined,
          responseMessage.content ?? "-",
        );
        console.log("Responded to", username);
      } else {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          tgMessageId,
          undefined,
          "Meow! 😿 I cannot generate a response",
        );
        console.log("Could not generate a response to", username);
      }
    } catch (e: any) {
      console.error("Error generating response:", e);
      await ctx.editMessageText("Meow! 😿 An error happened:\n" + e.message);
    }
  }
});

bot.on(message("photo"), async (ctx) => {
  const { notRegisteredReply, registered, username } = checkUser(ctx);
  if (!registered && notRegisteredReply) {
    return notRegisteredReply;
  }

  if (!username) {
    console.error("Cannot find username", ctx.message.from);
    return ctx.reply("😾 Who are you?!");
  }

  console.log("Got a photo from:", username);

  const tgMessage = await ctx.reply("🐈🤔‍Mrrrrrrr...", {
    reply_to_message_id: ctx.message.message_id,
  });
  const tgMessageId = tgMessage.message_id;

  let photoId;
  if (ctx.message.photo) {
    const photo = ctx.message.photo.pop();
    photoId = photo?.file_id; // get the photo file_id
  }

  if (photoId) {
    try {
      const link = await ctx.telegram.getFileLink(photoId); // get the photo URL
      const text = ctx.message.caption ?? "Describe this image";

      if (link.href) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text },
                {
                  type: "image_url",
                  image_url: {
                    url: link.href,
                    detail: "high",
                  },
                },
              ],
            },
          ],
        });

        console.log("Usage:", completion.usage);

        const responseMessage = completion.choices[0].message;
        if (responseMessage) {
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            tgMessageId,
            undefined,
            responseMessage.content ?? "-",
          );
          console.log("Responded to", username);
        } else {
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            tgMessageId,
            undefined,
            "Meow! 😿 I cannot generate a response",
          );
          console.log("Could not generate a response to", username);
        }
      } else {
        // todo reply could not get url
        console.log("Could not get photo url");
        await ctx.editMessageText("Meow! 😿 could not get photo url:");
      }
    } catch (e: any) {
      console.log("Error in getting photo or generating response:", e);
      await ctx.editMessageText("Meow! 😿 An error happened:\n" + e.message);
    }
  }
});

bot.launch().then();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
