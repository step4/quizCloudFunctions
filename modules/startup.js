const axios = require('axios')
const appId = process.env.APP_ID || 'parseServerId'
const masterKey = process.env.MASTER_KEY || 'parseMasterKey'
const serverURLBackend = process.env.SERVER_URL_BACKEND || '127.0.0.1'

module.exports = {
  serverStartup: async request => {
    console.log('cloud funciton started')
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
      console.log('get schema')
      let result = await axios.get(`${serverURLBackend}/schemas`, { headers })
      result.data.results.forEach(async element => {
        // if (element.className != '_User') {
        // console.log('working on: ', element.className)
        let clp = null
        if (element.className === '_User' || element.className === '_Role') clp = initialCLPUserRole
        else clp = initialCLP

        try {
          let result = await axios.put(
            `${serverURLBackend}/schemas/${element.className}`,
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
