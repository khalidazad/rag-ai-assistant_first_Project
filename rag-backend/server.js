import "dotenv/config"
import express from "express"
import multer from "multer"
import cors from "cors"
import OpenAI from "openai"
import pdfParse from "pdf-parse"

const app = express()

app.use(express.json())

app.use(cors({
  origin: "*"
}))

const upload = multer({ storage: multer.memoryStorage() })

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
})

let documents = []

function cosineSimilarity(a, b) {

  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

  return dot / (magA * magB)
}

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

app.post("/upload", upload.single("file"), async (req, res) => {

  try {

    const data = await pdfParse(req.file.buffer)

    const chunks = chunkText(data.text)

    documents = []

    for (const chunk of chunks) {

      const embedding = await openai.embeddings.create({
        model: "openai/text-embedding-3-small",
        input: chunk
      })

      documents.push({
        text: chunk,
        embedding: embedding.data[0].embedding
      })
    }

    res.json({ message: "PDF processed successfully" })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      error: err.message
    })

  }

})

app.post("/chat", async (req, res) => {

  try {

    if (!documents.length) {
      return res.status(400).json({ error: "Upload a PDF first" })
    }

    const { message } = req.body

    const queryEmbedding = await openai.embeddings.create({
      model: "openai/text-embedding-3-small",
      input: message
    })

    const queryVector = queryEmbedding.data[0].embedding

    const scoredDocs = documents.map(doc => ({
      ...doc,
      score: cosineSimilarity(queryVector, doc.embedding)
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
          content: "Answer ONLY from the provided context."
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion:\n${message}`
        }
      ]
    })

    res.json({
      reply: completion.choices[0].message.content
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      error: "Chat failed"
    })

  }

})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})