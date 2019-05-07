var Auth = require('./modules/auth')
var Startup = require('./modules/startup')

Parse.Cloud.define('user_login', Auth.userLogin)

Parse.Cloud.define('server_startup', Startup.serverStartup)
