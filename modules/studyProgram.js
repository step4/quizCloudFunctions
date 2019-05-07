const {
    asMaster,
    isLoggedIn,
    hasAdminPermission,
    hasLecturerPermission,
    getObjectById,
    getObjectByName,
    createNewObject
} = require('../utils')

const StudyProgram = Parse.Object.extend('StudyProgram')

module.exports = {
    getStudyPrograms: {
        name: 'get_studyprograms',
        handler: async request => {
            let currentUser = request.user
            if (!(await isLoggedIn(currentUser))) return new Error("User not logged in")

            let studyProgramQuery = new Parse.Query(StudyProgram)
            try {
                let studyPrograms = await studyProgramQuery.find(asMaster)
                if (!studyPrograms) {
                    throw new Error("No StudyPrograms available")
                }
                return studyPrograms
            } catch (error) {
                throw error
            }
        }
    },
    setStudyProgram: {
        name: 'set_studyprogram',
        handler: async request => {
            let currentUser = request.user
            if (!(await isLoggedIn(currentUser))) return new Error("User not logged in")

            const { studyProgramId, studyProgramName } = request.params
            try {
                if (studyProgramId) {
                    let studyProgram = await getObjectById(StudyProgram, studyProgramId)
                    currentUser.set('studyProgram', studyProgram)
                } else if (studyProgramName) {
                    let studyProgram = await getObjectByName(StudyProgram, studyProgramName)
                    currentUser.set('studyProgram', studyProgram)
                } else {
                    throw new Error('ID or name of studyprogram not set')
                }

                await currentUser.save(null, asMaster)
            } catch (error) {
                throw error
            }

            return true
        }
    }

}