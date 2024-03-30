import { Context } from "telegraf";
import { Message, Update } from "telegraf/typings/core/types/typegram";

export type ContextType =
  | Context<{
      message: Update.New & Update.NonChannel & Message.TextMessage;
      update_id: number;
    }>
  | Context<{
      message: Update.New & Update.NonChannel & Message.PhotoMessage;
      update_id: number;
    }>;

export type Username = string;

export enum ModelName {
  GPT3_5 = "gpt-3.5",
  GPT4 = "gpt-4-turbo",
  DALLE_3 = "image (dall-e-3)",
}

export const ModelIds = {
  [ModelName.GPT3_5]: "gpt-3.5-turbo",
  [ModelName.GPT4]: "gpt-4-1106-preview",
  [ModelName.DALLE_3]: "dall-e-3",
};
