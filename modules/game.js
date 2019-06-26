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

        newGame.set('difficulty', difficulty)

        newGame.set('withTimer', withTimer)

        let course = await getObjectById(Course, courseId)
        newGame.set('course', course)

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
          const questionId = question.id
          const questionText = question.get('questionText')
          const answers = question.get('answers')
          const difficulty = question.get('difficulty')
          const customTime = question.get('customTime')
          return { questionId, questionText, answers, difficulty, customTime }
        })
        newGameResponse.finished = newGame.get('finished')
        newGameResponse.difficulty = newGame.get('difficulty')
        newGameResponse.withTimer = newGame.get('withTimer')
        newGameResponse.givenAnswers = newGame.get('givenAnswers')
        newGameResponse.score = newGame.get('score')
        newGameResponse.gameId = newGame.id
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

      const { gameId, givenAnswers, rightAnswerCount } = request.params

      try {
        let game = await getObjectById(Game, gameId)
        if (game.get('finished') === true) {
          throw new Error('game already finished')
        }
        game.set('rightAnswerCount', rightAnswerCount)
        game.set('givenAnswers', givenAnswers)
        game.set('score', score)
        game.set('finished', true)
        game.save(null, asMaster)
      } catch (error) {
        throw error
      }

      return true
    }
  },
  getPlayedGames: {
    name: 'get_played_games',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')

      const isAdmin = await hasAdminPermission(currentUser)
      let { getAll } = request.params
      getAll = getAll || false
      if (getAll && !isAdmin) {
        throw new Error('User is not an admin')
      }
      let gamesQuery = new Parse.Query(Game)
      if (!getAll) {
        gamesQuery.equalTo('player', currentUser)
      }

      gamesQuery.include('player')
      gamesQuery.include('course')

      try {
        const games = await gamesQuery.find(asMaster)

        let gamesResponse = []
        for (game of games) {
          if (game.get('finished') == false) continue

          let player = game.get('player')
          player = {
            id: player.id || undefined,
            username: player.get('username'),
            playerName: player.get('playerName'),
            avatarUrl: player.get('avatarUrl')
          }
          let course = game.get('course')
          course = {
            id: course.id,
            name: course.get('name') || 'noName'
          }
          const givenAnswers = game.get('givenAnswers')
          const score = game.get('score')
          const difficulty = game.get('difficulty')
          const rightAnswerCount = game.get('rightAnswerCount')
          const withTimer = game.get('withTimer')
          const playedAt = game.get('updatedAt').toISOString()
          const id = game.id

          const questionRelationQuery = game.get('questions').query()
          const questions = await questionRelationQuery.find(asMaster)

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
              avatarUrl: user.get('avatarUrl')
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

          const gameResponse = {
            player,
            course,
            rightAnswerCount,
            id,
            givenAnswers,
            score,
            difficulty,
            withTimer,
            playedAt,
            questions: questionsResponse
          }

          gamesResponse.push(gameResponse)
        }

        return gamesResponse
      } catch (error) {
        throw error
      }
    }
  }
}
