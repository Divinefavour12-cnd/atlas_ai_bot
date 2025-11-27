# Render Deployment Guide

Follow these steps to run the WhatsApp bot on Render using the provided `render.yaml` configuration.

## Prerequisites
- Render account with GitHub/GitLab access to this repository
- `GROQ_API_KEY` from Groq Console
- Committed `render.yaml`, `package.json`, and source files on the branch you plan to deploy

## 1. Prepare the repository
1. Commit all local changes, especially `render.yaml` and any session path updates.
2. Push the branch (usually `main`) to the remote host Render will read from.

## 2. Connect the repo to Render
1. In the Render dashboard choose **New + → Blueprint**.
2. Select your Git provider and grant access if prompted.
3. Pick this repository and confirm the branch (defaults to `main`).
4. Render will detect `render.yaml` and show a worker service named `atlas-ai-whatsapp-bot`.

## 3. Configure environment variables
Add these in the worker’s Environment tab before the first deploy:
- `GROQ_API_KEY`: your Groq API key (keep `Sync` disabled).
- `SESSION_PATH`: defaults to `/opt/render/project/src/session` so the Baileys auth files sit inside the repo directory. Change this if you want a different folder.

## 4. Session storage on free plan
Free-tier workers cannot attach persistent disks. The session folder lives inside the repo workspace and will be recreated each redeploy/restart. To keep the same pairing forever, leave the worker running; if Render restarts it you must rescan the QR code. When you upgrade to a paid plan, switch `SESSION_PATH` to a mounted disk path and redeploy.

## 5. Deploy
1. Click **Apply** to launch the blueprint.
2. Render runs `npm install && mkdir -p session` followed by `npm start` (which executes `node index.js`).
3. Watch the **Logs** tab; the bot prints the QR code link notes once Baileys requests authentication. Use a secure tunnel or the saved `qr.png` artifact to scan the code from your phone.

## 6. Operations
- **Redeploy**: push changes to the tracked branch; auto-deploy will restart the worker.
- **Manual restart**: press **Restart** in the service page if the bot stops responding.
- **Secrets**: rotate the Groq key via the Environment tab and redeploy.
- **Logs**: use Render’s log stream or `messages.log` stored on the persistent disk for history.

## 7. Troubleshooting
- If the worker exits with “GROQ_API_KEY not found”, confirm the secret is set and redeploy.
- If Baileys shows “logged out”, delete the `/data/session` folder from the shell tab, restart, and rescan the QR code.
- For dependency issues, run `npm install` locally, commit `package-lock.json` if you prefer lockstep installs, and redeploy.
