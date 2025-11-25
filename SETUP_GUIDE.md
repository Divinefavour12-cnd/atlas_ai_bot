# Atlas AI - WhatsApp Bot Setup Guide

## 📋 What's Included

- **bot.js**: Main bot application using Baileys
- **package.json**: All required dependencies
- **.env**: Environment variables template (add your API key here)
- **.gitignore**: Prevents secrets from being committed
- **RAILWAY_DEPLOYMENT.md**: Full deployment instructions

---

## 🚀 Quick Start (Local)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Get Your Groq API Key
1. Visit https://console.groq.com/keys
2. Sign up (no credit card required - FREE!)
3. Copy your API key

### Step 3: Configure .env
Edit `.env` and add your API key:
```
GROQ_API_KEY=your_api_key_here
```

### Step 4: Run the Bot
```bash
npm start
```

### Step 5: Authenticate with WhatsApp
1. A QR code will appear in the terminal
2. Open WhatsApp on your phone
3. Go to Settings → Linked Devices → Link a Device
4. Scan the QR code

### Step 6: Test It!
Send a message to the bot and it will reply with AI-powered responses.

---

## ✨ Bot Features

- **🤖 AI Conversations**: Uses Groq API for intelligent responses
- **💾 Session Saving**: Automatically saves session, no need to scan QR again
- **📊 User Statistics**: Tracks messages and interactions
- **🎭 Special Commands**:
  - `/help` - Show all commands
  - `/joke` - Get a random dad joke
  - `/quote` - Get inspirational quotes
  - `/stats` - View your chat statistics
  - `/clear` - Clear conversation history
  - `/ping` - Check bot status
  - `/info` - Bot information

---

## 📁 File Structure

```
.
├── bot.js                      # Main bot file
├── package.json                # Dependencies
├── .env                        # API keys (don't commit!)
├── .gitignore                  # Git ignore rules
├── messages.log                # Message logs
├── session/                    # Session storage (auto-created)
├── SETUP_GUIDE.md             # This file
└── RAILWAY_DEPLOYMENT.md      # Railway deployment guide
```

---

## ⚙️ Configuration

All settings are in `bot.js`:

```javascript
const CONFIG = {
    botName: 'Atlas AI',           // Bot name
    version: '1.0.0',              // Version
    logFile: 'messages.log',       // Log file
    sessionPath: './session',      // Session folder
    groqApiKey: process.env.GROQ_API_KEY,  // API key from .env
    aiModel: 'llama-3.3-70b-versatile',   // AI model
    maxTokens: 500,                // Response length
    temperature: 0.7               // Response creativity (0-2)
};
```

---

## 🔒 Security Notes

✅ **Good Practices**:
- API key stored in `.env` file
- `.env` is in `.gitignore` (not committed to Git)
- No hardcoded secrets in code

⚠️ **Never**:
- Commit `.env` file to GitHub
- Share your API key
- Use expired or reused keys

---

## 🐛 Troubleshooting

### Bot doesn't start
```
❌ ERROR: GROQ_API_KEY not found in .env file!
```
**Fix**: Make sure `.env` has `GROQ_API_KEY=your_key_here`

### Bot doesn't respond
- Check that Groq API key is valid
- Verify internet connection
- Check logs: `messages.log`

### Session issues
- Session folder is at `./session`
- To reset: Delete the `session` folder and restart
- Bot will ask for QR code again

### Port conflicts
- Bot doesn't use HTTP ports (runs on WhatsApp protocol)
- Safe to run multiple instances

---

## 📱 Production Deployment

### Option 1: Railway (Recommended)
See `RAILWAY_DEPLOYMENT.md` for full instructions.

**Quick summary**:
1. Push to GitHub
2. Create Railway project
3. Add `GROQ_API_KEY` in Railway Variables
4. Deploy!

### Option 2: Other Cloud Platforms
- **Heroku**: Similar to Railway (free tier no longer available)
- **Render**: Similar to Railway
- **AWS Lambda**: More complex, needs event-driven setup
- **Google Cloud**: Similar to AWS

---

## 📊 Monitoring

### View Logs
```bash
# Local
npm start

# Railway
# View in dashboard
```

### Check Message Logs
```bash
cat messages.log
```

### Monitor Performance
- Keep an eye on Groq API usage
- Check Railway resource usage
- Monitor session file size

---

## 💡 Tips

1. **Customize Bot Name**: Edit `botName: 'Atlas AI'` in bot.js
2. **Change AI Model**: Edit `aiModel` in CONFIG (see Groq docs for options)
3. **Adjust Response Length**: Edit `maxTokens` (higher = longer responses)
4. **Change Personality**: Edit the system message in `getAIResponse()` function
5. **Add More Commands**: Add new entries in the `COMMANDS` object

---

## 🆘 Support

- **Groq API**: https://console.groq.com/docs
- **Baileys**: https://github.com/WhiskeySockets/Baileys
- **Node-Fetch**: For HTTP requests
- **Dotenv**: For environment variables

---

## 📝 License

ISC License

---

## 🎉 You're All Set!

Your Atlas AI bot is ready to go. Start chatting and enjoy AI-powered responses on WhatsApp!

For production deployment, follow the Railway guide in `RAILWAY_DEPLOYMENT.md`.
