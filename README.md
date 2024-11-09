PingPong Bot for Kleros SRE Test
This repository contains a bot that interacts with the PingPong smart contract deployed on the Sepolia test network. 
The bot listens for Ping() events and responds with pong() using the transaction hash that emitted the Ping() event.

Features
Connects to the Sepolia blockchain using WebSocket and HTTP RPC endpoints.
Monitors the PingPong smart contract for Ping() events.
Responds to detected Ping() events by calling the pong() function.
Sends status updates to a Telegram bot to monitor the process.

Installation
Prerequisites
Node.js version 14+ installed.
NPM (Node Package Manager).

Setup
Clone the repository:

git clone https://github.com/Arthur-BDX/pingpong-bot.git
cd pingpong-bot
Install the dependencies:

npm install
Configure the environment:

keys.json: Add your private and public keys.
Telegram Bot Token: Update K.js with your Telegram bot token and chat ID (in the sendTelegramMessage() function).
Run the bot:

npm start

Address of the bot = "0xF039b5E4CC28Ac1E503b8cF69a640DC6bB9e24d7"
The block number at which you started running it = 7037361
