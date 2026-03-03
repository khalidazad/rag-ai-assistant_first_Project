import "dotenv/config"
import express from "express"
import multer from "multer"
import cors from "cors"
import OpenAI from "openai"
import { createRequire } from "module"

const require = createRequire(import.meta.url)
const pdfParse = require("pdf-parse")

const app = express()
app.use(express.json())
app.use(cors())

const upload = multer({ storage: multer.memoryStorage() })
console.log("API KEY:", process.env.OPENAI_API_KEY)

// 🔥 OpenRouter Client
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,  // ← changed
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "RAG Demo",
  },
})

let documents = []

// Cosine similarity
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dot / (magA * magB)
}

// Chunk text
function chunkText(text, size = 1000, overlap = 200) {
  const chunks = []
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size))
  }
  return chunks
}

app.get("/", (req, res) => {
  res.send("RAG Backend Running 🚀")
})

// 📄 Upload PDF
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    const data = await pdfParse(req.file.buffer)
    const text = data.text

    const chunks = chunkText(text)
    documents = []

    for (const chunk of chunks) {
      const embedding = await openai.embeddings.create({
        model: "openai/text-embedding-3-small",
        input: chunk,
      })

      documents.push({
        text: chunk,
        embedding: embedding.data[0].embedding,
      })
    }

    res.json({ message: "PDF processed & embedded ✅" })

  } catch (err) {
     console.error("UPLOAD ERROR:", err)
  res.status(500).json({ error: err.message })
  }
})

// 💬 Chat Endpoint
app.post("/chat", async (req, res) => {
  try {
    if (!documents.length) {
      return res.status(400).json({ error: "Upload PDF first" })
    }

    const { message } = req.body

    const queryEmbedding = await openai.embeddings.create({
      model: "openai/text-embedding-3-small",
      input: message,
    })

    const queryVector = queryEmbedding.data[0].embedding

    const scoredDocs = documents.map(doc => ({
      ...doc,
      score: cosineSimilarity(queryVector, doc.embedding),
    }))

    const topDocs = scoredDocs
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)

    const context = topDocs.map(d => d.text).join("\n\n")

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Answer ONLY using the provided context. If not found, say 'I don't know'.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion:\n${message}`,
        },
      ],
    })

    res.json({ reply: completion.choices[0].message.content })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Chat failed" })
  }
})

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000")
})

