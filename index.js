require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, isJidBroadcast, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const pino = require('pino');

const conversationHistory = {};
const userStats = {};
let sock = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const CONFIG = {
    botName: 'Atlas AI',
    version: '1.0.0',
    logFile: 'messages.log',
    sessionPath: './session',
    groqApiKey: process.env.GROQ_API_KEY,
    aiModel: 'llama-3.3-70b-versatile',
    maxTokens: 500,
    temperature: 0.7
};

// Validate API key
if (!CONFIG.groqApiKey) {
    console.error('❌ ERROR: GROQ_API_KEY not found in .env file!');
    console.log('💡 Create a .env file with: GROQ_API_KEY=your_api_key_here');
    process.exit(1);
}

// Create session directory if it doesn't exist
if (!fs.existsSync(CONFIG.sessionPath)) {
    fs.mkdirSync(CONFIG.sessionPath, { recursive: true });
}

function logMessage(from, body, direction = 'received') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${direction.toUpperCase()} | From: ${from} | Message: ${body}\n`;
    
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`⏰ ${new Date().toLocaleString()}`);
    console.log(`📩 ${direction === 'received' ? 'RECEIVED' : 'SENT'} MESSAGE`);
    console.log(`👤 Contact: ${from}`);
    console.log(`💬 Content: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);
    console.log('═'.repeat(60));
    
    if (!fs.existsSync(CONFIG.logFile)) {
        fs.writeFileSync(CONFIG.logFile, `=== ${CONFIG.botName} - MESSAGE LOG ===\nStarted: ${new Date().toISOString()}\n\n`);
    }
    fs.appendFileSync(CONFIG.logFile, logEntry);
}

function updateUserStats(userId) {
    if (!userStats[userId]) {
        userStats[userId] = { 
            messageCount: 0, 
            firstSeen: new Date(),
            aiQueries: 0
        };
    }
    userStats[userId].messageCount++;
    userStats[userId].lastSeen = new Date();
}

function getUserStats(userId) {
    const stats = userStats[userId];
    if (!stats) return '▸ No statistics available yet. Keep chatting!';
    
    const daysSinceFirst = Math.floor((new Date() - stats.firstSeen) / (1000 * 60 * 60 * 24));
    
    return `╔════════════════════════════════╗
║     📊 YOUR CHAT STATS        ║
╚════════════════════════════════╝

💬 Total Messages: ${stats.messageCount}
🤖 AI Queries: ${stats.aiQueries}
📅 First Interaction: ${stats.firstSeen.toLocaleDateString()}
🕐 Last Activity: ${stats.lastSeen.toLocaleString()}
⏱️ Days Active: ${daysSinceFirst} days

Keep chatting to increase your stats! 🚀`;
}

async function getAIResponse(userMessage, userId) {
    try {
        const fetch = (await import('node-fetch')).default;
        
        if (!conversationHistory[userId]) {
            conversationHistory[userId] = [];
        }
        
        // Keep only last 6 messages for context
        if (conversationHistory[userId].length > 6) {
            conversationHistory[userId] = conversationHistory[userId].slice(-6);
        }
        
        conversationHistory[userId].push({
            role: "user",
            content: userMessage
        });
        
        const systemMessage = {
            role: "system",
            content: `You are ${CONFIG.botName}, a helpful and intelligent AI assistant.
- Provide clear, concise, and accurate responses
- Be conversational and natural
- Use emojis sparingly when appropriate
- If you don't know something, admit it honestly
- Keep responses under 200 words unless more detail is requested`
        };
        
        const messages = [systemMessage, ...conversationHistory[userId]];
        
        console.log('🧠 Sending request to Groq API...');
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: CONFIG.aiModel,
                messages: messages,
                max_tokens: CONFIG.maxTokens,
                temperature: CONFIG.temperature,
                top_p: 0.95
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            
            if (response.status === 401) {
                return '⚠️ Invalid API key. Please check your GROQ_API_KEY in the .env file.';
            } else if (response.status === 429) {
                return '⏸️ Rate limit reached. Please wait and try again.';
            } else if (response.status === 500) {
                return '⚠️ Groq API is experiencing issues. Please try again shortly.';
            }
            
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ AI Response received');
        
        let aiResponse = data.choices?.[0]?.message?.content?.trim() || 'I understand your message. How can I help?';
        
        conversationHistory[userId].push({
            role: "assistant",
            content: aiResponse
        });
        
        return aiResponse;
        
    } catch (error) {
        console.error('❌ AI Error:', error.message);
        return '⚠️ I encountered a technical issue. Please try again.';
    }
}

async function fetchDadJoke() {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://icanhazdadjoke.com/', {
            headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();
        return `🎭 DAD JOKE TIME!\n\n${data.joke}\n\n😄`;
    } catch (error) {
        console.error('❌ Error fetching joke:', error.message);
        return '▸ Couldn\'t fetch a joke right now. 😅';
    }
}

async function fetchQuote() {
    try {
        const fetch = (await import('node-fetch')).default;
        // Use ZenQuotes API as backup since quotable.io has SSL issues
        const response = await fetch('https://zenquotes.io/api/random');
        const data = await response.json();
        return `✨ INSPIRATIONAL QUOTE\n\n"${data[0].q}"\n\n— ${data[0].a}`;
    } catch (error) {
        console.error('❌ Error fetching quote:', error.message);
        // Fallback quotes if API fails
        const fallbackQuotes = [
            { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
            { q: "Innovation distinguishes between a leader and a follower.", a: "Steve Jobs" },
            { q: "Stay hungry, stay foolish.", a: "Steve Jobs" },
            { q: "Life is what happens when you're busy making other plans.", a: "John Lennon" }
        ];
        const random = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        return `✨ INSPIRATIONAL QUOTE\n\n"${random.q}"\n\n— ${random.a}`;
    }
}

const COMMANDS = {
    help: `╔════════════════════════════════╗
║    📋 ${CONFIG.botName} v${CONFIG.version}    ║
╚════════════════════════════════╝

🤖 INTELLIGENT AI ASSISTANT
━━━━━━━━━━━━━━━━━━━━━━━━

🔹 Special Commands:
━━━━━━━━━━━━━━━━━━━━━━━━
▸ /help - Show this menu
▸ /joke - Get a random dad joke
▸ /quote - Get inspirational quote
▸ /stats - Your chat statistics
▸ /clear - Clear conversation history
▸ /ping - Check bot status

💡 Smart Features:
━━━━━━━━━━━━━━━━━━━━━━━━
✓ Natural conversation with AI
✓ Remembers conversation context
✓ Answers questions intelligently
✓ Professional & friendly responses

💬 Just chat naturally - I'll understand!`,

    info: `╔════════════════════════════════╗
║      🤖 BOT INFORMATION       ║
╚════════════════════════════════╝

📱 Name: ${CONFIG.botName}
🔢 Version: ${CONFIG.version}
⚡ Status: Active & Learning
🧠 AI Model: ${CONFIG.aiModel}
🛠️ Built with: Baileys + Groq API

━━━━━━━━━━━━━━━━━━━━━━━━
AI-Powered Features:
✓ Intelligent conversation
✓ Context-aware responses
✓ Natural language understanding
✓ Multi-topic expertise`,

    ping: '🏓 Pong! Bot is active and ready! 🤖✨'
};

async function startBot() {
    try {
        // Get latest Baileys version
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`Using Baileys version: ${version.join('.')}, isLatest: ${isLatest}`);

        const { state, saveCreds } = await useMultiFileAuthState(CONFIG.sessionPath);
        
        console.log('\n╔════════════════════════════════════════════════╗');
        console.log(`║           ${CONFIG.botName} - WHATSAPP BOT           ║`);
        console.log('╚════════════════════════════════════════════════╝\n');
        console.log(`🤖 Bot Name: ${CONFIG.botName}`);
        console.log(`🔢 Version: ${CONFIG.version}`);
        console.log(`🧠 AI Model: ${CONFIG.aiModel}`);
        console.log(`📁 Session: ${CONFIG.sessionPath}`);
        console.log('🔄 Initializing...\n');

        // Create socket with improved configuration
        sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }), // Reduce log noise
            browser: Browsers.macOS('Desktop'),
            syncFullHistory: false,
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: undefined,
            keepAliveIntervalMs: 10000,
            emitOwnEvents: false,
            fireInitQueries: true,
            getMessage: async () => undefined
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('\n🔐 WHATSAPP AUTHENTICATION REQUIRED');
                console.log('📱 Scan this QR code with your WhatsApp phone:\n');
                qrcode.generate(qr, { small: true });
                console.log('\n⏳ Waiting for QR scan...\n');
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                console.log(`❌ Connection closed. Status: ${statusCode}`);
                
                if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    console.log(`🔄 Reconnecting... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})\n`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    startBot();
                } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                    console.log('❌ Max reconnection attempts reached. Please restart the bot manually.');
                    process.exit(1);
                } else {
                    console.log('❌ Logged out. Please delete the session folder and restart the bot.');
                    process.exit(0);
                }
            } else if (connection === 'open') {
                reconnectAttempts = 0; // Reset on successful connection
                console.log('\n✅ CONNECTED SUCCESSFULLY!');
                console.log(`⏰ Started: ${new Date().toLocaleString()}`);
                console.log('🤖 Listening for messages...\n');
            } else if (connection === 'connecting') {
                console.log('🔄 Connecting to WhatsApp...');
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            
            if (!msg.message || msg.key.fromMe || isJidBroadcast(msg.key.remoteJid)) return;

            try {
                const messageText = msg.message.conversation || 
                                   msg.message.extendedTextMessage?.text || 
                                   msg.message.imageMessage?.caption ||
                                   msg.message.videoMessage?.caption || '';
                const from = msg.key.remoteJid;
                
                if (!messageText.trim()) return;

                logMessage(from, messageText, 'received');
                updateUserStats(from);

                const messageLower = messageText.toLowerCase().trim();

                // Command handling
                if (messageLower === '/help') {
                    await sock.sendMessage(from, { text: COMMANDS.help });
                    return;
                }

                if (messageLower === '/info') {
                    await sock.sendMessage(from, { text: COMMANDS.info });
                    return;
                }

                if (messageLower === '/ping') {
                    await sock.sendMessage(from, { text: COMMANDS.ping });
                    return;
                }

                if (messageLower === '/joke') {
                    const joke = await fetchDadJoke();
                    await sock.sendMessage(from, { text: joke });
                    return;
                }

                if (messageLower === '/quote') {
                    const quote = await fetchQuote();
                    await sock.sendMessage(from, { text: quote });
                    return;
                }

                if (messageLower === '/stats') {
                    await sock.sendMessage(from, { text: getUserStats(from) });
                    return;
                }

                if (messageLower === '/clear') {
                    conversationHistory[from] = [];
                    await sock.sendMessage(from, { text: '✅ Conversation history cleared! 🔄' });
                    return;
                }

                // AI processing
                console.log('💭 Processing with AI...');
                
                if (userStats[from]) {
                    userStats[from].aiQueries++;
                }

                const aiResponse = await getAIResponse(messageText, from);
                await sock.sendMessage(from, { text: aiResponse });
                logMessage(from, aiResponse, 'sent');

            } catch (error) {
                console.error('❌ Error handling message:', error.message);
                try {
                    await sock.sendMessage(msg.key.remoteJid, { 
                        text: '⚠️ I encountered an error. Please try again!' 
                    });
                } catch (e) {
                    console.error('Failed to send error message:', e.message);
                }
            }
        });

    } catch (error) {
        console.error('❌ Failed to start bot:', error.message);
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`Retrying in 5 seconds... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})\n`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            startBot();
        } else {
            console.log('❌ Max reconnection attempts reached. Exiting.');
            process.exit(1);
        }
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n✅ Bot stopped gracefully.');
    if (sock) {
        sock.end();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n✅ Bot terminated gracefully.');
    if (sock) {
        sock.end();
    }
    process.exit(0);
});

// Start the bot
startBot();