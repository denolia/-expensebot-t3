# Chat GPT bot
Telegram bot providing access to Ghat GPT.

### How to run

1. Install dependencies `yarn` or `npm install`
1. Provide BOT_TOKEN as an env variable. How to get the token: https://core.telegram.org/bots/tutorial#obtain-your-bot-token
    ```
    export BOT_TOKEN=1111aaaa1111
    ```
1. Provide OPENAI_API_KEY. You can get or create the OpenAI api key here: https://platform.openai.com/account/api-keys
    ```
    export OPENAI_API_KEY=1111aaaa1111
    ```
1. Build and run the app
    ```
    tsc -p . && node dist/app.js
    ```

### Stack

- Typescript
- [telegraf](https://github.com/telegraf/telegraf)
- [openai](https://github.com/openai/openai-node)
