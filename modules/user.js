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
  },
  getMe: {
    name: 'get_me',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')

      try {
        await currentUser.fetch(asMaster)

        let highestRole = currentUser.get('highestRole')
        await highestRole.fetch(asMaster)
        highestRole = {
          name: highestRole.get('name'),
          id: highestRole.id
        }
        const playerName = currentUser.get('playerName') || currentUser.get('username') || ''
        const studyProgram = currentUser.get('studyProgram') || { id: '' }
        const studyProgramId = studyProgram.id
        const avatarUrl = currentUser.get('avatarUrl') || ''
        const username = currentUser.get('username') || ''
        const email = currentUser.get('email') || ''

        return { playerName, studyProgramId, avatarUrl, username, email, highestRole }
      } catch (error) {
        throw error
      }
    }
  }
}
