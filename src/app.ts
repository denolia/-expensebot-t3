import 'dotenv/config'

import {Telegraf} from "telegraf";
import {message} from "telegraf/filters"

import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai';

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const messages: ChatCompletionRequestMessage[] = [];
const bot_token = process.env.BOT_TOKEN;

if (!bot_token) {
    throw new Error('BOT_TOKEN must be provided!');
}
const bot = new Telegraf(bot_token);
console.log(bot)

bot.start(ctx => {
    return ctx.reply(`Hello ${ctx.update.message.from.first_name}!`);
});

bot.on(message("text"), async ctx => {

    const requestMessage: ChatCompletionRequestMessage = {
        role: 'user',
        content: ctx.message.text,
    };
    messages.push(requestMessage);

    // Call OpenAI API to generate response
    const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: messages,
    });
    console.log("completion", completion)

    // Display response message to user
    const responseMessage = completion.data.choices[0].message;
    if (responseMessage) {
        console.log((responseMessage.content));
        messages.push({
            role: responseMessage.role,
            content: responseMessage.content,
        });
        await ctx.sendMessage(responseMessage.content ?? "-");

    }

});

bot.launch()