const axios = require('axios')

const appId = process.env.APP_ID || 'parseServerId'
const masterKey = process.env.MASTER_KEY || 'parseMasterKey'
const port = process.env.PORT || 8080

module.exports = {
  serverStartup: async request => {
    if (!request.master) {
      throw 'not authorized'
    }
    const initialCLP = {
      find: {},
      get: {},
      create: {},
      update: {},
      delete: {},
      addField: {}
    }
    const initialCLPUserRole = {
      find: {},
      get: {
        '*': true
      },
      create: {},
      update: {},
      delete: {},
      addField: {}
    }
    headers = {
      'X-Parse-Application-Id': appId,
      'X-Parse-Master-Key': masterKey
    }
    try {
      let result = await axios.get(`http://localhost:${port}/schemas`, { headers })
      result.data.results.forEach(async element => {
        // if (element.className != '_User') {
        let clp = null
        if (element.className === '_User' || element.className === '_Role') clp = initialCLPUserRole
        else clp = initialCLP

        try {
          let result = await axios.put(
            `http://localhost:${port}/schemas/${element.className}`,
            { classLevelPermissions: clp },
            { headers }
          )
        } catch (error) {
          console.log(error)
        }
        // }
      })
    } catch (error) {
      console.log(error)
      throw error
    }

    return true
  }
}
