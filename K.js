import { ethers } from 'ethers';
import fs from 'fs';
import axios from 'axios';

// Sepolia RPC endpoint (I choose 2 differents RPC to avoid rate limits exceded)
let listenerProvider = new ethers.providers.WebSocketProvider('wss://sepolia.gateway.tenderly.co'); // cut after 40min wss://sepolia.gateway.tenderly.co
let txProvider = new ethers.providers.WebSocketProvider('wss://ethereum-sepolia-rpc.publicnode.com');

// Loading the public and private keys from the wallet (I suggest encrypted wallet for real assets)
const keysRaw = fs.readFileSync('keys.json');
const keys = JSON.parse(keysRaw);
const privateKey = keys["private-key"];
const publicKey = keys["public-key"];
const telegramBotToken = ''; //Bot tokenID made with'BotFather'
const telegramChatId = ''; //Chat to receive updates

// Create the wallet instance with the private key and provider
const wallet = new ethers.Wallet(privateKey, txProvider);

// Contract detailss
const contractAddress = '0xA7F42ff7433cB268dD7D59be62b00c30dEd28d3D';
const contractABI = [
    "event Ping()",
    "event Pong(bytes32 txHash)",
    "event NewPinger(address pinger)",
    "function pong(bytes32 _txHash) external"
];

// Create a contract instance for listening and sending transactions
let listenerContract = new ethers.Contract(contractAddress, contractABI, listenerProvider);
let txContract = new ethers.Contract(contractAddress, contractABI, wallet);

async function setupListeners() {
    // Set up WebSocket reconnect
    listenerProvider.on("close", () => {
        console.error("WebSocket connection closed. Reconnecting...");
        reconnect();
    });

    listenerProvider.on("error", (error) => {
        console.error("WebSocket error:", error);
        reconnect();
    });

    // Listening for Ping event (Can also work for Pong)
    listenerContract.on("Ping", async (...args) => {
        const event = args[args.length - 1]; // Usually the last argument contains the event object
        console.log("Ping event detected! Event details:", event);

        try {
            // Get the hash of the transaction that emitted the Ping event
            const txHash = event.transactionHash;
            if (!txHash) {
                console.error("Transaction hash not found in event. Full event:", event);
                return;
            }
            
            console.log(`Ping event transaction hash: ${txHash}`);
            
            // Respond to the Ping event by calling pong() with the transaction hash
            const latestBlock = await listenerProvider.getBlockNumber();
            console.log(`Responding to Ping event at block: ${latestBlock}`);
            
            const newprovider = new ethers.providers.JsonRpcProvider('https://ethereum-sepolia.blockpi.network/v1/rpc/public');
            const newwallet = new ethers.Wallet(privateKey, newprovider);
            let newContract = new ethers.Contract(contractAddress, contractABI, newwallet);
            console.log('Data ready to send pong TX');
            
            const tx = await newContract.pong(txHash);
            console.log('Tx is defined');
            await tx.wait();
            console.log(`Pong transaction hash: ${tx.hash}`);
        } catch (error) {
            console.error("Error responding to Ping:", error);
        }
    });
}

async function main() {
    try {
        // Get the current block number (Help me to be sure the node is well synced)
        const blockNumber = await listenerProvider.getBlockNumber();
        const starter = `Current Block Number: ${blockNumber}`;
        console.log(starter);
        sendTelegramMessage(starter);

        // Start the initial setup for listeners
        setupListeners();
    } catch (error) {
        console.error("Error during main setup:", error);
        setTimeout(main, 3000); // Retry after 3 seconds
    }
}

// Function to reconnect to the WebSocket and reinitialize the provider
function reconnect() {
    console.log("Attempting to reconnect...");

    // Remove all listeners to avoid duplicate events
    listenerContract.removeAllListeners();

    // Reinitialize the listener provider
    listenerProvider = new ethers.providers.WebSocketProvider('wss://sepolia.gateway.tenderly.co');

    // Reinitialize the listener contract with the new provider
    listenerContract = new ethers.Contract(contractAddress, contractABI, listenerProvider);

    // Set up the listeners again
    setupListeners();
}

// Function to manually send a pong with a specific txHash
async function sendPong() {
    try {
        console.log("Sending manual Pong...");
        // Use the last tx hash from ping 
        const txHash = '0x4178c1be95bfe5f4ea389da670ce36ccb09ac8a4fc878381b35d6928f926ebee';
        const latestBlock = await listenerProvider.getBlockNumber();
        console.log(`Responding to Ping event at block: ${latestBlock}`);
        const tx = await txContract.pong(txHash);
        await tx.wait();
        console.log(`Manual Pong transaction hash: ${tx.hash}`);
    } catch (error) {
        console.error("Error sending manual Pong:", error);
    }
}

// Function to send a message to Telegram
async function sendTelegramMessage(message) {
    try {
        const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
        const response = await axios.post(url, {
            chat_id: telegramChatId,
            text: message,
        });
        if (response.data.ok) {
            console.log("Telegram message sent successfully");
        } else {
            console.error("Error sending Telegram message:", response.data.description);
        }
    } catch (error) {
        console.error("Error in sendTelegramMessage:", error);
    }
}

// Log every 5 minutes with block number and timestamp (keep outside of main to avoid double initialization)
setInterval(async () => {
    try {
        const currentBlock = await listenerProvider.getBlockNumber();
        const timestamp = new Date().toISOString();
        const message = `Everything is working - Current Block: ${currentBlock}, Timestamp: ${timestamp}`;
        console.log(message);
        // Send Telegram message
        sendTelegramMessage(message);
    } catch (error) {
        console.error("Error fetching block number during status log:", error);
    }
}, 5 * 60 * 1000); // 5 minutes interval

// Reconnect WebSocket every 15 minutes to avoid rate limit issues (Coming beetwen 20 and 40min)
setInterval(() => {
    try {
        const update_message = "Reconnecting WebSocket to prevent rate limit issues...";
        console.log(update_message);
        // Send Telegram message
        sendTelegramMessage(update_message);
        reconnect();
    } catch (error) {
        console.error("Error during WebSocket reconnection:", error);
    }
}, 15 * 60 * 1000); // 15 minutes interval

// Start the main function
main();

// Call the function manually (Used for test)
//sendPong();


/*

Deliverables:
Source code of the bot.
Address of the bot = "0x42EdfDD2920821e12186C87801F3Abc50dCCC8d4"
The block number at which you started running it = 7055176


*/
