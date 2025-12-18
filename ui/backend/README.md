# Smart Office Automation Agent - Backend

Python Flask backend that processes audio/video files using OpenAI's Whisper and GPT-4 APIs to generate summaries and follow-up actions.

## Features

- 🎙️ Audio transcription using OpenAI Whisper
- 🎥 Video audio extraction and transcription
- 🤖 AI-powered summary generation using GPT-4
- ✅ Automatic follow-up action items extraction
- 🔒 Secure file handling with automatic cleanup
- 🌐 CORS-enabled for frontend integration

## Prerequisites

- Python 3.8 or higher
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables:**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your OpenAI API key:
     ```
     OPENAI_API_KEY=sk-your-actual-api-key-here
     ```

## Running the Backend

1. **Make sure your virtual environment is activated**

2. **Start the Flask server:**
   ```bash
   python app.py
   ```

3. **The server will start on http://localhost:5000**

You should see output like:
```
Starting Smart Office Automation Agent Backend...
Allowed file types: mp3, mp4, mpeg, mpga, m4a, wav, webm
Max file size: 25.0MB
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
```

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns: `{ "status": "healthy", "message": "Backend is running" }`

### Process Media File
- **POST** `/api/process`
- Body: FormData with `file` field containing audio/video file
- Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
- Max file size: 25MB
- Returns:
  ```json
  {
    "summary": "AI-generated summary of the content",
    "followUps": ["Action item 1", "Action item 2", ...],
    "transcript": "Full transcription of the audio/video"
  }
  ```

### Process Text
- **POST** `/api/process-text`
- Body: `{ "text": "Your text content here" }`
- Returns:
  ```json
  {
    "summary": "AI-generated summary",
    "followUps": ["Action item 1", "Action item 2", ...],
    "transcript": "Original text input"
  }
  ```

## Configuration

### Supported File Types
- Audio: mp3, mpga, m4a, wav
- Video: mp4, mpeg, webm

### File Size Limit
- Default: 25MB
- To modify, change `MAX_FILE_SIZE` in `app.py`

### OpenAI Models
- Transcription: Whisper-1
- Analysis: GPT-4
- You can modify these in `app.py` if needed

## Troubleshooting

### "OPENAI_API_KEY not found"
- Make sure you've created a `.env` file with your API key
- Ensure the `.env` file is in the `backend` directory
- Check that the key starts with `sk-`

### "Module not found" errors
- Ensure your virtual environment is activated
- Run `pip install -r requirements.txt` again

### CORS errors
- The backend has CORS enabled by default
- If issues persist, check your frontend is making requests to `http://localhost:5000`

### File upload fails
- Check file size is under 25MB
- Verify file format is supported
- Ensure sufficient disk space in temp directory

## Development

To run in debug mode (auto-reloads on code changes):
```bash
export FLASK_ENV=development  # macOS/Linux
$env:FLASK_ENV="development"  # Windows PowerShell
python app.py
```

## Security Notes

- Never commit your `.env` file or API keys to version control
- The `.gitignore` file is configured to exclude sensitive files
- Uploaded files are automatically deleted after processing
- Consider adding authentication for production use

## Cost Considerations

OpenAI API usage costs:
- Whisper: ~$0.006 per minute of audio
- GPT-4: Variable based on token usage

Monitor your usage on the [OpenAI dashboard](https://platform.openai.com/usage).

## License

MIT
