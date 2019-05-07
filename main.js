const automaticModuleDefinitions = []
var Auth = require('./modules/auth')
var Startup = require('./modules/startup')

automaticModuleDefinitions.push( require('./modules/studyProgram') )
automaticModuleDefinitions.push( require('./modules/course') )
automaticModuleDefinitions.push( require('./modules/question') )

Parse.Cloud.define('user_login', Auth.userLogin)

Parse.Cloud.define('server_startup', Startup.serverStartup)

automaticModuleDefinitions.forEach(moduleDefiniton=>{
    for(var cloudFunction in moduleDefiniton){
        Parse.Cloud.define(moduleDefiniton[cloudFunction].name,moduleDefiniton[cloudFunction].handler)
    }
})
