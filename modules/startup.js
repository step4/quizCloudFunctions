const axios = require('axios')

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
      'X-Parse-Application-Id': 'gamification',
      'X-Parse-Master-Key': 'testMasterKey'
    }
    try {
      let result = await axios.get('https://studygraph.step4.de/api/schemas', { headers })
      result.data.results.forEach(async element => {
        // if (element.className != '_User') {
        let clp = null
        if (element.className === '_User' || element.className === '_Role') clp = initialCLPUserRole
        else clp = initialCLP

        try {
          let result = await axios.put(`https://studygraph.step4.de/api/schemas/${element.className}`, { classLevelPermissions: clp }, { headers })
        } catch (error) {
          console.log(error)
        }
        // }
      })
    } catch (error) {
      console.log(error)
    }

    return true
  }
}
