module.exports.serializeUser = (user) => {
  return {
    firstName: user.firstName,
    id: user._id,
    image: user.image,
    middleName: user.middleName,
    permission: user.permission,
    surName: user.surName,
    username: user.userName,
  }
}

module.exports.serializeNewsList = (news) => {
    return {
      text: news.text,
      title: news.title,
      id: news._id,
      user: {
        firstName: news.user.firstName,
        id: news.user._id,
        image: news.user.image,
        middleName: news.user.middleName,
        surName: news.user.surName,
        username: news.user.userName
      }
    }
}
