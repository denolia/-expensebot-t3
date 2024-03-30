import { ChatCompletionMessageParam } from "openai/resources";
import { checkUser } from "../checkUser";
import { ContextType, Username } from "../types";

export function createNewChat(
  userContext: Record<Username, ChatCompletionMessageParam[]>,
) {
  return (ctx: ContextType) => {
    const { notRegisteredReply, registered, username } = checkUser(ctx);
    if (!registered && notRegisteredReply) {
      return notRegisteredReply;
    }
    if (username && userContext[username]) {
      userContext[username].length = 0;
    }
    console.log("New chat created for", username);
    return ctx.reply(`Meow! 🐈 New chat created!`);
  };
}
