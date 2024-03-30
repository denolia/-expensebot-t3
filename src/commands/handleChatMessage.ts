import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { checkUser } from "../checkUser";
import { ModelIds, ModelName, Username } from "../types";

export function handleChatMessage(
  openai: OpenAI,
  userContext: Record<Username, ChatCompletionMessageParam[]>,
  currentModels: Record<Username, ModelName | undefined>,
) {
  return async (ctx: any) => {
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

    if (!userContext[username]) {
      userContext[username] = [];
    }

    userContext[username].push(requestMessage);

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
          messages: userContext[username],
        });
        console.log("Usage:", completion.usage);

        const responseMessage = completion.choices[0].message;
        if (responseMessage) {
          if (!userContext[username]) {
            userContext[username] = [];
          }

          userContext[username].push({
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
  };
}
