const express = require('express')
const path = require('path')
const app = express()
const http = require('http')
const server = http.createServer(app)
const wss = require('socket.io').listen(server)
require('dotenv').config()

require('./models/connection') // Подключение к БД

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(function (_, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  next()
})
app.use(express.static(path.join(process.cwd(), 'build')))
app.use(express.static(path.join(process.cwd(), 'upload')))

require('./auth/passport')

app.use('/api', require('./routes'))

app.use('*', (_req, res) => {
  const file = path.resolve(process.cwd(), 'build', 'index.html')
  res.sendFile(file)
})

app.use((err, req, res, next) => {
  console.log(err.stack)
  res.status(500).json({
    code: 500,
    message: err.message,
  })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, function () {
  console.log('Environment')
  console.log(`Server running. Use our API on port: ${PORT}`)
})

const connectUsers = {}
const historyMessage = {}

wss.on('connection', (socket) => {
  const socketId = socket.id

  socket.on('users:connect', (data) => {
    console.log(data)
    const user = { ...data, socketId, activeRoom: null }

    connectUsers[socketId] = user

    console.log(Object.values(connectUsers))

    socket.emit('users:list', Object.values(connectUsers))
    socket.broadcast.emit('users:add', user)
  })
  socket.on('message:add', (data) => {
    const { senderId, recipientId } = data

    const validate = /^\s*$/

    if (validate.test(data.text)) {
      console.log('Пустой текст')
    } else {
      socket.emit('message:add', data)

      socket.broadcast.to(data.roomId).emit('message:add', data)
      addHistory(senderId, recipientId, data)
      addHistory(recipientId, senderId, data)
    }
  })
  socket.on('message:history', (data) => {
    if (
      historyMessage[data.userId] &&
      historyMessage[data.userId][data.recipientId]
    ) {
      socket.emit(
        'message:history',
        historyMessage[data.userId][data.recipientId]
      )
    }
  })
  socket.on('disconnect', (data) => {
    delete connectUsers[socketId]
    socket.broadcast.emit('users:leave', socketId)
  })
})

function addHistory(senderId, recipientId, data) {
  if (historyMessage[senderId]) {
    if (historyMessage[senderId][recipientId]) {
      historyMessage[senderId][recipientId].push(data)
    } else {
      historyMessage[senderId][recipientId] = []
      historyMessage[senderId][recipientId].push(data)
    }
  } else {
    historyMessage[senderId] = {}
    historyMessage[senderId][recipientId] = []
    historyMessage[senderId][recipientId].push(data)
  }
}

module.exports = { app: app, server: server }
