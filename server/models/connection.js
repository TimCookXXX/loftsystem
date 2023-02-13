const mongoose = require('mongoose')

mongoose.set('strictQuery', true)

let uri = process.env.uriDB

mongoose.Promise = global.Promise
mongoose.connect(uri)

mongoose.connection.on('connected', () => {
  console.log(`Mongoose connection open`)
})

mongoose.connection.on('error', (error) => {
  console.log('Mongoose connection error' + error)
})

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected')
})

process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('Mongoose connection disconnected app termination')
    process.exit(1)
  })
})
