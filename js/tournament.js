/**
 * TournamentEngine - Online & Local Knockout Tournament Architecture
 * Implements Football/Cricket style single-elimination tournament brackets
 * (Quarter-Finals -> Semi-Finals -> 3rd Place Playoff -> Grand Final -> 3-Tier Podium)
 */
class TournamentEngine {
  constructor() {
    this.playerCount = 4 // 4 or 8
    this.players = []
    this.matches = []
    this.currentMatchIndex = 0
    this.status = "idle" // "idle" | "lobby" | "active" | "completed"
    this.podium = {
      first: null,
      second: null,
      third: null
    }
    this.semiFinalLosers = []
    this.roomCode = null
    this.isOnline = false
    this.isHost = false
    this.localPlayerId = null
    this.p2p = null // MultiplayerEngine bridge if online
    this.onStateChange = null
    this.onMatchStart = null
    this.onPodiumReady = null
  }

  /**
   * Initialize local or host roster
   */
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
          id: customPlayers[i].id || `p_${i + 1}`,
          name: customPlayers[i].name || `Player ${i + 1}`,
          avatar: customPlayers[i].avatar || defaultAvatars[i % defaultAvatars.length],
          isAi: !!customPlayers[i].isAi,
          aiDifficulty: customPlayers[i].aiDifficulty || "medium",
          isOnline: !!customPlayers[i].isOnline,
          isHost: i === 0 && this.isHost
        })
      } else {
        this.players.push({
          id: `p_${i + 1}`,
          name: `Player ${i + 1}`,
          avatar: defaultAvatars[i % defaultAvatars.length],
          isAi: i > 0, // Slot 1 human, remaining default AI
          aiDifficulty: "medium",
          isOnline: false,
          isHost: i === 0 && this.isHost
        })
      }
    }
    this.status = "lobby"
    this.broadcastState()
    return this.players
  }

  /**
   * Update a specific roster slot (name, avatar, isAi)
   */
  updatePlayerSlot(index, playerInfo) {
    if (index >= 0 && index < this.players.length) {
      this.players[index] = { ...this.players[index], ...playerInfo }
      this.broadcastState()
    }
  }

  /**
   * Add or replace online player into first available non-host slot
   */
  addOnlinePlayer(playerData) {
    const existingIdx = this.players.findIndex((p) => p.id === playerData.id)
    if (existingIdx !== -1) {
      this.players[existingIdx] = { ...this.players[existingIdx], ...playerData }
      this.broadcastState()
      return existingIdx
    }

    // Find first AI slot to replace
    const availableSlot = this.players.findIndex((p, idx) => idx > 0 && p.isAi)
    if (availableSlot !== -1) {
      this.players[availableSlot] = {
        ...this.players[availableSlot],
        id: playerData.id || `p_online_${Date.now().toString(36)}`,
        name: playerData.name || `Player ${availableSlot + 1}`,
        avatar: playerData.avatar || "user",
        isAi: false,
        isOnline: true
      }
      this.broadcastState()
      return availableSlot
    }
    return -1
  }

  /**
   * Generate knockout bracket fixtures (Quarterfinals / Semifinals / 3rd Place / Grand Final)
   */
  startTournament() {
    this.matches = []
    this.currentMatchIndex = 0
    this.semiFinalLosers = []
    this.podium = { first: null, second: null, third: null }

    if (this.playerCount === 4) {
      // 4-Player Knockout: 2 Semifinals, 1 Third-Place Playoff, 1 Grand Final
      this.matches.push({
        id: "m_sf1",
        stageName: "Semi-Final 1",
        stage: "semi",
        player1: { ...this.players[0] },
        player2: { ...this.players[1] },
        winner: null,
        loser: null,
        status: "pending"
      })

      this.matches.push({
        id: "m_sf2",
        stageName: "Semi-Final 2",
        stage: "semi",
        player1: { ...this.players[2] },
        player2: { ...this.players[3] },
        winner: null,
        loser: null,
        status: "pending"
      })

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
      // 8-Player Knockout: 4 Quarterfinals, 2 Semifinals, 1 Third-Place Playoff, 1 Grand Final
      for (let i = 0; i < 4; i++) {
        this.matches.push({
          id: `m_qf${i + 1}`,
          stageName: `Quarter-Final ${i + 1}`,
          stage: "quarter",
          player1: { ...this.players[i * 2] },
          player2: { ...this.players[i * 2 + 1] },
          winner: null,
          loser: null,
          status: "pending"
        })
      }

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
    this.broadcastState()

    const current = this.getCurrentMatch()
    if (this.onMatchStart && current) {
      this.onMatchStart(current)
    }
    return current
  }

  getCurrentMatch() {
    if (this.currentMatchIndex < this.matches.length) {
      return this.matches[this.currentMatchIndex]
    }
    return null
  }

  /**
   * Records match outcome and advances tournament bracket to next stage
   */
  recordMatchWinner(winnerPlayer, loserPlayer) {
    const current = this.getCurrentMatch()
    if (!current) return null

    current.winner = { ...winnerPlayer }
    current.loser = { ...loserPlayer }
    current.status = "completed"

    if (this.playerCount === 4) {
      this.advanceFourPlayerBracket(current)
    } else {
      this.advanceEightPlayerBracket(current)
    }

    this.currentMatchIndex++
    if (this.currentMatchIndex >= this.matches.length) {
      this.status = "completed"
      this.calculatePodium()
      if (this.onPodiumReady) {
        this.onPodiumReady(this.podium)
      }
    }

    this.broadcastState()
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

      if (thirdMatch.player1 && thirdMatch.player2) thirdMatch.status = "pending"
      if (finalMatch.player1 && finalMatch.player2) finalMatch.status = "pending"
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

  substitutePlayerWithAi(playerId, difficulty = "medium") {
    const match = this.getCurrentMatch()
    if (!match) return false

    let substituted = false
    if (match.player1 && match.player1.id === playerId) {
      match.player1.isAi = true
      match.player1.aiDifficulty = difficulty
      match.player1.name = `${match.player1.name} (AI Bot)`
      match.player1.avatar = "bot"
      substituted = true
    } else if (match.player2 && match.player2.id === playerId) {
      match.player2.isAi = true
      match.player2.aiDifficulty = difficulty
      match.player2.name = `${match.player2.name} (AI Bot)`
      match.player2.avatar = "bot"
      substituted = true
    }

    if (substituted) {
      this.broadcastState()
    }
    return substituted
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

  /**
   * P2P state broadcast and synchronization
   */
  setP2PEngine(p2pEngine) {
    this.p2p = p2pEngine
  }

  broadcastState() {
    if (this.onStateChange) {
      this.onStateChange(this.exportState())
    }
    if (this.isOnline && this.isHost && this.p2p) {
      this.p2p.sendData({
        type: "tourney_sync",
        state: this.exportState()
      })
    }
  }

  exportState() {
    return {
      playerCount: this.playerCount,
      players: this.players,
      matches: this.matches,
      currentMatchIndex: this.currentMatchIndex,
      status: this.status,
      podium: this.podium,
      roomCode: this.roomCode
    }
  }

  importState(state) {
    if (!state) return
    this.playerCount = state.playerCount || this.playerCount
    this.players = state.players || this.players
    this.matches = state.matches || this.matches
    this.currentMatchIndex = state.currentMatchIndex ?? this.currentMatchIndex
    this.status = state.status || this.status
    this.podium = state.podium || this.podium
    this.roomCode = state.roomCode || this.roomCode

    if (this.onStateChange) {
      this.onStateChange(this.exportState())
    }
  }
}

window.TournamentEngine = TournamentEngine
