## Intro

The purpose of this project is to make integration between two messaging services: Telegram and Mattermost.
Mattermost is designed as an internal chat for organisations and companies as a open source alternative to Slack, where Telegram is very popular messaging platform for private use. Integration Mattermost with Telegram can allow access huge Telegram audience from company perspective: create channels for company feeds, news. At the other end Telegram users can reach company technical support, create developers community, ect. Both messaging services can utilize best platform features.


## Telegram

Let's create telegram group where group members can send and receive messages to/from Mattermost. In order to
communicate outside Telegram 'world' there is a need to create a Bot which should be a member (with admin rights) to
that group. Then Bot with admin rights will have technical details to send and received all messages created by all
members in that group.

### Create a bot

- [Create telegram account:](https://telegram.org)
- Serach for `@BotFather`: to get API access 'token'.
- Set commands:
    1. `/newbot` - answer all questions until it will create bot with your specified name and generate secret token.
    2. `/setprivacy` - bot will be able receive messages.
    3. `/setjoingroups` - bot will be able to add to group.


Some references how to create a Telegram Bot: [building telegram bot](https://codingwithmanny.medium.com/building-a-telegram-bot-with-nodejs-46660f05b42f)
Once Bot is created add to specified Telegram group and set admin permission rights.

Two parameters should be saved:
1. Telegram bot secret token
2. Telegram group chat ID.

Telegram chat id is need to verify origin of incomming message source,
[How to find group chat ID:](https://sean-bradley.medium.com/get-telegram-chat-id-80b575520659)

## Wappsto

There is a need for middleman between Telegram and Mattermost services because Telegram and Mattermost messages are not
compatible. Such service is needed in order to translate one message format to another message format. Such json format
translation 'middleman' can be Wappsto service. All communication with Telegram group will hapen through Wappsto
application. To send message from Telegram we should specify Wappsto entry point, i.e. set webhook

- Create Wappsto account [Wappsto](https://wappsto.com)
- Login goto the store and instal TelegramMattermost application.
- Under installed application settings -> App token can be found.

Set webhook for telegram using curl:
```
curl
https://api.telegram.org/bot'xxx-my-bot-token-xxx'/setWebhook?url=https://wappsto.com/services/extsync/request/xxx-my-app-token=xxx
response:
{"ok":true,"result":true,"description":"Webhook is set"}
```

Note: replace 'xxx-my-bot-token-xxx' with your secret Telegram token, and xxx-my-app-token=xxx with Wappsto application token.


On the other end for communicating Wappsto with Mattermost there is a need to provide Mattermost entry point -
incomming Mattermost webhook and Mattermost outgoing webhook token.

In total for Wappsto application UI we should provice four parameters:

1. Mattermost outgoing webhook token; for source verification.
2. Telegram group chat ID; for source verification.
3. Mattermost incomming webhook, i.e. URL, i.e. `https://mattermost.example.com/hooks/xxx-webhook-token-xxx`
4. Telegram bot token from which will be formed URL: `https://api.telegram.org/bot'xxx-my-bot-secret-token-xxx'/sendMessage`


## Mattermost

Mattermost messaging service will use the same Wappsot app token to send messages to Wappsto

Create channel on Mattermost and specify incomming and outgoing webhooks

- Create incomming webhook for receiving messages from Wappsto application
- Create outgoing webhook for sending messages to Wappsto application. There we are going to use Wappsto application
  token with full url: `https://wappsto.com/services/extsync/request/xxx-my-app-token-xxx`



