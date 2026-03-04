import { useState } from "react"
import axios from "axios"

const API = "https://your-backend-url.up.railway.app"

function App() {

  const [file, setFile] = useState(null)
  const [message, setMessage] = useState("")
  const [chat, setChat] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  const uploadPDF = async () => {

    if (!file) {
      alert("Please select a PDF file")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    setLoading(true)

    try {

      await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })

      setUploaded(true)

    } catch (err) {

      console.error(err)
      alert("Upload failed")

    }

    setLoading(false)
  }

  const sendMessage = async () => {

    if (!message.trim()) return

    const updatedChat = [...chat, { role: "user", content: message }]
    setChat(updatedChat)

    setMessage("")
    setLoading(true)

    try {

      const res = await axios.post(`${API}/chat`, { message })

      setChat([
        ...updatedChat,
        { role: "bot", content: res.data.reply }
      ])

    } catch (err) {

      setChat([
        ...updatedChat,
        { role: "bot", content: "Error getting response." }
      ])

    }

    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage()
  }

  return (
    <div style={styles.page}>

      <div style={styles.card}>

        <h1 style={styles.title}>RAG AI Assistant</h1>

        {/* Upload Section */}

        <div style={styles.uploadSection}>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button style={styles.primaryBtn} onClick={uploadPDF}>
            Upload PDF
          </button>

        </div>

        {uploaded && (
          <div style={styles.successBox}>
            Document processed successfully
          </div>
        )}

        {/* Chat Window */}

        <div style={styles.chatBox}>

          {chat.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.message,
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                background: msg.role === "user" ? "#2563eb" : "#f1f5f9",
                color: msg.role === "user" ? "white" : "#111"
              }}
            >
              {msg.content}
            </div>
          ))}

          {loading && (
            <div style={styles.loading}>
              AI is thinking...
            </div>
          )}

        </div>

        {/* Input Area */}

        <div style={styles.inputArea}>

          <input
            style={styles.input}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the document..."
          />

          <button style={styles.primaryBtn} onClick={sendMessage}>
            Send
          </button>

        </div>

      </div>

    </div>
  )
}

const styles = {

  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#f1f5f9,#e2e8f0)",
    fontFamily: "Inter, sans-serif"
  },

  card: {
    width: "800px",
    background: "white",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column"
  },

  title: {
    textAlign: "center",
    marginBottom: "20px"
  },

  uploadSection: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px"
  },

  successBox: {
    background: "#dcfce7",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "15px",
    color: "#166534"
  },

  chatBox: {
    height: "350px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "15px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "15px"
  },

  message: {
    padding: "10px 14px",
    borderRadius: "12px",
    maxWidth: "70%",
    fontSize: "14px"
  },

  inputArea: {
    display: "flex",
    gap: "10px"
  },

  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc"
  },

  primaryBtn: {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer"
  },

  loading: {
    fontStyle: "italic",
    color: "#64748b"
  }

}

export default App