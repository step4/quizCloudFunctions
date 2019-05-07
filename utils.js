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

getObjectIfExist = async (className, id) => {
  const Object = Parse.Object.extend(className)
  let objectQuery = new Parse.Query(Object)
  let object
  try {
    object = await objectQuery.get(id, asMaster)
    if (!object) {
      throw `object of class: ${className} with id: ${id} not found`
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
  getObjectIfExist,
  createNewObject
}
