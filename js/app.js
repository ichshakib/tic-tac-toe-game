document.addEventListener("DOMContentLoaded", () => {
  // Instantiate Singletons & Helpers
  const game = new window.GameEngine()
  const storage = window.storageManager
  const sound = window.soundEngine
  const ai = new window.TicTacToeAI()
  const multiplayer = new window.MultiplayerEngine()
  const tournament = new window.TournamentEngine()

  // Connect tournament engine with multiplayer P2P engine
  tournament.setP2PEngine(multiplayer)

  // Game Configuration State
  let currentMode = "ai" // "ai" | "local" | "online" | "tournament"
  let aiDifficulty = "hard"
  let isAiThinking = false
  let player1 = { name: "Player 1", avatar: "user", symbol: "X", isAi: false }
  let player2 = { name: "AI Bot", avatar: "bot", symbol: "O", isAi: true }

  // Tournament Configuration State
  let tourneySize = 4
  let tourneyRoster = []
  let tourneyModeType = "online" // "online" | "local"
  let tourneyRoomCode = null

  // Load Saved Preferences
  const savedProfile = storage.getProfile()
  player1.name = savedProfile.name || "Player 1"
  player1.avatar = savedProfile.avatar || "user"

  const savedSettings = storage.getSettings()
  aiDifficulty = savedSettings.aiDifficulty || "hard"
  ai.setDifficulty(aiDifficulty)
  sound.setSoundEnabled(savedSettings.soundEnabled !== false)
  sound.setVolume(savedSettings.volume ?? 80)

  // Automatic Device Theme Mode Detection
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
  function applySystemTheme(e) {
    const isDark = e ? e.matches : mediaQuery.matches
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light")
  }
  applySystemTheme()
  mediaQuery.addEventListener("change", applySystemTheme)

  // DOM Elements
  const boardCells = document.querySelectorAll(".board-cell")
  const strikeSvg = document.getElementById("strike-svg")
  const strikeLine = document.getElementById("strike-line")

  // Player Cards DOM
  const cardPlayerX = document.getElementById("card-player-x")
  const cardPlayerO = document.getElementById("card-player-o")
  const namePlayerX = document.getElementById("name-player-x")
  const namePlayerO = document.getElementById("name-player-o")
  const btnEditNameX = document.getElementById("btn-edit-name-x")
  const btnEditNameO = document.getElementById("btn-edit-name-o")
  const avatarX = document.getElementById("avatar-x")
  const avatarO = document.getElementById("avatar-o")
  const scorePlayerX = document.getElementById("score-player-x")
  const scorePlayerO = document.getElementById("score-player-O") || document.getElementById("score-player-o")
  const roundIndicator = document.getElementById("round-indicator")

  // Turn Banner DOM
  const turnSymbolPreview = document.getElementById("turn-symbol-preview")
  const turnMessage = document.getElementById("turn-message")
  const aiThinkingIndicator = document.getElementById("ai-thinking-indicator")

  // Modals DOM
  const modalResult = document.getElementById("modal-result")
  const modalOnline = document.getElementById("modal-online")
  const modalStats = document.getElementById("modal-stats")
  const modalSettings = document.getElementById("modal-settings")
  const modalTournament = document.getElementById("modal-tournament")
  const modalPodium = document.getElementById("modal-podium")

  // Result Modal Data DOM
  const resultIconWrapper = document.getElementById("result-icon-wrapper")
  const resultTitle = document.getElementById("result-title")
  const resultSubtitle = document.getElementById("result-subtitle")
  const resStatWinner = document.getElementById("res-stat-winner")
  const resStatMoves = document.getElementById("res-stat-moves")
  const resStatScore = document.getElementById("res-stat-score")
  const btnNextRound = document.getElementById("btn-next-round")
  const btnNextRoundText = document.getElementById("btn-next-round-text")

  // Side Panels & Bars DOM
  const onlineStatusBar = document.getElementById("online-status-bar")
  const p2pStatusDot = document.getElementById("p2p-status-dot")
  const p2pStatusText = document.getElementById("p2p-status-text")
  const displayRoomCode = document.getElementById("display-room-code")
  const inputRoomCode = document.getElementById("input-room-code")
  const inputOnlinePlayerName = document.getElementById("input-online-player-name")
  const joinStatusMessage = document.getElementById("join-status-message")
  const aiDifficultyBar = document.getElementById("ai-difficulty-bar")
  const tournamentStatusBar = document.getElementById("tournament-status-bar")
  const tourneyStageBadge = document.getElementById("tourney-stage-badge")
  const tourneyMatchText = document.getElementById("tourney-match-text")

  // Online Tournament Lobby DOM
  const tabTourneyOnline = document.getElementById("tab-tourney-online")
  const tabTourneyLocal = document.getElementById("tab-tourney-local")
  const viewTourneyOnline = document.getElementById("view-tourney-online")
  const displayTourneyCode = document.getElementById("display-tourney-code")
  const btnCopyTourneyCode = document.getElementById("btn-copy-tourney-code")
  const btnCopyTourneyLink = document.getElementById("btn-copy-tourney-link")
  const btnJoinTourneyPrompt = document.getElementById("btn-join-tourney-prompt")
  const tourneyJoinBar = document.getElementById("tourney-join-bar")
  const inputTourneyJoinCode = document.getElementById("input-tourney-join-code")
  const btnSubmitTourneyJoin = document.getElementById("btn-submit-tourney-join")

  // Avatar Rendering Utility
  function renderAvatar(containerEl, avatarVal) {
    if (!containerEl) return
    const isIconName = /^[a-z0-9-]+$/i.test(avatarVal) && avatarVal.length < 20
    if (isIconName) {
      containerEl.innerHTML = `<i data-lucide="${avatarVal}"></i>`
    } else {
      containerEl.textContent = avatarVal || "👤"
    }
    if (window.lucide) window.lucide.createIcons()
  }

  // Sound Management
  function updateSoundIcon() {
    const soundIcon = document.getElementById("sound-icon")
    if (soundIcon) {
      soundIcon.setAttribute("data-lucide", sound.enabled ? "volume-2" : "volume-x")
      if (window.lucide) window.lucide.createIcons()
    }
  }
  updateSoundIcon()

  // Scoreboard Profiles Sync
  function updateScoreboardProfiles() {
    let nameX = player1.name || "Player 1"
    let nameO = player2.name || (currentMode === "ai" ? "AI Bot" : "Player 2")

    if (currentMode === "online" && nameX === nameO) {
      if (multiplayer.isHost) {
        nameO = "Player 2"
      } else {
        nameX = "Player 1"
        nameO = "Player 2"
      }
    }

    if (namePlayerX) namePlayerX.textContent = nameX
    renderAvatar(avatarX, player1.avatar || "user")
    if (namePlayerO) namePlayerO.textContent = nameO
    renderAvatar(avatarO, player2.avatar || (currentMode === "ai" ? "bot" : "user-check"))
    if (scorePlayerX) scorePlayerX.textContent = game.scores.X
    if (scorePlayerO) scorePlayerO.textContent = game.scores.O

    if (currentMode === "tournament" && tournament.status === "active") {
      const match = tournament.getCurrentMatch()
      if (roundIndicator) roundIndicator.textContent = match ? match.stageName : `Round ${game.round}`
    } else {
      if (roundIndicator) roundIndicator.textContent = `Round ${game.round}`
    }
  }

  function updateDifficultyPills() {
    document.querySelectorAll(".diff-pill").forEach((pill) => {
      pill.classList.toggle("active", pill.getAttribute("data-diff") === aiDifficulty)
    })
  }

  // Live Stats Updater
  function updateLiveStats() {
    const stats = storage.getStats()
    const history = storage.getHistory()
    const tourneyStats = storage.getTournamentStats()

    const winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0

    // Modal Stats
    const elGames = document.getElementById("stat-total-games")
    const elWins = document.getElementById("stat-wins")
    const elLosses = document.getElementById("stat-losses")
    const elDraws = document.getElementById("stat-draws")
    const elRate = document.getElementById("stat-win-rate")
    const elStreak = document.getElementById("stat-streak")

    if (elGames) elGames.textContent = stats.totalGames
    if (elWins) elWins.textContent = stats.wins
    if (elLosses) elLosses.textContent = stats.losses
    if (elDraws) elDraws.textContent = stats.draws
    if (elRate) elRate.textContent = `${winRate}%`
    if (elStreak) elStreak.textContent = `${stats.currentStreak}`

    // Desktop Panel Stats
    const deskGames = document.getElementById("desk-stat-games")
    const deskWins = document.getElementById("desk-stat-wins")
    const deskRate = document.getElementById("desk-stat-rate")
    const deskStreak = document.getElementById("desk-stat-streak")

    if (deskGames) deskGames.textContent = stats.totalGames
    if (deskWins) deskWins.textContent = stats.wins
    if (deskRate) deskRate.textContent = `${winRate}%`
    if (deskStreak) deskStreak.textContent = `${stats.currentStreak}`

    const historyHtml = history.length === 0
      ? `<div class="history-empty">Play matches to view stats!</div>`
      : history.slice(0, 5).map((item) => `
        <div class="history-item">
          <div>
            <strong>${item.opponent}</strong> <span class="text-muted">(${item.mode})</span>
            <div style="font-size:0.68rem; color:var(--text-dim);">${item.date}</div>
          </div>
          <div>
            <span class="${item.result === 'win' ? 'text-success' : item.result === 'loss' ? 'text-danger' : 'text-muted'}" style="font-weight:700; text-transform:uppercase;">
              ${item.result}
            </span>
          </div>
        </div>
      `).join("")

    const historyList = document.getElementById("history-list")
    const deskHistoryList = document.getElementById("desk-history-list")
    if (historyList) historyList.innerHTML = historyHtml
    if (deskHistoryList) deskHistoryList.innerHTML = historyHtml
  }

  updateScoreboardProfiles()
  updateDifficultyPills()
  updateLiveStats()

  // Board Render & Turn Sync
  function updateTurnBanner() {
    if (game.status === "ended") {
      turnSymbolPreview.textContent = "—"
      turnSymbolPreview.className = "turn-symbol"
      turnMessage.textContent = "Game Finished"
      aiThinkingIndicator.classList.add("hidden")
      return
    }

    turnSymbolPreview.textContent = game.currentPlayer
    turnSymbolPreview.className = `turn-symbol symbol-${game.currentPlayer.toLowerCase()}`

    if (currentMode === "ai") {
      if (game.currentPlayer === "X") {
        turnMessage.textContent = "Your turn to move"
        aiThinkingIndicator.classList.add("hidden")
      } else {
        turnMessage.textContent = "AI is thinking..."
        aiThinkingIndicator.classList.remove("hidden")
      }
    } else if (currentMode === "online") {
      if (!multiplayer.isConnected) {
        turnMessage.textContent = "Waiting for opponent..."
      } else if (game.currentPlayer === multiplayer.mySymbol) {
        turnMessage.textContent = "Your turn to move"
      } else {
        const opponentDisplayName = multiplayer.isHost
          ? (player2.name === player1.name ? "Player 2" : player2.name)
          : (player1.name || "Player 1")
        turnMessage.textContent = `${opponentDisplayName}'s turn`
      }
      aiThinkingIndicator.classList.add("hidden")
    } else if (currentMode === "tournament") {
      const activePlayer = game.currentPlayer === "X" ? player1 : player2
      if (activePlayer.isAi) {
        turnMessage.textContent = `${activePlayer.name} is calculating...`
        aiThinkingIndicator.classList.remove("hidden")
      } else {
        turnMessage.textContent = `${activePlayer.name}'s turn`
        aiThinkingIndicator.classList.add("hidden")
      }
    } else {
      turnMessage.textContent = `${game.currentPlayer === "X" ? player1.name : player2.name}'s turn`
      aiThinkingIndicator.classList.add("hidden")
    }

    // Update active player card glow
    cardPlayerX.classList.toggle("active-turn", game.currentPlayer === "X")
    cardPlayerO.classList.toggle("active-turn", game.currentPlayer === "O")
  }

  function renderBoard() {
    const isOnlineNotMyTurn = currentMode === "online" && (!multiplayer.isConnected || game.currentPlayer !== multiplayer.mySymbol)
    const isAiTurn = currentMode === "ai" && (isAiThinking || game.currentPlayer === "O")
    const isTourneyAiTurn = currentMode === "tournament" && isAiThinking

    boardCells.forEach((cell, idx) => {
      const val = game.board[idx]
      cell.textContent = val || ""
      cell.className = "board-cell"
      if (val === "X") cell.classList.add("cell-x")
      if (val === "O") cell.classList.add("cell-o")

      const isDisabled = game.status === "ended" || val !== null || isOnlineNotMyTurn || isAiTurn || isTourneyAiTurn
      cell.disabled = isDisabled
    })

    updateTurnBanner()
    updateScoreboardProfiles()
  }

  // SVG Strike Line Drawer
  function drawStrikeLine(coords) {
    if (!coords) return
    const [x1, y1, x2, y2] = coords
    strikeLine.setAttribute("x1", x1)
    strikeLine.setAttribute("y1", y1)
    strikeLine.setAttribute("x2", x2)
    strikeLine.setAttribute("y2", y2)
    strikeLine.classList.add("drawn")
  }

  function clearStrikeLine() {
    strikeLine.classList.remove("drawn")
  }

  // Game Move Handler
  function handleCellClick(index) {
    if (game.status !== "playing" || isAiThinking) return
    if (game.board[index] !== null) return

    // Prevent moving if it's not our turn in online P2P
    if (currentMode === "online") {
      if (!multiplayer.isConnected) return
      if (game.currentPlayer !== multiplayer.mySymbol) return
    }

    // In tournament mode, prevent manual click if current contender is AI
    if (currentMode === "tournament") {
      const activeP = game.currentPlayer === "X" ? player1 : player2
      if (activeP.isAi) return
    }

    const currentSymbol = game.currentPlayer
    const success = game.makeMove(index, currentSymbol)

    if (success) {
      sound.playMoveSound(currentSymbol)
      renderBoard()

      if (currentMode === "online" && multiplayer.isConnected) {
        multiplayer.sendMove(index, currentSymbol)
      }

      if (currentMode === "tournament" && tournament.isOnline && multiplayer.isConnected) {
        multiplayer.sendData({
          type: "tourney_move",
          index,
          symbol: currentSymbol
        })
      }

      if (game.status === "ended") {
        handleGameOver()
      } else if (currentMode === "ai" && game.currentPlayer === "O") {
        triggerAiMove()
      } else if (currentMode === "tournament") {
        const nextP = game.currentPlayer === "X" ? player1 : player2
        if (nextP.isAi) {
          triggerTourneyAiMove(nextP)
        }
      }
    }
  }

  // AI Move Execution (Vs AI Mode)
  function triggerAiMove() {
    isAiThinking = true
    renderBoard()

    setTimeout(() => {
      if (game.status !== "playing" || currentMode !== "ai") {
        isAiThinking = false
        renderBoard()
        return
      }

      const bestMove = ai.getMove([...game.board])
      if (bestMove !== null) {
        const success = game.makeMove(bestMove, "O")
        if (success) {
          sound.playMoveSound("O")
        }
      }
      isAiThinking = false
      renderBoard()
      if (game.status === "ended") {
        handleGameOver()
      }
    }, 450)
  }

  // Tournament AI Move Execution
  function triggerTourneyAiMove(aiPlayer) {
    isAiThinking = true
    renderBoard()

    setTimeout(() => {
      if (game.status !== "playing" || currentMode !== "tournament") {
        isAiThinking = false
        renderBoard()
        return
      }

      const symbol = game.currentPlayer
      ai.setDifficulty(aiPlayer.aiDifficulty || "medium")
      const bestMove = ai.getMove([...game.board])
      if (bestMove !== null) {
        const success = game.makeMove(bestMove, symbol)
        if (success) {
          sound.playMoveSound(symbol)
        }
      }
      isAiThinking = false
      renderBoard()
      if (game.status === "ended") {
        handleGameOver()
      } else {
        const nextContender = game.currentPlayer === "X" ? player1 : player2
        if (nextContender.isAi) {
          triggerTourneyAiMove(nextContender)
        }
      }
    }, 500)
  }

  // Game Over Handling
  function handleGameOver() {
    const winner = game.winner

    if (game.winningLine) {
      game.winningLine.forEach((idx) => {
        const cell = document.getElementById(`cell-${idx}`)
        if (cell) cell.classList.add("winner-cell")
      })

      const winCheck = game.checkWinner()
      if (winCheck && winCheck.coords) {
        drawStrikeLine(winCheck.coords)
      }
    }

    let resultType = "draw"
    let winnerName = "Nobody"

    if (winner === "X") {
      winnerName = player1.name
      if (currentMode === "online") {
        resultType = multiplayer.mySymbol === "X" ? "win" : "loss"
      } else {
        resultType = "win"
      }
    } else if (winner === "O") {
      winnerName = player2.name
      if (currentMode === "online") {
        resultType = multiplayer.mySymbol === "O" ? "win" : "loss"
      } else {
        resultType = currentMode === "ai" ? "loss" : "win"
      }
    }

    // Tournament Specific Outcome Handling
    if (currentMode === "tournament" && tournament.status === "active") {
      const match = tournament.getCurrentMatch()

      // In case of a draw in tournament knockout: Sudden-Death Tiebreaker!
      if (winner === "draw") {
        sound.playDrawSound()
        resultTitle.textContent = "Tiebreaker Needed!"
        resultSubtitle.textContent = "Draw! Replaying match for a knockout winner..."
        if (btnNextRoundText) btnNextRoundText.textContent = "Replay Match"
        setTimeout(() => modalResult.classList.remove("hidden"), 600)
        return
      }

      const matchWinner = winner === "X" ? match.player1 : match.player2
      const matchLoser = winner === "X" ? match.player2 : match.player1

      sound.playWinSound()
      triggerConfetti()
      if (resultIconWrapper) {
        resultIconWrapper.innerHTML = '<i data-lucide="trophy" class="text-warning"></i>'
      }
      resultTitle.textContent = `${matchWinner.name} Advances!`
      resultSubtitle.textContent = `${match.stageName} winner`
      if (btnNextRoundText) btnNextRoundText.textContent = "Next Tournament Match"

      // Advance bracket
      tournament.recordMatchWinner(matchWinner, matchLoser)

      setTimeout(() => {
        modalResult.classList.remove("hidden")
      }, 600)
      return
    }

    // Standard Modes Victory / Defeat UI
    if (btnNextRoundText) btnNextRoundText.textContent = "Play Next Round"

    if (resultType === "win") {
      sound.playWinSound()
      triggerConfetti()
      if (resultIconWrapper) {
        resultIconWrapper.innerHTML = '<i data-lucide="trophy" class="text-warning"></i>'
      }
      resultTitle.textContent = "Victory!"
      resultSubtitle.textContent = `${winnerName} wins round ${game.round}!`
    } else if (resultType === "loss") {
      sound.playLossSound()
      if (resultIconWrapper) {
        resultIconWrapper.innerHTML = '<i data-lucide="frown" class="text-danger"></i>'
      }
      resultTitle.textContent = "Defeat!"
      resultSubtitle.textContent = `${winnerName} won this round!`
    } else {
      sound.playDrawSound()
      if (resultIconWrapper) {
        resultIconWrapper.innerHTML = '<i data-lucide="scale" class="text-muted"></i>'
      }
      resultTitle.textContent = "It's a Draw!"
      resultSubtitle.textContent = "Well matched game!"
    }

    if (window.lucide) window.lucide.createIcons()

    if (currentMode !== "local") {
      const oppName = currentMode === "online" 
        ? (multiplayer.isHost ? player2.name : player1.name)
        : player2.name

      storage.recordMatchResult(
        resultType,
        oppName,
        currentMode.toUpperCase(),
        game.moveCount
      )
      updateLiveStats()
    }

    resStatWinner.textContent = winner === "draw" ? "Draw" : winner
    resStatMoves.textContent = game.moveCount
    resStatScore.textContent = `${game.scores.X} - ${game.scores.O}`

    setTimeout(() => {
      modalResult.classList.remove("hidden")
    }, 600)
  }

  // Confetti Explosion
  function triggerConfetti() {
    if (typeof confetti === "function") {
      confetti({
        particleCount: 75,
        spread: 75,
        origin: { y: 0.6 },
        colors: ["#10b981", "#f97316", "#34d399", "#fbbf24", "#60a5fa"]
      })
    }
  }

  // Next Round / Reset Functions
  function startNextRound(notifyRemote = false) {
    clearStrikeLine()
    modalResult.classList.add("hidden")

    if (currentMode === "tournament") {
      if (tournament.status === "completed") {
        showTournamentPodium()
        return
      }
      sound.playBracketAdvanceSound()
      loadCurrentTournamentMatch()
      return
    }

    game.nextRound()
    renderBoard()
    if (notifyRemote && currentMode === "online" && multiplayer.isConnected) {
      multiplayer.sendRematch()
    }
  }

  function resetCurrentRound(notifyRemote = false) {
    clearStrikeLine()
    modalResult.classList.add("hidden")
    game.resetRound()
    renderBoard()
    if (notifyRemote && currentMode === "online" && multiplayer.isConnected) {
      multiplayer.sendReset()
    }
    if (currentMode === "tournament") {
      const match = tournament.getCurrentMatch()
      if (match && match.player1 && match.player1.isAi && game.currentPlayer === "X") {
        triggerTourneyAiMove(match.player1)
      }
    }
  }

  function resetWholeMatch(notifyRemote = false) {
    clearStrikeLine()
    modalResult.classList.add("hidden")
    game.resetScores()
    renderBoard()
    if (notifyRemote && currentMode === "online" && multiplayer.isConnected) {
      multiplayer.sendReset()
    }
  }

  // Custom Inline Name Prompt Utility
  function promptCustomName(targetPlayerKey) {
    sound.playClickSound()
    const currentName = targetPlayerKey === "X" ? player1.name : player2.name
    const entered = window.prompt(`Enter custom name for ${targetPlayerKey === "X" ? "Player 1 (X)" : "Player 2 (O)"}:`, currentName)
    if (entered !== null && entered.trim().length > 0) {
      const cleanName = entered.trim().substring(0, 15)
      if (targetPlayerKey === "X") {
        player1.name = cleanName
        storage.saveProfile({ name: cleanName, avatar: player1.avatar })
        if (currentMode === "online") {
          multiplayer.updateLocalPlayerInfo({ name: cleanName })
        }
      } else {
        player2.name = cleanName
        if (currentMode === "online" && !multiplayer.isHost) {
          storage.saveProfile({ name: cleanName, avatar: player2.avatar })
          multiplayer.updateLocalPlayerInfo({ name: cleanName })
        }
      }
      updateScoreboardProfiles()
      updateTurnBanner()
    }
  }

  if (btnEditNameX) btnEditNameX.addEventListener("click", () => promptCustomName("X"))
  if (btnEditNameO) btnEditNameO.addEventListener("click", () => promptCustomName("O"))
  if (namePlayerX) namePlayerX.addEventListener("click", () => promptCustomName("X"))
  if (namePlayerO) namePlayerO.addEventListener("click", () => promptCustomName("O"))

  // Mode Switching
  function setMode(mode) {
    currentMode = mode
    document.querySelectorAll(".mode-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.getAttribute("data-mode") === mode)
    })

    aiDifficultyBar.classList.toggle("hidden", mode !== "ai")
    onlineStatusBar.classList.toggle("hidden", mode !== "online")
    tournamentStatusBar.classList.toggle("hidden", mode !== "tournament")

    const profile = storage.getProfile()

    if (mode === "ai") {
      player1 = { name: profile.name || "Player 1", avatar: profile.avatar || "user", symbol: "X", isAi: false }
      player2 = { name: "AI Bot", avatar: "bot", symbol: "O", isAi: true }
      multiplayer.disconnect()
      resetWholeMatch(false)
    } else if (mode === "local") {
      player1 = { name: profile.name || "Player 1", avatar: profile.avatar || "user", symbol: "X", isAi: false }
      player2 = { name: "Player 2", avatar: "user-check", symbol: "O", isAi: false }
      multiplayer.disconnect()
      resetWholeMatch(false)
    } else if (mode === "online") {
      player1 = { name: profile.name || "Player 1", avatar: profile.avatar || "user", symbol: "X", isAi: false }
      player2 = { name: "Opponent", avatar: "wifi", symbol: "O", isAi: false }
      if (inputOnlinePlayerName) inputOnlinePlayerName.value = player1.name
      modalOnline.classList.remove("hidden")
      tabHostRoom.classList.add("active")
      tabJoinRoom.classList.remove("active")
      viewHost.classList.remove("hidden")
      viewJoin.classList.add("hidden")
      multiplayer.hostRoom(undefined, { name: player1.name, avatar: player1.avatar })
      resetWholeMatch(false)
    } else if (mode === "tournament") {
      multiplayer.disconnect()
      if (tournament.status !== "active") {
        openTournamentSetup()
      } else {
        loadCurrentTournamentMatch()
      }
    }
  }

  // --- Tournament Logic & UI Handlers ---

  function openTournamentSetup() {
    renderRosterInputs(tourneySize)
    document.getElementById("tourney-setup-view").classList.remove("hidden")
    document.getElementById("tourney-bracket-view").classList.add("hidden")
    modalTournament.classList.remove("hidden")

    if (tourneyModeType === "online") {
      setupOnlineTournamentLobby()
    }
  }

  function setupOnlineTournamentLobby() {
    tourneyRoomCode = multiplayer.generateRoomCode()
    tournament.roomCode = tourneyRoomCode
    tournament.isOnline = true
    tournament.isHost = true

    if (displayTourneyCode) displayTourneyCode.textContent = tourneyRoomCode
    const profile = storage.getProfile()
    multiplayer.hostRoom(`TRN-${tourneyRoomCode}`, {
      name: profile.name || "Player 1",
      avatar: profile.avatar || "crown",
      isHost: true,
      isTourney: true
    })
  }

  function renderRosterInputs(count) {
    const grid = document.getElementById("roster-grid")
    if (!grid) return
    grid.innerHTML = ""

    const profile = storage.getProfile()
    const defaultNames = ["Player 1", "Alex", "Sam", "Jordan", "Taylor", "Morgan", "Riley", "Casey"]
    const defaultAvatars = ["user", "zap", "shield", "crown", "flame", "target", "bot", "heart"]

    tourneyRoster = []
    for (let i = 0; i < count; i++) {
      const isP1 = i === 0
      const slotData = {
        id: `p_${i + 1}`,
        name: isP1 ? (profile.name || "Player 1") : defaultNames[i],
        avatar: isP1 ? (profile.avatar || "user") : defaultAvatars[i],
        isAi: !isP1
      }
      tourneyRoster.push(slotData)

      const card = document.createElement("div")
      card.className = "roster-slot-card"
      card.innerHTML = `
        <span class="slot-num">#${i + 1}</span>
        <input type="text" class="slot-input" data-index="${i}" value="${slotData.name}" maxlength="12" placeholder="Player ${i + 1} Name" />
        <button class="slot-type-btn ${slotData.isAi ? 'is-ai' : ''}" data-index="${i}">
          ${slotData.isAi ? '🤖 Bot' : '👤 Human'}
        </button>
      `
      grid.appendChild(card)
    }

    // Toggle Human / AI for each roster slot
    grid.querySelectorAll(".slot-type-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        sound.playClickSound()
        const idx = parseInt(btn.getAttribute("data-index"), 10)
        tourneyRoster[idx].isAi = !tourneyRoster[idx].isAi
        btn.classList.toggle("is-ai", tourneyRoster[idx].isAi)
        btn.textContent = tourneyRoster[idx].isAi ? "🤖 Bot" : "👤 Human"
      })
    })

    // Update roster names on input
    grid.querySelectorAll(".slot-input").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        const idx = parseInt(e.target.getAttribute("data-index"), 10)
        tourneyRoster[idx].name = e.target.value.trim() || `Player ${idx + 1}`
      })
    })

    if (window.lucide) window.lucide.createIcons()
  }

  // Tournament tab toggles (Online vs Local)
  if (tabTourneyOnline) {
    tabTourneyOnline.addEventListener("click", () => {
      sound.playClickSound()
      tourneyModeType = "online"
      tabTourneyOnline.classList.add("active")
      tabTourneyLocal.classList.remove("active")
      viewTourneyOnline.classList.remove("hidden")
      setupOnlineTournamentLobby()
    })
  }

  if (tabTourneyLocal) {
    tabTourneyLocal.addEventListener("click", () => {
      sound.playClickSound()
      tourneyModeType = "local"
      tabTourneyLocal.classList.add("active")
      tabTourneyOnline.classList.remove("active")
      viewTourneyOnline.classList.add("hidden")
      tournament.isOnline = false
      multiplayer.disconnect()
    })
  }

  if (btnCopyTourneyCode) {
    btnCopyTourneyCode.addEventListener("click", () => {
      if (tourneyRoomCode) {
        navigator.clipboard.writeText(tourneyRoomCode)
        alert(`Tournament code ${tourneyRoomCode} copied!`)
      }
    })
  }

  if (btnCopyTourneyLink) {
    btnCopyTourneyLink.addEventListener("click", () => {
      if (tourneyRoomCode) {
        const url = `${window.location.origin}${window.location.pathname}?tourney=${tourneyRoomCode}`
        navigator.clipboard.writeText(url)
        alert("Online tournament invite link copied! Send it to your friends to join.")
      }
    })
  }

  if (btnJoinTourneyPrompt) {
    btnJoinTourneyPrompt.addEventListener("click", () => {
      tourneyJoinBar.classList.toggle("hidden")
    })
  }

  if (btnSubmitTourneyJoin) {
    btnSubmitTourneyJoin.addEventListener("click", () => {
      const code = inputTourneyJoinCode.value.trim().toUpperCase()
      if (!code) {
        alert("Please enter a valid tournament code.")
        return
      }
      joinOnlineTournament(code)
    })
  }

  function joinOnlineTournament(code) {
    sound.playClickSound()
    const cleanCode = code.replace(/^TRN-/, "")
    tourneyModeType = "online"
    tournament.isOnline = true
    tournament.isHost = false
    tournament.roomCode = cleanCode

    const profile = storage.getProfile()
    const guestName = profile.name && profile.name !== "Player 1" ? profile.name : "Challenger"
    multiplayer.joinRoom(`TRN-${cleanCode}`, {
      name: guestName,
      avatar: profile.avatar || "zap",
      isTourney: true
    })

    alert(`Connecting to Tournament Room: ${cleanCode}...`)
  }

  // Size pill clicks (4 vs 8)
  document.getElementById("btn-size-4").addEventListener("click", () => {
    sound.playClickSound()
    tourneySize = 4
    document.getElementById("btn-size-4").classList.add("active")
    document.getElementById("btn-size-8").classList.remove("active")
    renderRosterInputs(4)
  })

  document.getElementById("btn-size-8").addEventListener("click", () => {
    sound.playClickSound()
    tourneySize = 8
    document.getElementById("btn-size-8").classList.add("active")
    document.getElementById("btn-size-4").classList.remove("active")
    renderRosterInputs(8)
  })

  // Fill remaining slots with AI
  document.getElementById("btn-auto-fill-ai").addEventListener("click", () => {
    sound.playClickSound()
    document.querySelectorAll(".slot-type-btn").forEach((btn, idx) => {
      if (idx > 0) {
        tourneyRoster[idx].isAi = true
        btn.classList.add("is-ai")
        btn.textContent = "🤖 Bot"
      }
    })
  })

  // Start Tournament Button Click
  document.getElementById("btn-start-tourney").addEventListener("click", () => {
    sound.playClickSound()
    tournament.createRoster(tourneySize, tourneyRoster)
    tournament.startTournament()
    renderVisualBracket()
    modalTournament.classList.add("hidden")
    loadCurrentTournamentMatch()
  })

  // Render Interactive Visual Bracket
  function renderVisualBracket() {
    const container = document.getElementById("bracket-tree-container")
    if (!container) return
    container.innerHTML = ""

    const stages = tourneySize === 4 
      ? ["semi", "third_place", "final"]
      : ["quarter", "semi", "third_place", "final"]

    const stageTitles = {
      quarter: "Quarter-Finals (Knockout)",
      semi: "Semi-Finals",
      third_place: "3rd Place Playoff (Bronze Medal)",
      final: "Grand Final (Championship)"
    }

    stages.forEach((stageKey) => {
      const stageMatches = tournament.matches.filter((m) => m.stage === stageKey)
      if (stageMatches.length === 0) return

      const block = document.createElement("div")
      block.className = "bracket-stage-block"
      block.innerHTML = `<span class="bracket-stage-title">${stageTitles[stageKey]}</span>`

      stageMatches.forEach((m) => {
        const isCurrent = tournament.getCurrentMatch() && tournament.getCurrentMatch().id === m.id
        const p1Name = m.player1 ? m.player1.name : "TBD"
        const p2Name = m.player2 ? m.player2.name : "TBD"

        const p1Win = m.winner && m.winner.id === (m.player1 && m.player1.id)
        const p2Win = m.winner && m.winner.id === (m.player2 && m.player2.id)

        const matchEl = document.createElement("div")
        matchEl.className = `bracket-match-item ${isCurrent ? 'is-current' : ''}`
        matchEl.innerHTML = `
          <div class="bracket-participant ${p1Win ? 'is-winner' : m.loser && m.loser.id === (m.player1 && m.player1.id) ? 'is-loser' : ''}">
            <span>${p1Name}</span>
            ${p1Win ? '<i data-lucide="check" style="width:14px;height:14px;"></i>' : ''}
          </div>
          <div class="bracket-participant ${p2Win ? 'is-winner' : m.loser && m.loser.id === (m.player2 && m.player2.id) ? 'is-loser' : ''}">
            <span>${p2Name}</span>
            ${p2Win ? '<i data-lucide="check" style="width:14px;height:14px;"></i>' : ''}
          </div>
        `
        block.appendChild(matchEl)
      })
      container.appendChild(block)
    })

    if (window.lucide) window.lucide.createIcons()
  }

  function loadCurrentTournamentMatch() {
    const match = tournament.getCurrentMatch()
    if (!match) {
      showTournamentPodium()
      return
    }

    player1 = {
      name: match.player1 ? match.player1.name : "Player 1",
      avatar: match.player1 ? match.player1.avatar : "user",
      symbol: "X",
      isAi: match.player1 ? match.player1.isAi : false,
      aiDifficulty: match.player1 ? match.player1.aiDifficulty : "medium"
    }

    player2 = {
      name: match.player2 ? match.player2.name : "Player 2",
      avatar: match.player2 ? match.player2.avatar : "bot",
      symbol: "O",
      isAi: match.player2 ? match.player2.isAi : true,
      aiDifficulty: match.player2 ? match.player2.aiDifficulty : "medium"
    }

    tourneyStageBadge.textContent = match.stageName
    tourneyMatchText.textContent = `Match ${tournament.currentMatchIndex + 1} of ${tournament.matches.length}`

    game.resetScores()
    clearStrikeLine()
    renderBoard()

    // If contender 1 is AI, trigger first move
    if (player1.isAi) {
      triggerTourneyAiMove(player1)
    }
  }

  // Bracket View Trigger
  document.getElementById("btn-open-bracket").addEventListener("click", () => {
    sound.playClickSound()
    renderVisualBracket()
    document.getElementById("tourney-setup-view").classList.add("hidden")
    document.getElementById("tourney-bracket-view").classList.remove("hidden")
    modalTournament.classList.remove("hidden")
  })

  document.getElementById("btn-continue-tourney-match").addEventListener("click", () => {
    sound.playClickSound()
    modalTournament.classList.add("hidden")
    loadCurrentTournamentMatch()
  })

  // Offline / AFK Player Auto-Play with AI button
  document.getElementById("btn-ai-substitute").addEventListener("click", () => {
    sound.playClickSound()
    const match = tournament.getCurrentMatch()
    if (!match) return

    const activeP = game.currentPlayer === "X" ? match.player1 : match.player2
    if (!activeP) return

    if (!activeP.isAi) {
      tournament.substitutePlayerWithAi(activeP.id, "medium")
      if (game.currentPlayer === "X") {
        player1.isAi = true
        player1.name = `${player1.name} (AI Bot)`
        player1.avatar = "bot"
        triggerTourneyAiMove(player1)
      } else {
        player2.isAi = true
        player2.name = `${player2.name} (AI Bot)`
        player2.avatar = "bot"
        triggerTourneyAiMove(player2)
      }
      updateScoreboardProfiles()
      updateTurnBanner()
    }
  })

  // Show Grand Podium Modal (1st, 2nd, 3rd Place)
  function showTournamentPodium() {
    const podium = tournament.podium.first ? tournament.podium : tournament.calculatePodium()

    const name1 = document.getElementById("podium-name-1")
    const name2 = document.getElementById("podium-name-2")
    const name3 = document.getElementById("podium-name-3")
    const avatar1 = document.getElementById("podium-avatar-1")
    const avatar2 = document.getElementById("podium-avatar-2")
    const avatar3 = document.getElementById("podium-avatar-3")

    if (name1) name1.textContent = podium.first ? podium.first.name : "TBD"
    if (name2) name2.textContent = podium.second ? podium.second.name : "TBD"
    if (name3) name3.textContent = podium.third ? podium.third.name : "TBD"

    if (avatar1 && podium.first) renderAvatar(avatar1, podium.first.avatar || "crown")
    if (avatar2 && podium.second) renderAvatar(avatar2, podium.second.avatar || "user")
    if (avatar3 && podium.third) renderAvatar(avatar3, podium.third.avatar || "user")

    const profile = storage.getProfile()
    if (podium.first && podium.first.name === profile.name) {
      storage.recordTournamentPodium(1, `${tourneySize}-Player`)
    } else if (podium.second && podium.second.name === profile.name) {
      storage.recordTournamentPodium(2, `${tourneySize}-Player`)
    } else if (podium.third && podium.third.name === profile.name) {
      storage.recordTournamentPodium(3, `${tourneySize}-Player`)
    }

    sound.playPodiumSound()
    triggerConfetti()
    modalPodium.classList.remove("hidden")
  }

  // Play New Tournament Button
  document.getElementById("btn-new-tournament").addEventListener("click", () => {
    sound.playClickSound()
    modalPodium.classList.add("hidden")
    openTournamentSetup()
  })

  // Online P2P Event Bindings
  multiplayer.onStatusChange = (status, code) => {
    p2pStatusDot.className = `status-dot ${status}`
    if (status === "waiting") {
      p2pStatusText.textContent = `Room: ${code} (Waiting)`
      if (displayRoomCode) displayRoomCode.textContent = code
    } else if (status === "connecting") {
      p2pStatusText.textContent = "Connecting..."
      if (joinStatusMessage) {
        joinStatusMessage.textContent = "Connecting to room host..."
        joinStatusMessage.className = "status-msg text-warning"
      }
    } else if (status === "connected") {
      const oppName = multiplayer.isHost
        ? (player2.name === player1.name ? "Player 2" : player2.name)
        : (player1.name || "Player 1")
      p2pStatusText.textContent = `Connected: ${oppName}`
      modalOnline.classList.add("hidden")
      if (joinStatusMessage) {
        joinStatusMessage.textContent = "Connected!"
        joinStatusMessage.className = "status-msg text-success"
      }
      resetWholeMatch(false)
    } else {
      p2pStatusText.textContent = "Disconnected"
    }
  }

  multiplayer.onOpponentJoined = (opponent) => {
    if (opponent.isTourney) {
      // Add online player into tournament roster
      const slot = tournament.addOnlinePlayer({
        id: opponent.id || `p_online_${Date.now()}`,
        name: opponent.name || "Online Challenger",
        avatar: opponent.avatar || "user",
        isAi: false
      })
      if (slot !== -1) {
        renderRosterInputs(tourneySize)
      }
    } else if (multiplayer.isHost) {
      const guestName = opponent.name && opponent.name !== player1.name ? opponent.name : "Player 2"
      player2.name = guestName
      player2.avatar = opponent.avatar || "user-check"
    } else {
      const hostName = opponent.name || "Player 1"
      player1.name = hostName
      player1.avatar = opponent.avatar || "user"
    }
    updateScoreboardProfiles()
    updateTurnBanner()
  }

  multiplayer.onMoveReceived = (index, symbol) => {
    const success = game.makeMove(index, symbol)
    if (success) {
      sound.playMoveSound(symbol)
      renderBoard()
      if (game.status === "ended") {
        handleGameOver()
      }
    }
  }

  multiplayer.onRematchReceived = () => {
    startNextRound(false)
  }

  multiplayer.onResetReceived = () => {
    resetWholeMatch(false)
  }

  multiplayer.onError = (msg) => {
    if (joinStatusMessage) {
      joinStatusMessage.textContent = msg
      joinStatusMessage.className = "status-msg text-danger"
    }
  }

  // Emoji Reactions
  function showFloatingEmoji(emoji) {
    sound.playReactionSound()
    const container = document.getElementById("floating-emojis-container")
    if (!container) return
    const el = document.createElement("div")
    el.className = "floating-emoji"
    el.textContent = emoji
    el.style.left = `${Math.random() * 30}px`
    container.appendChild(el)
    setTimeout(() => el.remove(), 2000)
  }

  // UI Event Listeners

  // Board Clicks
  boardCells.forEach((cell) => {
    cell.addEventListener("click", () => {
      const idx = parseInt(cell.getAttribute("data-index"), 10)
      handleCellClick(idx)
    })
  })

  // Mode Tabs
  document.querySelectorAll(".mode-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      sound.playClickSound()
      const mode = tab.getAttribute("data-mode")
      setMode(mode)
    })
  })

  // AI Difficulty Pills
  document.querySelectorAll(".diff-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      sound.playClickSound()
      aiDifficulty = pill.getAttribute("data-diff")
      ai.setDifficulty(aiDifficulty)
      updateDifficultyPills()
      savedSettings.aiDifficulty = aiDifficulty
      storage.saveSettings(savedSettings)
    })
  })

  // Sound Toggle Button
  document.getElementById("btn-sound-toggle").addEventListener("click", () => {
    sound.setSoundEnabled(!sound.enabled)
    sound.playClickSound()
    savedSettings.soundEnabled = sound.enabled
    storage.saveSettings(savedSettings)
    updateSoundIcon()
  })

  // Quick Action Buttons
  document.getElementById("btn-quick-reset").addEventListener("click", () => {
    sound.playClickSound()
    resetCurrentRound(true)
  })

  document.getElementById("btn-reset-match").addEventListener("click", () => {
    sound.playClickSound()
    resetWholeMatch(true)
  })

  btnNextRound.addEventListener("click", () => {
    sound.playClickSound()
    startNextRound(true)
  })

  document.getElementById("btn-close-result-modal").addEventListener("click", () => {
    sound.playClickSound()
    modalResult.classList.add("hidden")
  })

  // Emoji Reaction Buttons
  document.querySelectorAll(".emoji-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const emoji = btn.getAttribute("data-emoji")
      showFloatingEmoji(emoji)
      if (currentMode === "online" && multiplayer.isConnected) {
        multiplayer.sendReaction(emoji)
      }
    })
  })

  multiplayer.onReactionReceived = (emoji) => {
    showFloatingEmoji(emoji)
  }

  // Modal Triggers & Closers
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sound.playClickSound()
      const targetId = btn.getAttribute("data-close")
      const modal = document.getElementById(targetId)
      if (modal) modal.classList.add("hidden")
    })
  })

  // Close modals on overlay backdrop click
  document.querySelectorAll(".modal-overlay").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden")
      }
    })
  })

  // Stats Modal Trigger & Population
  document.getElementById("btn-open-stats").addEventListener("click", () => {
    sound.playClickSound()
    updateLiveStats()
    modalStats.classList.remove("hidden")
  })

  // Clear History
  document.getElementById("btn-clear-history").addEventListener("click", () => {
    if (confirm("Clear all stats and match history?")) {
      storage.clearStatsAndHistory()
      updateLiveStats()
      modalStats.classList.add("hidden")
    }
  })

  // Settings Modal Trigger
  document.getElementById("btn-open-settings").addEventListener("click", () => {
    sound.playClickSound()
    const profile = storage.getProfile()
    document.getElementById("input-p1-name").value = profile.name || player1.name
    document.getElementById("range-volume").value = Math.round(sound.volume * 100)
    document.getElementById("volume-val-display").textContent = `${Math.round(sound.volume * 100)}%`

    const userAvatar = profile.avatar || player1.avatar
    document.querySelectorAll(".avatar-opt").forEach((opt) => {
      opt.classList.toggle("active", opt.getAttribute("data-avatar") === userAvatar)
    })

    modalSettings.classList.remove("hidden")
  })

  // Avatar Picker Selection
  document.querySelectorAll(".avatar-opt").forEach((opt) => {
    opt.addEventListener("click", () => {
      sound.playClickSound()
      document.querySelectorAll(".avatar-opt").forEach((o) => o.classList.remove("active"))
      opt.classList.add("active")
    })
  })

  // Volume Range Input
  document.getElementById("range-volume").addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10)
    document.getElementById("volume-val-display").textContent = `${val}%`
    sound.setVolume(val)
  })

  // Save Settings Form
  document.getElementById("btn-save-settings").addEventListener("click", () => {
    sound.playClickSound()
    const nameVal = document.getElementById("input-p1-name").value.trim()
    const activeAvatar = document.querySelector(".avatar-opt.active")
    const avatarVal = activeAvatar ? activeAvatar.getAttribute("data-avatar") : player1.avatar

    if (nameVal) {
      if (currentMode === "online" && !multiplayer.isHost) {
        player2.name = nameVal
        player2.avatar = avatarVal
      } else {
        player1.name = nameVal
        player1.avatar = avatarVal
      }
    }

    storage.saveProfile({ name: nameVal || player1.name, avatar: avatarVal })
    savedSettings.volume = Math.round(sound.volume * 100)
    storage.saveSettings(savedSettings)

    updateScoreboardProfiles()
    modalSettings.classList.add("hidden")
  })

  // Online Modal Subtabs & Actions
  const tabHostRoom = document.getElementById("tab-host-room")
  const tabJoinRoom = document.getElementById("tab-join-room")
  const viewHost = document.getElementById("view-host")
  const viewJoin = document.getElementById("view-join")

  tabHostRoom.addEventListener("click", () => {
    sound.playClickSound()
    tabHostRoom.classList.add("active")
    tabJoinRoom.classList.remove("active")
    viewHost.classList.remove("hidden")
    viewJoin.classList.add("hidden")
    const customName = inputOnlinePlayerName.value.trim() || player1.name
    player1 = { name: customName, avatar: player1.avatar || "user", symbol: "X" }
    player2 = { name: "Opponent", avatar: "wifi", symbol: "O" }
    updateScoreboardProfiles()
    multiplayer.hostRoom(undefined, { name: player1.name, avatar: player1.avatar })
  })

  tabJoinRoom.addEventListener("click", () => {
    sound.playClickSound()
    tabJoinRoom.classList.add("active")
    tabHostRoom.classList.remove("active")
    viewJoin.classList.remove("hidden")
    viewHost.classList.add("hidden")
  })

  document.getElementById("btn-open-online-lobby").addEventListener("click", () => {
    sound.playClickSound()
    modalOnline.classList.remove("hidden")
  })

  document.getElementById("btn-copy-code").addEventListener("click", () => {
    if (multiplayer.roomCode) {
      navigator.clipboard.writeText(multiplayer.roomCode)
      alert(`Room Code ${multiplayer.roomCode} copied to clipboard!`)
    }
  })

  document.getElementById("btn-copy-invite-link").addEventListener("click", () => {
    if (multiplayer.roomCode) {
      const url = `${window.location.origin}${window.location.pathname}?room=${multiplayer.roomCode}`
      navigator.clipboard.writeText(url)
      alert("Direct invite link copied! Send it to your friend to join instantly.")
    }
  })

  document.getElementById("btn-connect-room").addEventListener("click", () => {
    const code = inputRoomCode.value.trim()
    if (!code) {
      joinStatusMessage.textContent = "Please enter a valid room code"
      joinStatusMessage.className = "status-msg text-danger"
      return
    }
    const customName = inputOnlinePlayerName.value.trim() || "Player 2"
    player1 = { name: "Player 1", avatar: "user", symbol: "X" }
    player2 = { name: customName, avatar: "user-check", symbol: "O" }
    updateScoreboardProfiles()
    multiplayer.joinRoom(code, { name: player2.name, avatar: player2.avatar })
  })

  // Check URL query parameters for auto-join
  const urlParams = new URLSearchParams(window.location.search)
  const roomParam = urlParams.get("room")
  const tourneyParam = urlParams.get("tourney")

  if (roomParam) {
    currentMode = "online"
    document.querySelectorAll(".mode-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.getAttribute("data-mode") === "online")
    })
    aiDifficultyBar.classList.add("hidden")
    onlineStatusBar.classList.remove("hidden")
    tournamentStatusBar.classList.add("hidden")

    modalOnline.classList.remove("hidden")
    tabJoinRoom.classList.add("active")
    tabHostRoom.classList.remove("active")
    viewJoin.classList.remove("hidden")
    viewHost.classList.add("hidden")
    inputRoomCode.value = roomParam.toUpperCase()

    const profile = storage.getProfile()
    const guestName = profile.name && profile.name !== "Player 1" ? profile.name : "Player 2"
    player1 = { name: "Player 1", avatar: "user", symbol: "X" }
    player2 = { name: guestName, avatar: profile.avatar || "user-check", symbol: "O" }
    updateScoreboardProfiles()
    multiplayer.joinRoom(roomParam, { name: player2.name, avatar: player2.avatar })
  } else if (tourneyParam) {
    setMode("tournament")
    joinOnlineTournament(tourneyParam)
  }

  // Initial Render
  renderBoard()
})
