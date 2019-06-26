const {
  asMaster,
  isLoggedIn,
  hasAdminPermission,
  hasLecturerPermission,
  getObjectById,
  getObjectByName,
  createNewObject,
  isSetAndOfType
} = require('../utils')

const Question = Parse.Object.extend('Question')
const DeletedQuestion = Parse.Object.extend('DeletedQuestion')
const Course = Parse.Object.extend('Course')

module.exports = {
  addOrUpdateQuestion: {
    name: 'add_or_update_question',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')
      if (!(await hasLecturerPermission(currentUser))) return new Error('User is not lecturer')

      const { questionText, answers, difficulty, courseId, customTime, id, solutionText } = request.params
      isNewQuestion = id === null
      let question
      if (isNewQuestion) {
        question = new Question()
      } else {
        question = await getObjectById(Question, id)
      }
      question.set('createdBy', currentUser)
      try {
        question.set('questionText', questionText)

        question.set('difficulty', difficulty)

        question.set('customTime', customTime)

        question.set('solutionText', solutionText)

        if (Array.isArray(answers) && answers.length > 0) {
          answers.forEach(element => {
            const { answerText, isRightAnswer } = element
            if (!isSetAndOfType(answerText, 'string')) {
              throw new Error('Atleast one answer text is not set or not a string')
            }

            if (!isSetAndOfType(isRightAnswer, 'boolean')) {
              throw new Error('Atleast one isRightAnswer is not set or not a boolean')
            }
          })
          question.set('answers', answers)
        } else {
          throw new Error('answers not set or wrong type')
        }

        await question.save(null, asMaster)

        if (!isNewQuestion) return true

        let course = await getObjectById(Course, courseId)
        let questionRelation = course.relation('questions')
        questionRelation.add(question)
        await course.save(null, asMaster)

        const courseQuestionsAddedRelation = currentUser.relation('courseQuestionsAdded')
        courseQuestionsAddedRelation.add(course)
        await currentUser.save(null, asMaster)
      } catch (error) {
        await question.destroy(asMaster)
        throw error
      }

      return true
    }
  },
  deleteQuestion: {
    name: 'delete_question',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')
      if (!(await hasLecturerPermission(currentUser))) return new Error('User is not lecturer')

      const { id } = request.params

      try {
        const isAdmin = await hasAdminPermission(currentUser)
        const question = await getObjectById(Question, id)

        let hasPermissionToDelete = false
        if (question.get('createdBy') == currentUser) hasPermissionToDelete = true
        if (isAdmin) hasPermissionToDelete = true

        if (!hasPermissionToDelete) throw new Error('No permission to delete')
        questionDeleted = question.clone()
        questionDeleted.className = 'DeletedQuestion'
        await questionDeleted.save(null, asMaster)
        await question.destroy(asMaster)

        // TODO check courseQuestionsAdded from user
      } catch (error) {
        throw error
      }

      return true
    }
  },
  getQuestions: {
    name: 'get_questions',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')
      if (!(await hasLecturerPermission(currentUser))) return new Error('User is not lecturer')

      try {
        const isAdmin = await hasAdminPermission(currentUser)
        const { getAll } = request.params
        if (getAll && !isAdmin) {
          throw new Error('User is not an admin')
        }

        let courseQuestionsAdded
        if (getAll) {
          const courseQuery = new Parse.Query(Course)
          courseQuestionsAdded = await courseQuery.find(asMaster)
        } else {
          const courseQuestionsAddedQuery = currentUser.relation('courseQuestionsAdded').query()
          courseQuestionsAdded = await courseQuestionsAddedQuery.find(asMaster)
        }

        let coursesWithQuestionResponse = []

        for (const course of courseQuestionsAdded) {
          let questionQuery = course.relation('questions').query()

          if (!getAll) questionQuery.equalTo('createdBy', currentUser)

          questionQuery.include('createdBy')
          let questions = await questionQuery.find(asMaster)

          if (questions.length == 0) continue

          let questionsResponse = []
          for (const question of questions) {
            const questionText = question.get('questionText')
            const answers = question.get('answers')
            const difficulty = question.get('difficulty')
            const customTime = question.get('customTime')
            const solutionText = question.get('solutionText')
            const updatedAt = question.get('updatedAt').toISOString()
            let user = question.get('createdBy')

            user = {
              id: user.id || undefined,
              username: user.get('username'),
              playerName: user.get('playerName'),
              avatarUrl: user.get('avatarUrl') || ''
            }
            const id = question.id
            questionsResponse.push({
              questionText,
              answers,
              difficulty,
              user,
              customTime,
              id,
              updatedAt,
              solutionText
            })
          }

          coursesWithQuestionResponse.push({
            id: course.id,
            name: course.get('name'),
            questions: questionsResponse
          })
        }

        return coursesWithQuestionResponse
      } catch (e) {
        throw e
      }
    }
  }
}
