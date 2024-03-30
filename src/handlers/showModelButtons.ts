import { Markup } from "telegraf";
import { checkUser } from "../checkUser";
import { ContextType, ModelIds } from "../types";

export function showModelButtons() {
  return (ctx: ContextType) => {
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
  };
}
