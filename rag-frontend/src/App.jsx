import { useState } from "react"
import axios from "axios"

const API = "https://khalid-rag-backend.onrender.com"

function App() {

  const [file, setFile] = useState(null)
  const [message, setMessage] = useState("")
  const [chat, setChat] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  const uploadPDF = async () => {

    if (!file) {
      alert("Please select a PDF")
      return
    }

    const formData = new FormData()

    formData.append("file", file)

    setLoading(true)

    try {

      await axios.post(`${API}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })

      setUploaded(true)

    } catch (error) {

      console.error(error)

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

      const res = await axios.post(`${API}/chat`, {
        message
      })

      setChat([
        ...updatedChat,
        { role: "bot", content: res.data.reply }
      ])

    } catch (err) {

      setChat([
        ...updatedChat,
        { role: "bot", content: "Error getting response" }
      ])

    }

    setLoading(false)
  }

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>

      <h1>RAG AI Assistant</h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={uploadPDF}>
        Upload PDF
      </button>

      {uploaded && <p>✅ PDF uploaded successfully</p>}

      <div style={{ height: "300px", overflow: "auto", marginTop: "20px" }}>

        {chat.map((msg, i) => (
          <div key={i}>
            <b>{msg.role}:</b> {msg.content}
          </div>
        ))}

      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask a question..."
      />

      <button onClick={sendMessage}>
        Send
      </button>

    </div>
  )
}

export default App