import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from datetime import datetime, timedelta

def send_to_slack(summary, follow_ups):
    """
    Send action items to Slack channel with task and deadline
    
    Args:
        summary (str): Meeting summary text (not displayed)
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
    
    # Calculate default deadline (3 days from now)
    default_deadline = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
    
    # Format action items with task and deadline
    action_items = []
    for idx, item in enumerate(follow_ups, 1):
        action_items.append(f"*{idx}.* {item}\n   📅 *Deadline:* {default_deadline}")
    
    action_items_text = "\n\n".join(action_items)
    
    # Create message blocks for better formatting
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "✅ Action Items",
                "emoji": True
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": action_items_text
            }
        }
    ]
    
    try:
        response = client.chat_postMessage(
            channel=slack_channel,
            blocks=blocks,
            text=f"Action Items from Meeting"  # Fallback text for notifications
        )
        
        return {
            "success": True,
            "message": "Successfully sent action items to Slack",
            "channel": slack_channel,
            "timestamp": response['ts']
        }
        
    except SlackApiError as e:
        raise Exception(f"Slack API error: {e.response['error']}")
