import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

def send_to_slack(summary, follow_ups):
    """
    Send meeting summary and follow-ups to Slack channel
    
    Args:
        summary (str): Meeting summary text
        follow_ups (list): List of follow-up action items
    
    Returns:
        dict: Response with success status and message
    """
    slack_token = os.getenv('SLACK_BOT_TOKEN')
    slack_channel = os.getenv('SLACK_CHANNEL')
    
    if not slack_token:
        raise ValueError("SLACK_BOT_TOKEN not found in environment variables")
    
    if not slack_channel:
        raise ValueError("SLACK_CHANNEL not found in environment variables")
    
    client = WebClient(token=slack_token)
    
    # Format follow-ups as bullet points
    follow_ups_text = "\n".join([f"• {item}" for item in follow_ups])
    
    # Create message blocks for better formatting
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "📋 Meeting Summary",
                "emoji": True
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Summary:*\n{summary}"
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*✅ Follow-up Actions:*\n{follow_ups_text}"
            }
        }
    ]
    
    try:
        response = client.chat_postMessage(
            channel=slack_channel,
            blocks=blocks,
            text=f"Meeting Summary: {summary}"  # Fallback text for notifications
        )
        
        return {
            "success": True,
            "message": "Successfully sent to Slack",
            "channel": slack_channel,
            "timestamp": response['ts']
        }
        
    except SlackApiError as e:
        raise Exception(f"Slack API error: {e.response['error']}")
