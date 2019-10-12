const axios = require('axios')
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

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
      user.set('firstname', '')
      user.set('lastname', '')
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
        user.set('highestRole', studentRole)
        await user.save(null, { useMasterKey: true })
      } catch (error) {
        throw error
      }
    }

    user = await Parse.User.logIn(username, username)

    return user.getSessionToken()
  },
  setStudentRole: async request => {
    const user = request.object
    if (user.get('highestRole')) return
    let studentRoleQuery = new Parse.Query(Parse.Role)
    studentRoleQuery.equalTo('name', 'student')
    studentRole = await studentRoleQuery.first({ useMasterKey: true })

    user.set('highestRole', studentRole)
  },
  addUserToStudentRole: async request => {
    const user = request.object
    if (user.get('highestRole')) return
    let studentRoleQuery = new Parse.Query(Parse.Role)
    studentRoleQuery.equalTo('name', 'student')
    studentRole = await studentRoleQuery.first({ useMasterKey: true })
    if (studentRole) {
      studentRole.getUsers().add(user)
      await studentRole.save(null, { useMasterKey: true })
    }
  },
  sendNotificationToAdmin: async request => {
    const user = request.object
    const userInfo = `ID: ${user.id}\n
    Name: ${user.get('username')}\n
    EMail: ${user.get('email')}`
    const message = {
      personalizations: [{ to: [{ email: 'rausch2@hs-koblenz.de' }] }],
      from: { email: 'admin@studyquiz.de' },
      subject: 'Neuer User registriert',
      content: [{ type: 'text/plain', value: userInfo }]
    }
    const headers = {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    }
    let result = await axios.post(`https://api.sendgrid.com/v3/mail/send`, message, { headers })
  }
}
