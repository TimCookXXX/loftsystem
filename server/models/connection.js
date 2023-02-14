const mongoose = require('mongoose')

mongoose.set('strictQuery', true)

let uri = () => {
  if (process.env.NODE_ENV === 'development') {
    let uri = process.env.uriDEV
    return uri
  } else if (process.env.NODE_ENV === 'production') {
    let uri = process.env.uriPROD
    return uri
  }
}

mongoose.Promise = global.Promise
mongoose.connect(uri())

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
