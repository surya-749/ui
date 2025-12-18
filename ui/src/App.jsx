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
          <div className="brand">
            <div className="brand-mark" aria-hidden="true" />
            <span className="brand-name">Smart Office</span>
          </div>
          <nav className="header-actions" aria-label="Primary">
            <a className="header-link" href="#add-docs">Add Docs</a>
            <a className="header-link" href="#results">Results</a>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <section className="hero">
          <div className="hero-left">
            <p className="hero-kicker">Smart Office Automation Agent</p>
            <h1 className="hero-title">Add docs. Get a summary. Action the follow‑ups.</h1>
            <p className="hero-subtitle">
              Upload a meeting recording or voice note. The agent extracts a clean summary and the next steps you can act on.
            </p>
            <ul className="hero-points">
              <li>Audio & video supported</li>
              <li>Clear, structured follow‑ups</li>
              <li>Fast turnaround for busy teams</li>
            </ul>
            <p className="hero-hint">Tip: drop a file on the right to continue.</p>
          </div>

          <div className="hero-right" id="add-docs">
            <div className="add-docs-card">
              <div className="card-top">
                <div>
                  <h2 className="card-title">Add Docs</h2>
                  <p className="card-subtitle">Upload audio/video to generate summary + follow‑ups.</p>
                </div>
                <div className="card-badge" aria-label="Secure">Private</div>
              </div>

              <div
                className={`drop-zone ${file ? 'has-file' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload audio or video"
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
                    <div className="upload-icon" aria-hidden="true">⬆</div>
                    <h3>Drop your file here</h3>
                    <p>or click to browse</p>
                    <small>MP3, MP4, WAV, M4A, WEBM (max 25MB)</small>
                  </div>
                ) : (
                  <div className="file-info">
                    <div className="file-icon" aria-hidden="true">
                      {file.type.startsWith('video') ? '🎥' : '🎵'}
                    </div>
                    <div className="file-details">
                      <h3>{file.name}</h3>
                      <p>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <button
                      className="clear-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClear()
                      }}
                      aria-label="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {file && !isProcessing && !results && (
                <button className="process-btn" onClick={handleProcess}>
                  Process with AI
                </button>
              )}

              {isProcessing && (
                <div className="processing-status">
                  <div className="spinner" aria-hidden="true"></div>
                  <p>Processing…</p>
                  <div className="progress-bar" aria-label="Upload progress">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <small>{uploadProgress}% complete</small>
                </div>
              )}
            </div>
          </div>
        </section>

        {results && (
          <div className="results-section" id="results">
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
        <p>Secure & confidential processing</p>
      </footer>
    </div>
  )
}

export default App
