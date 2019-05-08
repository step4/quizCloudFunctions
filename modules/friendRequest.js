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

const FriendRequest = Parse.Object.extend('FriendRequest')
const User = Parse.Object.extend('User')

module.exports = {
  sendFriendRequest: {
    name: 'send_friend_request',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')

      const { friendId } = request.params
      let friendRequest = new FriendRequest()

      try {
        friendRequest.set('accepted', false)
        friendRequest.set('from', currentUser)
        let friend = await getObjectById(User, friendId)
        friendRequest.set('to', friend)
        friendRequest.save(null, asMaster)
      } catch (error) {
        friendRequest.destroy(asMaster)
        throw error
      }

      return true
    }
  },
  acceptFriendRequest: {
    name: 'accept_friend_request',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')

      const { friendRequestId } = request.params

      try {
        let friendRequest = await getObjectById(FriendRequest, friendRequestId)
        friendRequest.set('accepted', true)
        let fromUser = friendRequest.get('from')
        let toUser = friendRequest.get('to')

        let fromFriendListRelation = fromUser.relation('friendList')
        fromFriendListRelation.add(toUser)

        let toFriendListRelation = toUser.relation('friendList')
        toFriendListRelation.add(fromUser)

        await friendRequest.save(null, asMaster)
        await fromUser.save(null, asMaster)
        await toUser.save(null, asMaster)
      } catch (error) {
        throw error
      }

      return true
    }
  }
}
