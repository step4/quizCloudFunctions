const { asMaster, isLoggedIn, hasAdminPermission, hasLecturerPermission, getObjectById, getObjectByName, createNewObject } = require('../utils')

const StudyProgram = Parse.Object.extend('StudyProgram')
const Faculty = Parse.Object.extend('Faculty')

module.exports = {
  getStudyPrograms: {
    name: 'get_studyprograms',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')

      let { withIcons } = request.params
      const sendIcons = withIcons === undefined ? true : withIcons == 'true'

      let facultyQuery = new Parse.Query(Faculty)
      let faculties
      let studyProgramsResponse = []
      try {
        faculties = await facultyQuery.find(asMaster)
        if (!faculties) throw new Error('No faculties available')

        for (const faculty of faculties) {
          let name = faculty.get('name')
          let id = faculty.id
          let studyProgramsRelation = faculty.relation('studyPrograms')
          let studyProgramsQuery = studyProgramsRelation.query()
          let studyPrograms = await studyProgramsQuery.find(asMaster)
          studyPrograms = studyPrograms.map(studyProgram => {
            const id = studyProgram.id
            const name = studyProgram.get('name')
            const shortName = studyProgram.get('shortName')
            const iconB64 = sendIcons ? studyProgram.get('iconB64') : ''
            return { id, name, iconB64, shortName }
          })
          studyProgramsResponse.push({ id, name, studyPrograms })
        }
      } catch (error) {
        throw error
      }

      return studyProgramsResponse
    }
  },
  getStudyProgram: {
    name: 'get_studyprogram',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')

      let { id } = request.params

      try {
        let studyProgram = await getObjectById(StudyProgram, id)
        id = studyProgram.id
        const name = studyProgram.get('name')
        const shortName = studyProgram.get('shortName')
        const iconB64 = studyProgram.get('iconB64')
        return { id, name, iconB64, shortName }
      } catch (error) {
        throw error
      }
    }
  },
  setStudyProgram: {
    name: 'set_studyprogram',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')

      const { id } = request.params
      try {
        if (id) {
          let studyProgram = await getObjectById(StudyProgram, id)
          currentUser.set('studyProgram', studyProgram)
        } else {
          throw new Error('ID of studyprogram not set')
        }

        await currentUser.save(null, asMaster)
      } catch (error) {
        throw error
      }

      return true
    }
  },
  createStudyPrograms: {
    name: 'create_new_studyprogram',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')
      if (!(await hasAdminPermission(currentUser))) return new Error('User has no admin rights')

      const { name, facultyId, iconB64 } = request.params
      let newStudyProgram = new StudyProgram()
      try {
        newStudyProgram.set('name', name)
        let faculty = await getObjectById(Faculty, facultyId)
        newStudyProgram.set('faculty', faculty)
        newStudyProgram.set('iconB64', iconB64)
        await newStudyProgram.save(null, asMaster)
      } catch (error) {
        throw error
      }

      return true
    }
  }
}
