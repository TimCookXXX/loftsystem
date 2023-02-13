const User = require('./schemas/user')
const News = require('./schemas/news')

module.exports.getUserByName = async (userName) => {
  return User.findOne({ userName })
}

module.exports.getUserById = async (id) => {
  return User.findById({ _id: id })
}

module.exports.getUsers = async () => {
  return User.find()
}

module.exports.updateUserById = async (id, newUser) => {
  const oldUser = await User.findById({ _id: id });
  
  if (newUser.oldPassword !== "" && newUser.newPassword !== "") {
    if (!oldUser.validPassword(newUser.oldPassword)) {
      return null
    }
    oldUser.setPassword(newUser.newPassword)
  }
  await User.findOneAndUpdate({ _id: id }, { $set: { firstName: newUser.firstName, surName: newUser.surName, middleName: newUser.middleName, hash: oldUser.hash, image: newUser.image } })
  const user = await User.findOne({ _id: id })
  if (oldUser.image !== user.image) user.oldImage = oldUser.image
  return user
}

module.exports.deleteUserById = async (id) => {
  const user = await User.findOneAndDelete({ _id: id })
  return user
}

module.exports.changeUserPermissions = async (id, permissions) => {
  await User.findOneAndUpdate({ _id: id }, { $set: { permission: permissions } })
  const user = await User.findOne({ _id: id })
  return user
}

module.exports.createUser = async (data) => {
  const { username, surName, firstName, middleName, password } = data
  const newUser = new User({
    userName: username,
    surName,
    firstName,
    middleName,
    image: '',
    permission: {
      chat: { C: true, R: true, U: true, D: true },
      news: { C: true, R: true, U: true, D: true },
      settings: { C: true, R: true, U: true, D: true },
    },
  })
  newUser.setPassword(password)
  const user = await newUser.save()
  console.log(user)
  return user
}

module.exports.getNews = async () => {
  const news = await News.find()
  return news
}

module.exports.createNews = async (user, data) => {
  const { title, text } = data
  const newNews = new News({
    title,
    text,
    user
  })
  await newNews.save()
  const news = await News.find()

  return news
}

module.exports.updateNewsById = async (id, data) => {
  await News.findOneAndUpdate({ _id: id }, { $set: { title: data.title, text: data.text } })
  const news = await News.find()
  return news
}

module.exports.deleteNewsById = async (id) => {
  await News.findOneAndDelete({ _id: id })
  const news = await News.find()
  return news
}

