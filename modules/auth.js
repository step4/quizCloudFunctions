module.exports = {
  userLogin: async request => {
    if (!request.master) {
      throw 'not authorized'
    }
    let username = request.params.nameID
    let query = new Parse.Query('User')
    query.equalTo('username', username)
    let result = await query.find({ useMasterKey: true })

    //TODO
    // set roles

    let user = new Parse.User()

    if (result.length == 0) {
      user.set('username', username)
      user.set('password', username)
      user.set('email', '')
      user.set('firstName', '')
      user.set('lastName', '')
      user.set('studyProgram', null)

      try {
        await user.signUp(null, { useMasterKey: true })
        user.setACL(new Parse.ACL(user))
        await user.save(null, { useMasterKey: true })
      } catch (error) {
        throw error
      }
      let studentRole
      try {
        let studentRoleQuery = new Parse.Query(Parse.Role)
        studentRoleQuery.equalTo('name', 'student')
        studentRole = await studentRoleQuery.first({ useMasterKey: true })
        if (studentRole) {
          studentRole.getUsers().add(user)
          await studentRole.save(null, { useMasterKey: true })
        }
      } catch (error) {
        throw error
      }

      try {
        user.set('role', studentRole)
        await user.save(null, { useMasterKey: true })
      } catch (error) {
        throw error
      }
    }

    user = await Parse.User.logIn(username, username)

    return user.getSessionToken()
  }
}
