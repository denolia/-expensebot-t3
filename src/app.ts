import 'dotenv/config'
import { ChatCompletionMessageParam } from "openai/resources";

import { Markup, Telegraf } from "telegraf";
import {message} from "telegraf/filters"

import { OpenAI } from 'openai';

const bot_token = process.env.BOT_TOKEN;
if (!bot_token) {
    throw new Error('BOT_TOKEN must be provided!');
}

const openAiApiKey = process.env.OPENAI_API_KEY
if (!openAiApiKey) {
    throw new Error('OPENAI_API_KEY must be provided!');
}

const openai = new OpenAI({
    apiKey: openAiApiKey,
});

const messages:  ChatCompletionMessageParam[] = [];

const bot = new Telegraf(bot_token);
console.log(bot)

const MODELS = [
    'gpt-3.5-turbo',
    'gpt-4',
]

let currentModel = MODELS[0];

bot.start(ctx => {
    return ctx.reply(`Hello ${ctx.update.message.from.first_name}!`);
});

bot.command('newchat', ctx => {
    messages.length = 0;
    return ctx.reply(`New chat created!`);
})

bot.command('setmodel', ctx => {
    return ctx.reply(
      "Select the model",
      Markup.keyboard(
        MODELS.map(model => Markup.button.text(model)),
        ).oneTime(true).resize(),
    )
})

for (const _model of MODELS) {
    bot.hears(MODELS, ctx => {
        messages.length = 0;
        currentModel = ctx.message.text;
        return ctx.reply(`Selected model: ${currentModel}`);
    })
}

bot.on(message("text"), async ctx => {

    const requestMessage: ChatCompletionMessageParam = {
        role: 'user',
        content: ctx.message.text,
    };
    messages.push(requestMessage);

    // Call OpenAI API to generate response
    const completion = await openai.chat.completions.create({
        model: currentModel,
        messages: messages,
    });

    // Display response message
    const responseMessage = completion.choices[0].message;
    if (responseMessage) {
        // console.log((responseMessage.content));
        messages.push({
            role: responseMessage.role,
            content: responseMessage.content,
        });
        await ctx.sendMessage(responseMessage.content ?? "-");

    }

});

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))