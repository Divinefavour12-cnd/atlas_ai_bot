# Atlas AI Bot - Railway Deployment Guide

## Setup Instructions

### 1. Local Setup
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the project root:
```
GROQ_API_KEY=your_groq_api_key_here
```

Get your free Groq API key from: https://console.groq.com/keys

### 3. Run Locally
```bash
npm start
```

The bot will generate a QR code. Scan it with WhatsApp to authenticate.

---

## Railway Deployment

### Step 1: Prepare Your Repository
1. Push your code to GitHub
2. Ensure `.env` is in `.gitignore` (don't commit secrets!)
3. Make sure `package.json` has the correct `"start"` script

### Step 2: Create Railway Project
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account and select your repo

### Step 3: Configure Environment Variables
1. In Railway dashboard, go to "Variables"
2. Add `GROQ_API_KEY=your_groq_api_key_here`

### Step 4: Set Up Persistent Storage for Sessions
Sessions are stored in `./session` folder. For production, you need persistent storage:

**Option A: Use Railway's Volumes (Recommended)**
1. Go to "Settings" in your Railway service
2. Click "Add Volume"
3. Mount point: `/app/session`
4. Size: 1GB

**Option B: Use GitHub to Store Session Files**
1. On first run, Railway will create `./session` folder
2. Periodically commit and push the session files to keep them persistent
3. Or use a separate database/storage service

### Step 5: Deploy
1. Railway will automatically detect your `package.json`
2. It will run: `npm install` and then `npm start`
3. Monitor logs in the Railway dashboard

### Step 6: Verify the Bot is Running
1. Check Railway logs for "✅ CONNECTED SUCCESSFULLY!"
2. Test by sending a WhatsApp message to the bot
3. Confirm it responds with AI-powered replies

---

## Important Notes

### Session Management
- **First deployment**: The bot will show a QR code. Scan it with WhatsApp.
- **With Volumes**: Session is saved automatically. Bot will reconnect without QR on restart.
- **Without Volumes**: Session is lost when the container restarts. You'll need to scan QR again.

### Environment Variables
Never commit your `.env` file or API keys to GitHub!
- Add to `.gitignore`: `echo ".env" >> .gitignore`
- Use Railway Variables dashboard instead

### Monitor Logs
```bash
# In Railway dashboard, click on your service and view logs
# Look for messages like:
# ✅ CONNECTED SUCCESSFULLY!
# 🤖 Listening for messages...
```

### Troubleshooting

**Issue**: "GROQ_API_KEY not found"
- Solution: Add GROQ_API_KEY to Railway Variables

**Issue**: Bot disconnects frequently
- Solution: Use Railway Volumes for persistent session storage

**Issue**: "Execution context destroyed"
- Solution: This is handled in the code. Bot will auto-reconnect.

---

## Scaling Tips

- **Memory**: Allocate at least 512MB for the bot
- **Monitoring**: Enable Railway alerts for deployments
- **Backup**: Periodically backup session files using GitHub or another storage service
- **Rate Limiting**: Groq API has free tier limits. Monitor usage in console

---

## Support
- Groq API docs: https://console.groq.com/docs
- Baileys library: https://github.com/WhiskeySockets/Baileys
- Railway docs: https://docs.railway.app
