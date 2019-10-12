const asMaster = {
  useMasterKey: true
}

isLoggedIn = async user => {
  return !!user
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
  } catch (error) {
    throw error
  }

  return true
}

getObjectById = async (className, id) => {
  let Class
  if (typeof className === 'string') {
    Class = Parse.Object.extend(className)
  } else if (typeof className === 'function') {
    classname = className.name
    Class = Parse.Object.extend(className)
  } else {
    throw new Error('First parameter is not a string or a parse class')
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
    return null
  }
}
getObjectByName = async (className, name) => {
  let Class
  if (typeof className === 'string') {
    Class = Parse.Object.extend(className)
  } else if (typeof className === 'function') {
    className = className.className
    Class = Parse.Object.extend(className)
  } else {
    throw new Error('First parameter is not a string or a parse class')
  }

  let objectQuery = new Parse.Query(Class)
  objectQuery.equalTo('name', name)
  let object
  try {
    object = await objectQuery.first(asMaster)
    if (!object) {
      throw new Error(`object of class '${className}' with name '${name}' not found`)
    }
    return object
  } catch (error) {
    return null
  }
}

createNewObject = async className => {
  return new (Parse.Object.extend(className))()
}

function isSetAndOfType(object, type) {
  return object !== undefined && typeof object === type
}

module.exports = {
  asMaster,
  isLoggedIn,
  hasAdminPermission,
  hasLecturerPermission,
  getObjectById,
  getObjectByName,
  createNewObject,
  isSetAndOfType
}
