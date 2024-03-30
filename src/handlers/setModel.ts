import { ChatCompletionMessageParam } from "openai/resources";
import { checkUser } from "../checkUser";
import { ModelName, TextContextType, Username } from "../types";

export function commandSetModel(
  userContext: Record<Username, ChatCompletionMessageParam[]>,
  currentModels: Record<Username, ModelName | undefined>,
) {
  return (ctx: TextContextType) => {
    const { notRegisteredReply, registered, username } = checkUser(ctx);
    if (!registered && notRegisteredReply) {
      return notRegisteredReply;
    }

    if (!username) {
      return ctx.reply("😾 Who are you?!");
    }

    if (username && userContext[username]) {
      userContext[username].length = 0;
    }

    currentModels[username] = ctx.message.text as ModelName;
    return ctx.reply(`Meow! 😸 Selected model: ${currentModels[username]}`);
  };
}
