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
      try {
        newGame.set('player', currentUser)
        newGame.set('rightQuestions', [])
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
        } else {
          throw new Error('numberOfQuestions not set or wrong type')
        }
      } catch (error) {
        await newGame.destroy(asMaster)
        throw error
      }

      return newGame
    }
  },
  finishGame: {
    name: 'finish_game',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')

      const { gameId, rightQuestions } = request.params

      try {
        let game = await getObjectById(Game, gameId)
        if (game.get('finished') === true) {
          throw new Error('game already finished')
        }
        game.set('rightQuestions', rightQuestions)
        game.set('finished', true)
        game.save(null, asMaster)
      } catch (error) {
        throw error
      }

      return true
    }
  }
}
