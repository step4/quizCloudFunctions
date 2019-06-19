const { asMaster, isLoggedIn, hasAdminPermission, hasLecturerPermission, getObjectById, getObjectByName, createNewObject, isSetAndOfType } = require('../utils')

const Question = Parse.Object.extend('Question')
const Course = Parse.Object.extend('Course')

module.exports = {
  addQuestion: {
    name: 'add_question',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')
      if (!(await hasLecturerPermission(currentUser))) return new Error('User is not lecturer')

      const { questionText, hasLatex, answers, difficulty, courseIds, customTime } = request.params

      let newQuestion = new Question()
      newQuestion.set('createdBy', currentUser)
      try {
        if (isSetAndOfType(questionText, 'string')) {
          newQuestion.set('questionText', questionText)
        } else {
          throw new Error('questionText not set or wrong type')
        }

        if (isSetAndOfType(difficulty, 'number')) {
          newQuestion.set('difficulty', difficulty)
        } else {
          throw new Error('difficulty not set or wrong type')
        }
        newQuestion.set('customTime', customTime)
        // if (isSetAndOfType(hasLatex, 'boolean')) {
        //   newQuestion.set('hasLatex', hasLatex)
        // } else {
        //   throw new Error('hasLatex not set or wrong type')
        // }

        if (Array.isArray(answers) && answers.length > 0) {
          answers.forEach(element => {
            const { answerText, hasLatex, isRightAnswer } = element
            if (!isSetAndOfType(answerText, 'string')) {
              throw new Error('Atleast one answer text is not set or not a string')
            }
            // if (!isSetAndOfType(hasLatex, 'boolean')) {
            //   throw new Error('Atleast one hasLatex in answers is not set or not a boolean')
            // }
            if (!isSetAndOfType(isRightAnswer, 'boolean')) {
              throw new Error('Atleast one isRightAnswer is not set or not a boolean')
            }
          })
          newQuestion.set('answers', answers)
        } else {
          throw new Error('answers not set or wrong type')
        }

        await newQuestion.save(null, asMaster)

        if (Array.isArray(courseIds) && courseIds.length > 0) {
          for (const courseId of courseIds) {
            let course = await getObjectById(Course, courseId)
            let questionRelation = course.relation('questions')
            questionRelation.add(newQuestion)
            await course.save(null, asMaster)

            const courseQuestionsAddedRelation = currentUser.relation('courseQuestionsAdded')
            courseQuestionsAddedRelation.add(course)
            await currentUser.save(null, asMaster)
          }
        } else {
          throw new Error('courseIds not set or wrong type')
        }
      } catch (error) {
        await newQuestion.destroy(asMaster)
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
        const courseQuestionsAddedQuery = currentUser.relation('courseQuestionsAdded').query()
        const courseQuestionsAdded = await courseQuestionsAddedQuery.find(asMaster)
        let coursesWithQuestionResponse = []

        for (const course of courseQuestionsAdded) {
          let questionQuery = course.relation('questions').query()
          questionQuery.equalTo('createdBy', currentUser)
          questionQuery.include('createdBy')
          let questions = await questionQuery.find(asMaster)

          let questionsResponse = []
          for (const question of questions) {
            const questionText = question.get('questionText')
            const answers = question.get('answers')
            const difficulty = question.get('difficulty')
            const customTime = question.get('customTime')
            let user = question.get('createdBy')
            user = {
              id: user.id,
              username: user.get('username'),
              playerName: user.get('playerName'),
              avatarUrl: user.get('avatarUrl')
            }
            const id = question.id
            questionsResponse.push({
              questionText,
              answers,
              difficulty,
              user,
              customTime,
              id
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
