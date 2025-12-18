# Slack Integration Setup Guide

This guide will help you set up Slack integration for the Smart Office Automation Agent.

## Prerequisites
- A Slack workspace where you have permission to add apps
- Access to [Slack API Dashboard](https://api.slack.com/apps)

## Step 1: Create a Slack App

1. Go to https://api.slack.com/apps
2. Click **"Create New App"**
3. Select **"From scratch"**
4. Enter:
   - **App Name**: `Smart Office Agent` (or any name you prefer)
   - **Workspace**: Select your workspace
5. Click **"Create App"**

## Step 2: Configure Bot Permissions

1. In your app settings, go to **"OAuth & Permissions"** (left sidebar)
2. Scroll down to **"Scopes"** → **"Bot Token Scopes"**
3. Add the following scopes:
   - `chat:write` - Send messages to channels
   - `chat:write.public` - Send messages to public channels without joining
4. Click **"Save Changes"**

## Step 3: Install App to Workspace

1. Scroll up to **"OAuth Tokens for Your Workspace"**
2. Click **"Install to Workspace"**
3. Review permissions and click **"Allow"**
4. Copy the **"Bot User OAuth Token"** (starts with `xoxb-`)
   - You'll need this for your `.env` file

## Step 4: Configure Environment Variables

1. Open `backend/.env` file (create it if it doesn't exist)
2. Add the following lines:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_CHANNEL=#your-channel-name
```

Replace:
- `xoxb-your-bot-token-here` with your actual Bot User OAuth Token
- `#your-channel-name` with the channel where you want messages posted (e.g., `#meetings`, `#general`)

## Step 5: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install `slack-sdk` and other required packages.

## Step 6: Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   python app.py
   ```

2. You should see in the console:
   ```
   ✓ Slack integration loaded
   ✓ Slack integration enabled
   ```

3. Process a file in the UI, then click **"💬 Send to Slack"**

4. Check your Slack channel - you should see a formatted message with:
   - Meeting Summary header
   - Summary text
   - Follow-up actions as bullet points

## Troubleshooting

### "Slack integration not available"
- Make sure `slack-sdk` is installed: `pip install slack-sdk`
- Check that `slack_integration.py` exists in the `integration-features` folder

### "SLACK_BOT_TOKEN not found"
- Verify your `.env` file is in the `backend` folder
- Make sure the token starts with `xoxb-`
- Restart the backend server after adding the token

### "not_in_channel" error
- The bot needs to be invited to private channels
- For public channels, the `chat:write.public` scope allows posting without joining
- For private channels: `/invite @Smart Office Agent` in the channel

### "invalid_auth" error
- Your token may be expired or invalid
- Go back to Slack API dashboard → OAuth & Permissions
- Reinstall the app to get a fresh token

## Channel Selection

You can post to different channels by changing the `SLACK_CHANNEL` environment variable:

- Public channels: `#general`, `#meetings`, etc.
- Private channels: Invite the bot first with `/invite @YourBotName`
- Direct messages: Use user IDs like `@U01234ABCD`

## Security Notes

- **Never commit your `.env` file** - it contains sensitive tokens
- The `.env` file is already in `.gitignore`
- If you accidentally expose your token, regenerate it in the Slack API dashboard

## Features

The Slack integration sends:
- 📋 **Formatted header** with meeting summary title
- **Summary section** with the AI-generated summary
- **Follow-up actions** as bullet points
- Clean, professional formatting using Slack blocks

Enjoy your automated meeting summaries in Slack! 🎉
