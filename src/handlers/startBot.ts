import { checkUser } from "../checkUser";
import { ContextType } from "../types";

export function startBot() {
  return (ctx: ContextType) => {
    const { notRegisteredReply, registered } = checkUser(ctx);
    if (!registered && notRegisteredReply) {
      return notRegisteredReply;
    }
    return ctx.reply(`Meowello 😺 ${ctx.update.message.from.first_name}!`);
  };
}
