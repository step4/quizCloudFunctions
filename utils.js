const asMaster = {
  useMasterKey: true
}

isLoggedIn = async user => {
  if (!user) throw 'not authorized, please login'
  return true
}

hasLecturerPermission = async user => {
  let isAdminRoleQuery = new Parse.Query(Parse.Role)
  isAdminRoleQuery.equalTo('name', 'admin')
  isAdminRoleQuery.equalTo('users', user)

  let isLecturerRoleQuery = new Parse.Query(Parse.Role)
  isLecturerRoleQuery.equalTo('name', 'lecturer')
  isLecturerRoleQuery.equalTo('users', user)

  let mainQuery = Parse.Query.or(isAdminRoleQuery, isLecturerRoleQuery)
  try {
    let queryRes = await mainQuery.first(asMaster)
    if (!queryRes) throw 'not authorized, wrong role'
  } catch (error) {
    throw error
  }

  return true
}

hasAdminPermission = async user => {
  let isAdminRoleQuery = new Parse.Query(Parse.Role)
  isAdminRoleQuery.equalTo('name', 'admin')
  isAdminRoleQuery.equalTo('users', user)
  try {
    let queryRes = await isAdminRoleQuery.first(asMaster)
    if (!queryRes) throw 'not authorized, wrong role'
  } catch (error) {
    throw error
  }

  return true
}

getObjectById = async (className, id) => {
  let Class
  if(typeof className === 'string'){
    Class = Parse.Object.extend(className)
  }else if(typeof className === 'function'){
    classname = className.name
    Class = Parse.Object.extend(className)
  }else{
    throw new Error("First parameter is not a string or a parse class")
  }
  let objectQuery = new Parse.Query(Class)
  let object
  try {
    object = await objectQuery.get(id, asMaster)
    if (!object) {
      throw new Error(`object of class '${className}' with id '${id}' not found`)
    }
    return object
  } catch (error) {
    throw error
  }
}
getObjectByName = async (className, name) => {
  let Class
  if(typeof className === 'string'){
    Class = Parse.Object.extend(className)
  }else if(typeof className === 'function'){
    className = className.className
    Class = Parse.Object.extend(className)
  }else{
    throw new Error("First parameter is not a string or a parse class")
  }

  let objectQuery = new Parse.Query(Class)
  objectQuery.equalTo('name',name)
  let object
  try {
    object = await objectQuery.first(asMaster)
    if (!object) {
      throw new Error(`object of class '${className}' with name '${name}' not found`)
    }
    return object
  } catch (error) {
    throw error
  }
}

createNewObject = async className => {
  return new (Parse.Object.extend(className))()
}

module.exports = {
  asMaster,
  isLoggedIn,
  hasAdminPermission,
  hasLecturerPermission,
  getObjectById,
  getObjectByName,
  createNewObject
}
