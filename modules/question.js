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

      const { questionText, hasLatex, answers, difficulty, courseIds } = request.params

      let newQuestion = new Question()
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
  }
}
