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

const loSampleSize = require('lodash/sampleSize')

const Game = Parse.Object.extend('Game')
const Course = Parse.Object.extend('Course')

module.exports = {
  createGame: {
    name: 'create_game',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')

      const { numberOfQuestions, difficulty, withTimer, courseId } = request.params
      let newGame = new Game()
      let newGameResponse = {}
      try {
        newGame.set('player', currentUser)
        newGame.set('givenAnswers', [])
        newGame.set('score', 0)
        newGame.set('finished', false)

        if (isSetAndOfType(difficulty, 'number')) {
          newGame.set('difficulty', difficulty)
        } else {
          throw new Error('difficulty not set or wrong type')
        }
        if (isSetAndOfType(withTimer, 'boolean')) {
          newGame.set('withTimer', withTimer)
        } else {
          throw new Error('withTimer not set or wrong type')
        }
        if (isSetAndOfType(numberOfQuestions, 'number')) {
          let course = await getObjectById(Course, courseId)
          let questionCourseRelation = course.relation('questions')
          let questionsQuery = questionCourseRelation.query()
          let questions = await questionsQuery.find(asMaster)
          if (questions.length < numberOfQuestions) {
            throw new Error('Not enough questions in course')
          }
          questions = loSampleSize(questions, numberOfQuestions)

          let questionNewGameRelation = newGame.relation('questions')
          questionNewGameRelation.add(questions)
          await newGame.save(null, asMaster)

          newGameResponse.questions = questions.map(question => {
            const questionText = question.get('questionText')
            const answers = question.get('answers')
            const hasLatex = question.get('hasLatex')
            return { questionText, answers, hasLatex }
          })
          newGameResponse.finished = newGame.get('finished')
          newGameResponse.difficulty = newGame.get('difficulty')
          newGameResponse.withTimer = newGame.get('withTimer')
          newGameResponse.givenAnswers = newGame.get('givenAnswers')
          newGameResponse.score = newGame.get('score')
        } else {
          throw new Error('numberOfQuestions not set or wrong type')
        }
      } catch (error) {
        await newGame.destroy(asMaster)
        throw error
      }

      return newGameResponse
    }
  },
  finishGame: {
    name: 'finish_game',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')

      const { gameId, givenAnswers } = request.params

      try {
        let game = await getObjectById(Game, gameId)
        if (game.get('finished') === true) {
          throw new Error('game already finished')
        }
        game.set('givenAnswers', givenAnswers)
        game.set('finished', true)
        game.save(null, asMaster)
      } catch (error) {
        throw error
      }

      return true
    }
  }
}
