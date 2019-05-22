const {
  asMaster,
  isLoggedIn,
  hasAdminPermission,
  hasLecturerPermission,
  getObjectById,
  getObjectByName,
  createNewObject
} = require('../utils')

const Course = Parse.Object.extend('Course')
const StudyProgram = Parse.Object.extend('StudyProgram')

module.exports = {
  getCourses: {
    name: 'get_courses',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')

      const { id } = request.params

      try {
        let studyProgram = await getObjectById(StudyProgram, id)
        let coursesRelation = studyProgram.relation('courses')
        let coursesQuery = coursesRelation.query()
        let courses = await coursesQuery.find(asMaster)
        return courses.map(element => {
          return {
            id: element.id,
            name: element.get('name')
          }
        })
      } catch (error) {
        throw error
      }
    }
  }
}
