from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import google.generativeai as genai
from werkzeug.utils import secure_filename
import tempfile
from dotenv import load_dotenv
import json
from datetime import datetime

# Load environment variables
load_dotenv()

# Add integration-features to path
integration_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'integration-features'))
sys.path.insert(0, integration_path)

# Import Slack integration
try:
    from slack_integration import send_to_slack
    slack_available = True
    print(f"✓ Slack integration loaded")
except ImportError as e:
    slack_available = False
    print(f"⚠️  Slack integration not available: {e}")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload settings
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB limit

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Initialize Gemini
api_key = os.getenv('GEMINI_API_KEY')
if api_key:
    genai.configure(api_key=api_key)
    # Use gemini-2.5-flash - latest, fastest, supports multimodal
    model = genai.GenerativeModel('models/gemini-2.5-flash')
else:
    model = None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Backend is running'}), 200

@app.route('/api/process', methods=['POST'])
def process_media():
    """Process audio/video file and return summary with follow-ups"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm'}), 400
        
        # Get summary length preference
        summary_length = request.form.get('summaryLength', 'medium')
        
        # Define length instructions
        length_instructions = {
            'short': '2-3 sentences, only the most critical points',
            'medium': '4-6 sentences covering main topics',
            'long': 'comprehensive summary with detailed coverage of all topics discussed'
        }
        
        length_instruction = length_instructions.get(summary_length, length_instructions['medium'])
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Upload file to Gemini File API
            print(f"Uploading file to Gemini: {filename}")
            uploaded_file = genai.upload_file(filepath)
            print(f"Upload complete: {uploaded_file.uri}")
            
            # Wait for file to be processed
            import time
            while uploaded_file.state.name == "PROCESSING":
                time.sleep(2)
                uploaded_file = genai.get_file(uploaded_file.name)
            
            if uploaded_file.state.name == "FAILED":
                raise Exception("File processing failed")
            
            # Analyze audio/video with Gemini
            print(f"Analyzing with Gemini (summary length: {summary_length})...")
            prompt = f"""Analyze this audio/video file and provide:
1. A detailed transcription of all spoken content
2. A {summary_length} summary ({length_instruction})
3. A list of 3-5 actionable follow-up items or next steps

Respond ONLY with valid JSON in this exact format:
{{
  "transcript": "full transcription here",
  "summary": "summary here",
  "followUps": ["item 1", "item 2", "item 3"]
}}"""
            
            response = model.generate_content([uploaded_file, prompt])
            
            # Parse response
            result_text = response.text.strip()
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            
            result = json.loads(result_text.strip())
            
            # Clean up uploaded file from Gemini
            genai.delete_file(uploaded_file.name)
            
            print("Processing complete")
            return jsonify(result), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(filepath):
                os.remove(filepath)
                print(f"Temporary file deleted: {filename}")
    
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

@app.route('/api/slack/send', methods=['POST'])
def send_slack_message():
    """Send summary and follow-ups to Slack"""
    if not slack_available:
        return jsonify({'error': 'Slack integration not available'}), 503
    
    try:
        data = request.get_json()
        
        if not data or 'summary' not in data or 'followUps' not in data:
            return jsonify({'error': 'Missing summary or followUps'}), 400
        
        summary = data['summary']
        follow_ups = data['followUps']
        
        # Send to Slack
        result = send_to_slack(summary, follow_ups)
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error sending to Slack: {str(e)}")
        return jsonify({'error': f'Error sending to Slack: {str(e)}'}), 500

@app.route('/api/process-text', methods=['POST'])
def process_text():
    """Process text input directly"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text_input = data['text']
        
        # Use Gemini to generate summary and follow-ups
        print("Processing text input with Gemini...")
        prompt = f"""Please analyze this text and provide:
        1. A concise summary of the key points
        2. A list of actionable follow-up items or next steps
        
        Format your response as JSON with this structure:
        {{
            "summary": "Brief summary of the content",
            "followUps": ["Follow-up item 1", "Follow-up item 2", ...]
        }}
        
        Text to analyze:
        {text_input}"""
        
        response = model.generate_content(prompt)
        
        # Parse the JSON response
        result_text = response.text.strip()
        # Remove markdown code blocks if present
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.startswith('```'):
            result_text = result_text[3:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]
        
        result = json.loads(result_text.strip())
        result['transcript'] = text_input
        
        print("Text processing complete")
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error processing text: {str(e)}")
        return jsonify({'error': f'Error processing text: {str(e)}'}), 500

if __name__ == '__main__':
    # Check if API key is set
    if not os.getenv('GEMINI_API_KEY'):
        print("WARNING: GEMINI_API_KEY not found in environment variables!")
        print("Please set it in your .env file")
        print("Get your free API key at: https://aistudio.google.com/app/apikey")
    
    print("Starting Smart Office Automation Agent Backend (Google Gemini)...")
    print(f"Allowed file types: {', '.join(ALLOWED_EXTENSIONS)}")
    print(f"Max file size: {MAX_FILE_SIZE / (1024*1024)}MB")
    
    if slack_available:
        print("✓ Slack integration enabled")
    else:
        print("⚠️  Slack integration not available")
    app.run(debug=True, port=5000, host='0.0.0.0')