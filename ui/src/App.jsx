import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResults(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setResults(null)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleProcess = async () => {
    if (!file) return

    setIsProcessing(true)
    setUploadProgress(0)

    try {
      // Create FormData to send file to backend
      const formData = new FormData()
      formData.append('file', file)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      // Call Flask backend API
      const response = await fetch('http://localhost:5000/api/process', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process file')
      }

      const data = await response.json()
      
      // Format results for display
      setResults({
        summary: data.summary,
        followUps: data.followUps || [],
        transcript: data.transcript,
        timestamp: new Date().toLocaleString(),
        duration: file.type.startsWith('video') ? "Processing complete" : "Processing complete"
      })
      
      setIsProcessing(false)
      setUploadProgress(0)
    } catch (error) {
      console.error('Error processing file:', error)
      alert(`Error: ${error.message}. Make sure the backend server is running.`)
      setIsProcessing(false)
      setUploadProgress(0)
    }
  }

  const handleClear = () => {
    setFile(null)
    setResults(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Smart Office Automation Agent</h1>
          <p>Transform your audio/video meetings into actionable insights</p>
        </div>
      </header>

      <main className="main-content">
        <div className="upload-section">
          <div 
            className={`drop-zone ${file ? 'has-file' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {!file ? (
              <div className="drop-zone-content">
                <div className="upload-icon">📁</div>
                <h3>Drop your audio/video file here</h3>
                <p>or click to browse</p>
                <small>Supports: MP3, MP4, WAV, M4A, MOV, AVI</small>
              </div>
            ) : (
              <div className="file-info">
                <div className="file-icon">
                  {file.type.startsWith('video') ? '🎥' : '🎵'}
                </div>
                <div className="file-details">
                  <h3>{file.name}</h3>
                  <p>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <button className="clear-btn" onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}>✕</button>
              </div>
            )}
          </div>

          {file && !isProcessing && !results && (
            <button className="process-btn" onClick={handleProcess}>
              Process with OpenAI
            </button>
          )}

          {isProcessing && (
            <div className="processing-status">
              <div className="spinner"></div>
              <p>Processing your file with AI...</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <small>{uploadProgress}% complete</small>
            </div>
          )}
        </div>

        {results && (
          <div className="results-section">
            <div className="results-header">
              <h2>📊 Results</h2>
              <div className="results-meta">
                <span>⏱️ Duration: {results.duration}</span>
                <span>🕐 {results.timestamp}</span>
              </div>
            </div>

            <div className="summary-card">
              <h3>📝 Summary</h3>
              <p>{results.summary}</p>
            </div>

            <div className="followups-card">
              <h3>✅ Follow-up Actions</h3>
              <ul className="followup-list">
                {results.followUps.map((item, index) => (
                  <li key={index}>
                    <input type="checkbox" id={`task-${index}`} />
                    <label htmlFor={`task-${index}`}>{item}</label>
                  </li>
                ))}
              </ul>
            </div>

            <div className="action-buttons">
              <button className="secondary-btn">📥 Export PDF</button>
              <button className="secondary-btn">📧 Email Summary</button>
              <button className="primary-btn" onClick={handleClear}>
                Process Another File
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by OpenAI API | Secure & Confidential</p>
      </footer>
    </div>
  )
}

export default App
