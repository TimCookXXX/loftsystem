const express = require('express')
const router = express.Router()
const tokens = require('../auth/tokens')
const passport = require('passport')
const db = require('../models')
const helper = require('../helpers/serialize')
const formidable = require('formidable')
const fs = require('fs')
const path = require('path')
const Jimp = require('jimp')

const auth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (!user || err) {
      return res.status(401).json({
        code: 401,
        message: 'Unauthorized',
      })
    }
    req.user = user
    next()
  })(req, res, next)
}

router.post('/registration', async (req, res) => {
  const { username } = req.body
  const user = await db.getUserByName(username)
  const validate = /^\s*$/
  if (user) {
    return res.status(409).json({
      message: `Пользователь ${username} существует`,
    })
  }
  try {
    const newUser = await db.createUser(req.body)
    if (validate.test(newUser.userName)) {
      return res.status(409).json({
        message: `Имя обязательно`
      })
    }
    const token = await tokens.createTokens(newUser)
    res.json({
      ...helper.serializeUser(newUser),
      ...token,
    })
  } catch (e) {
    console.log(e)
    res.status(500).json({ message: e.message })
  }
})

router.post('/login', async (req, res, next) => {
  passport.authenticate(
    'local',
    { session: false },
    async (err, user, info) => {
      if (err) {
        return next(err)
      }
      if (!user) {
        return res.status(400).json({ message: 'Не правильный логин/пароль' })
      }
      if (user) {
        const token = await tokens.createTokens(user)
        console.log(token)
        res.json({
          ...helper.serializeUser(user),
          ...token,
        })
      }
    }
  )(req, res, next)
})

router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.headers['authorization']
  const data = await tokens.refreshTokens(refreshToken)
  res.json({ ...data })
})

router.get('/profile', auth, async (req, res) => {
  const user = req.user
  res.json({
    ...helper.serializeUser(user),
  })
})

const validation = (fields, files) => {
  const validate = /^\s*$/
  
  if (fields.newPassword === "" && fields.oldPassword !== "") {
    return { status: 'Не указан новый пароль', err: true }
  }

  if (fields.newPassword !== "" && fields.oldPassword === "") {
    return { status: 'Не указан старый пароль', err: true }
  }

  if (validate.test(fields.firstName)) return { status: 'Поле имени пустое', err: true }
  if (validate.test(fields.surName)) return { status: 'Поле фамилии пустое', err: true }
  if (validate.test(fields.middleName)) return { status: 'Поле отчество пустое', err: true }

  return { status: 'Ok', err: false }
}

router.patch('/profile', auth, async (req, res) => {
  const user = req.user
  const form = new formidable.IncomingForm()
  form.uploadDir = path.join(process.cwd(), "upload")
  form.parse(req, async function (err, fields, files) {
    if (err) {
      return err
    }
    const valid = validation(fields, files)

    // console.log(files);
    
    if (valid.err) {
      if (files.avatar) fs.unlinkSync(path.join(process.cwd(), "upload", files.avatar.newFilename))
      return res.status(409).json({ message: valid.status })
    }
    if (files.avatar) {
      const pathToImage = path.join(process.cwd(), "upload", files.avatar.newFilename)
      const image = await Jimp.read(pathToImage)
      await image.resize(150, 150)
      await image.writeAsync(path.join(process.cwd(), "upload", files.avatar.newFilename))
      const dirImage = path.join('/', files.avatar.newFilename)
      fields.image = dirImage
    } 
    const newUser = await db.updateUserById(user._id, fields)
    if (!newUser) {
      return res.status(409).json({ message: "Старый пароль неверен" })
    }

    if (newUser.oldImage) {
      fs.unlinkSync(path.join(process.cwd(), "upload", newUser.oldImage))
    }

    res.json({
      ...helper.serializeUser(newUser),
    })
  })

})

router.get('/users', auth, async (req, res) => {
  const users = await db.getUsers()
  const shortUsers = users.map((user) => helper.serializeUser(user))
  res.json(shortUsers)
  console.log(1)
})

router.delete('/users/:id', auth, async (req, res) => {
  const user = await db.deleteUserById(req.params.id)
  return res.json(user)
})

router.patch('/users/:id/:permission', auth, async (req, res, next) => {
  if (req.params.permission === 'permission') {
    const user = await db.changeUserPermissions(
      req.params.id,
      req.params.permission
    )
    res.json(user)
  } else next()
})

router.get('/news', auth, async (req, res) => {
  const news = await db.getNews()
  const cutNews = news.map((news) => helper.serializeNewsList(news))
  res.json(cutNews)
})

router.post('/news', auth, async (req, res) => {
  const news = await db.createNews(req.user, req.body)
  const cutNews = news.map((news) => helper.serializeNewsList(news))
  res.json(cutNews)
  console.log('news POST')
})

router.patch('/news/:id', auth, async (req, res) => {
  const news = await db.updateNewsById(req.params.id, req.body)
  const cutNews = news.map((news) => helper.serializeNewsList(news))
  res.json(cutNews)
  console.log('news PATCH')
})

router.delete('/news/:id', auth, async (req, res) => {
  const news = await db.deleteNewsById(req.params.id)
  console.log(req.params.id)
  res.json(news.map((news) => helper.serializeNewsList(news)))
})

module.exports = router
