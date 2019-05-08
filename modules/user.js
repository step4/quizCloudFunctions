const {
  asMaster,
  isLoggedIn,
  hasAdminPermission,
  hasLecturerPermission,
  getObjectById,
  getObjectByName,
  createNewObject,
  isSetAndOfType
} = require('../utils')

const User = Parse.Object.extend('User')

module.exports = {
  searchUser: {
    name: 'search_user',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')

      const { playerName } = request.params

      try {
        let userQuery = new Parse.Query(User)
        userQuery.equalTo('playerName', playerName)
        let user = await userQuery.first(asMaster)
        if (!user) {
          throw new Error(`no user found with player name ${playerName}`)
        }
        return { userId: user.id, playerName }
      } catch (error) {
        throw error
      }
    }
  }
}
