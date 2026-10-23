const dns = require('node:dns')
dns.setServers(['8.8.8.8', '8.8.4.4'])
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const fileRoutes = require('./routes/file')

const app = express()

const PORT = process.env.PORT || 5000

const CLIENT_URL =
  process.env.CLIENT_URL ||
  'http://localhost:5174'

app.use(
  cors({
    origin: CLIENT_URL,
    methods: [
      'GET',
      'POST',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  })
)

app.use(
  express.json({
    limit: '1mb'
  })
)

app.use('/api/auth', authRoutes)
app.use('/api/files', fileRoutes)

app.get('/', (req, res) => {
  res.json({
    message:
      'Cloud Vault backend is running!'
  })
})

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(
      'MongoDB connected successfully!'
    )

    app.listen(PORT, () => {
      console.log(
        `Cloud Vault backend running on http://localhost:${PORT}`
      )
    })
  })
  .catch((error) => {
    console.error(
      'MongoDB connection failed:',
      error.message
    )
  })