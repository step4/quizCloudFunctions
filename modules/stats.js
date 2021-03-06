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

function isSameDay(date1, date2) {
  return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear()
}

function findDateIndex(dateArray, dateToFind) {
  for (let index = 0; index < dateArray.length; index++) {
    const element = dateArray[index]
    if (isSameDay(element, dateToFind)) return index
  }
}

const Game = Parse.Object.extend('Game')
const Course = Parse.Object.extend('Course')
const Question = Parse.Object.extend('Question')

const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

module.exports = {
  scoresPerDay: {
    name: 'scores_per_day',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')

      const { numberOfDays } = request.params
      let data = {
        labels: [],
        datasets: [{ label: 'Scores Pro Tag', data: [] }],
        date: []
      }
      const today = new Date()
      let currentDate = today
      for (let index = 0; index < numberOfDays; index++) {
        data.labels.push(days[currentDate.getDay()])
        data.date.push(new Date(currentDate))
        data.datasets[0].data.push(0)
        currentDate.setDate(currentDate.getDate() - 1)
      }

      const playedGamesQuery = new Parse.Query(Game)
      playedGamesQuery.equalTo('finished', true)
      playedGamesQuery.equalTo('player', currentUser)

      try {
        let playedGames = await playedGamesQuery.find(asMaster)
        for (let index = 0; index < data.datasets[0].data.length; index++) {
          if (playedGames.length === 0) break

          for (let j = playedGames.length - 1; j > 0; j--) {
            const currentDate = data.date[index]
            const gameDate = new Date(playedGames[j].get('updatedAt').toISOString())
            if (isSameDay(currentDate, gameDate)) {
              const score = playedGames[j].get('score')
              data.datasets[0].data[index] += score
              playedGames = playedGames.filter((ele, i) => i != j)
            }
          }
        }
        data.date = data.date.map(date => date.toISOString())
        return data
      } catch (error) {
        throw error
      }
    }
  },
  playedQuestionsPerDay: {
    name: 'played_questions_per_day',
    handler: async request => {
      let currentUser = request.user
      if (!(await isLoggedIn(currentUser))) return new Error('User not logged in')
      if (!(await hasLecturerPermission(currentUser))) return new Error('User is not lecturer')

      const { numberOfDays } = request.params
      let data = {
        labels: [],
        datasets: [{ label: 'Richtig beantwortet', data: [] }, { label: 'Falsch beantwortet', data: [] }],
        date: []
      }
      const today = new Date()
      let currentDate = today
      for (let index = 0; index < numberOfDays; index++) {
        data.labels.push(days[currentDate.getDay()])
        data.date.push(new Date(currentDate))
        data.datasets[0].data.push(0)
        data.datasets[1].data.push(0)
        currentDate.setDate(currentDate.getDate() - 1)
      }

      const playedGamesQuery = new Parse.Query(Game)
      playedGamesQuery.equalTo('finished', true)

      try {
        let playedGames = await playedGamesQuery.find(asMaster)
        let playedQuestions = []
        for (const game of playedGames) {
          const givenAnswers = game.get('givenAnswers')
          for (const answer of givenAnswers) {
            let question = await getObjectById(Question, answer.questionId)
            if (question === null) continue
            let creator = question.get('createdBy')
            if (creator.id == currentUser.id) {
              rightAnswerDatasetIndex = answer.correctlyAnswered ? 0 : 1
              const gameDate = new Date(game.get('updatedAt').toISOString())
              dateIndex = findDateIndex(data.date, gameDate)
              data.datasets[rightAnswerDatasetIndex].data[dateIndex] += 1
            }
          }
        }

        // for (let index = 0; index < data.datasets[0].data.length; index++) {
        //   if (playedGames.length === 0) break

        //   for (let j = playedGames.length - 1; j > 0; j--) {
        //     const currentDate = data.date[index]
        //     const gameDate = new Date(playedGames[j].get('updatedAt').toISOString())
        //     if (isSameDay(currentDate, gameDate)) {
        //       const score = playedGames[j].get('score')
        //       data.datasets[0].data[index] += score
        //       playedGames = playedGames.filter((ele, i) => i != j)
        //     }
        //   }
        // }
        data.date = data.date.map(date => date.toISOString())
        return data
      } catch (error) {
        throw error
      }
    }
  }
}
