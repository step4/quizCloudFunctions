const automaticModuleDefinitions = []
var Auth = require('./modules/auth')
var Startup = require('./modules/startup')

automaticModuleDefinitions.push(require('./modules/studyProgram'))
automaticModuleDefinitions.push(require('./modules/course'))
automaticModuleDefinitions.push(require('./modules/question'))
automaticModuleDefinitions.push(require('./modules/game'))
automaticModuleDefinitions.push(require('./modules/friendRequest'))
automaticModuleDefinitions.push(require('./modules/user'))
automaticModuleDefinitions.push(require('./modules/stats'))

Parse.Cloud.define('user_login', Auth.userLogin)
Parse.Cloud.beforeSave(Parse.User, Auth.setStudentRole)
Parse.Cloud.afterSave(Parse.User, Auth.addUserToStudentRole)
Parse.Cloud.afterSave(Parse.User, Auth.sendNotificationToAdmin)

Parse.Cloud.define('server_startup', Startup.serverStartup)

automaticModuleDefinitions.forEach(moduleDefiniton => {
  for (var cloudFunction in moduleDefiniton) {
    Parse.Cloud.define(moduleDefiniton[cloudFunction].name, moduleDefiniton[cloudFunction].handler)
  }
})
