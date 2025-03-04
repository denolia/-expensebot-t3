import { Context } from "telegraf";
import { Message, Update } from "telegraf/typings/core/types/typegram";

export type TextContextType = Context<{
  message: Update.New & Update.NonChannel & Message.TextMessage;
  update_id: number;
}>;

export type PhotoContextType = Context<{
  message: Update.New & Update.NonChannel & Message.PhotoMessage;
  update_id: number;
}>;

export type ContextType = TextContextType | PhotoContextType;

export type Username = string;

export enum ModelName {
  GPT4_0 = "gpt-4o",
  GPT40_MINI = "gpt-4o-mini",
  DALLE_3 = "image (dall-e-3)",
}

export const ModelIds = {
  [ModelName.GPT40_MINI]: "gpt-4o-mini",
  [ModelName.GPT4_0]: "gpt-4o",
  [ModelName.DALLE_3]: "dall-e-3",
};
