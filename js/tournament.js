class TournamentEngine {
  constructor() {
    this.playerCount = 4 // 4 or 8
    this.players = []
    this.matches = []
    this.currentMatchIndex = 0
    this.status = "idle" // "idle" | "setup" | "active" | "completed"
    this.podium = {
      first: null,
      second: null,
      third: null
    }
    this.semiFinalLosers = []
    this.hasThirdPlaceMatch = true
  }

  createRoster(count = 4, customPlayers = []) {
    this.playerCount = count === 8 ? 8 : 4
    this.players = []
    this.matches = []
    this.currentMatchIndex = 0
    this.semiFinalLosers = []
    this.podium = { first: null, second: null, third: null }

    const defaultAvatars = ["user", "shield", "zap", "crown", "flame", "target", "bot", "heart"]

    for (let i = 0; i < this.playerCount; i++) {
      if (customPlayers[i]) {
        this.players.push({
          id: `p_${i + 1}`,
          name: customPlayers[i].name || `Player ${i + 1}`,
          avatar: customPlayers[i].avatar || defaultAvatars[i % defaultAvatars.length],
          isAi: !!customPlayers[i].isAi,
          aiDifficulty: customPlayers[i].aiDifficulty || "medium"
        })
      } else {
        this.players.push({
          id: `p_${i + 1}`,
          name: `Player ${i + 1}`,
          avatar: defaultAvatars[i % defaultAvatars.length],
          isAi: i > 0, // Default: Player 1 is human, others are AI if not specified
          aiDifficulty: "medium"
        })
      }
    }
    this.status = "setup"
  }

  startTournament() {
    this.matches = []
    this.currentMatchIndex = 0
    this.semiFinalLosers = []
    this.podium = { first: null, second: null, third: null }

    if (this.playerCount === 4) {
      // Semi-Final 1
      this.matches.push({
        id: "m_sf1",
        stageName: "Semi-Final 1",
        stage: "semi",
        player1: this.players[0],
        player2: this.players[1],
        winner: null,
        loser: null,
        status: "pending" // "pending" | "playing" | "completed"
      })
      // Semi-Final 2
      this.matches.push({
        id: "m_sf2",
        stageName: "Semi-Final 2",
        stage: "semi",
        player1: this.players[2],
        player2: this.players[3],
        winner: null,
        loser: null,
        status: "pending"
      })
      // 3rd Place Match (Placeholder)
      this.matches.push({
        id: "m_3rd",
        stageName: "3rd Place Playoff",
        stage: "third_place",
        player1: null,
        player2: null,
        winner: null,
        loser: null,
        status: "waiting"
      })
      // Grand Final (Placeholder)
      this.matches.push({
        id: "m_final",
        stageName: "Grand Final",
        stage: "final",
        player1: null,
        player2: null,
        winner: null,
        loser: null,
        status: "waiting"
      })
    } else {
      // 8-Player Tournament: Quarter-Finals (4 matches)
      for (let i = 0; i < 4; i++) {
        this.matches.push({
          id: `m_qf${i + 1}`,
          stageName: `Quarter-Final ${i + 1}`,
          stage: "quarter",
          player1: this.players[i * 2],
          player2: this.players[i * 2 + 1],
          winner: null,
          loser: null,
          status: "pending"
        })
      }
      // Semi-Final 1 & 2
      this.matches.push({
        id: "m_sf1",
        stageName: "Semi-Final 1",
        stage: "semi",
        player1: null,
        player2: null,
        winner: null,
        loser: null,
        status: "waiting"
      })
      this.matches.push({
        id: "m_sf2",
        stageName: "Semi-Final 2",
        stage: "semi",
        player1: null,
        player2: null,
        winner: null,
        loser: null,
        status: "waiting"
      })
      // 3rd Place Match
      this.matches.push({
        id: "m_3rd",
        stageName: "3rd Place Playoff",
        stage: "third_place",
        player1: null,
        player2: null,
        winner: null,
        loser: null,
        status: "waiting"
      })
      // Grand Final
      this.matches.push({
        id: "m_final",
        stageName: "Grand Final",
        stage: "final",
        player1: null,
        player2: null,
        winner: null,
        loser: null,
        status: "waiting"
      })
    }

    this.status = "active"
    this.currentMatchIndex = 0
    return this.getCurrentMatch()
  }

  getCurrentMatch() {
    if (this.currentMatchIndex < this.matches.length) {
      return this.matches[this.currentMatchIndex]
    }
    return null
  }

  recordMatchWinner(winnerPlayer, loserPlayer) {
    const current = this.getCurrentMatch()
    if (!current) return null

    current.winner = winnerPlayer
    current.loser = loserPlayer
    current.status = "completed"

    if (this.playerCount === 4) {
      this.advanceFourPlayerBracket(current)
    } else {
      this.advanceEightPlayerBracket(current)
    }

    // Advance to next playable match
    this.currentMatchIndex++
    if (this.currentMatchIndex >= this.matches.length) {
      this.status = "completed"
      this.calculatePodium()
    }

    return this.getCurrentMatch()
  }

  advanceFourPlayerBracket(completedMatch) {
    if (completedMatch.stage === "semi") {
      this.semiFinalLosers.push(completedMatch.loser)

      const finalMatch = this.matches.find((m) => m.id === "m_final")
      const thirdMatch = this.matches.find((m) => m.id === "m_3rd")

      if (completedMatch.id === "m_sf1") {
        finalMatch.player1 = completedMatch.winner
        thirdMatch.player1 = completedMatch.loser
      } else if (completedMatch.id === "m_sf2") {
        finalMatch.player2 = completedMatch.winner
        thirdMatch.player2 = completedMatch.loser
      }

      if (thirdMatch.player1 && thirdMatch.player2) {
        thirdMatch.status = "pending"
      }
      if (finalMatch.player1 && finalMatch.player2) {
        finalMatch.status = "pending"
      }
    }
  }

  advanceEightPlayerBracket(completedMatch) {
    if (completedMatch.stage === "quarter") {
      const sf1 = this.matches.find((m) => m.id === "m_sf1")
      const sf2 = this.matches.find((m) => m.id === "m_sf2")

      if (completedMatch.id === "m_qf1") sf1.player1 = completedMatch.winner
      if (completedMatch.id === "m_qf2") sf1.player2 = completedMatch.winner
      if (completedMatch.id === "m_qf3") sf2.player1 = completedMatch.winner
      if (completedMatch.id === "m_qf4") sf2.player2 = completedMatch.winner

      if (sf1.player1 && sf1.player2) sf1.status = "pending"
      if (sf2.player1 && sf2.player2) sf2.status = "pending"
    } else if (completedMatch.stage === "semi") {
      this.semiFinalLosers.push(completedMatch.loser)

      const finalMatch = this.matches.find((m) => m.id === "m_final")
      const thirdMatch = this.matches.find((m) => m.id === "m_3rd")

      if (completedMatch.id === "m_sf1") {
        finalMatch.player1 = completedMatch.winner
        thirdMatch.player1 = completedMatch.loser
      } else if (completedMatch.id === "m_sf2") {
        finalMatch.player2 = completedMatch.winner
        thirdMatch.player2 = completedMatch.loser
      }

      if (thirdMatch.player1 && thirdMatch.player2) thirdMatch.status = "pending"
      if (finalMatch.player1 && finalMatch.player2) finalMatch.status = "pending"
    }
  }

  // Handle absent/offline/AFK player: substitute AI bot or instant forfeit
  substitutePlayerWithAi(playerId, difficulty = "medium") {
    const match = this.getCurrentMatch()
    if (!match) return false

    if (match.player1 && match.player1.id === playerId) {
      match.player1.isAi = true
      match.player1.aiDifficulty = difficulty
      match.player1.name = `${match.player1.name} (AI Bot)`
      match.player1.avatar = "bot"
      return true
    } else if (match.player2 && match.player2.id === playerId) {
      match.player2.isAi = true
      match.player2.aiDifficulty = difficulty
      match.player2.name = `${match.player2.name} (AI Bot)`
      match.player2.avatar = "bot"
      return true
    }
    return false
  }

  forfeitPlayer(playerId) {
    const match = this.getCurrentMatch()
    if (!match) return null

    if (match.player1 && match.player1.id === playerId) {
      return this.recordMatchWinner(match.player2, match.player1)
    } else if (match.player2 && match.player2.id === playerId) {
      return this.recordMatchWinner(match.player1, match.player2)
    }
    return null
  }

  calculatePodium() {
    const finalMatch = this.matches.find((m) => m.id === "m_final")
    const thirdMatch = this.matches.find((m) => m.id === "m_3rd")

    this.podium = {
      first: finalMatch ? finalMatch.winner : null,
      second: finalMatch ? finalMatch.loser : null,
      third: thirdMatch ? thirdMatch.winner : null
    }
    return this.podium
  }
}

window.TournamentEngine = TournamentEngine
