class StorageManager {
  constructor() {
    this.KEYS = {
      PROFILE: "ttt_royale_profile",
      STATS: "ttt_royale_stats",
      HISTORY: "ttt_royale_history",
      SETTINGS: "ttt_royale_settings"
    }
  }

  // Profile Management
  getProfile() {
    const defaultProfile = {
      name: "Player 1",
      avatar: "user"
    }
    try {
      const data = localStorage.getItem(this.KEYS.PROFILE)
      return data ? { ...defaultProfile, ...JSON.parse(data) } : defaultProfile
    } catch (e) {
      return defaultProfile
    }
  }

  saveProfile(profile) {
    try {
      localStorage.setItem(this.KEYS.PROFILE, JSON.stringify(profile))
    } catch (e) {}
  }

  // Settings Management
  getSettings() {
    const defaultSettings = {
      theme: "dark",
      soundEnabled: true,
      volume: 80,
      aiDifficulty: "hard"
    }
    try {
      const data = localStorage.getItem(this.KEYS.SETTINGS)
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings
    } catch (e) {
      return defaultSettings
    }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings))
    } catch (e) {}
  }

  // Stats Management
  getStats() {
    const defaultStats = {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      currentStreak: 0,
      bestStreak: 0
    }
    try {
      const data = localStorage.getItem(this.KEYS.STATS)
      return data ? { ...defaultStats, ...JSON.parse(data) } : defaultStats
    } catch (e) {
      return defaultStats
    }
  }

  recordMatchResult(result, opponentName = "AI Bot", mode = "AI", moves = 0) {
    const stats = this.getStats()
    stats.totalGames++

    if (result === "win") {
      stats.wins++
      stats.currentStreak++
      stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak)
    } else if (result === "loss") {
      stats.losses++
      stats.currentStreak = 0
    } else {
      stats.draws++
    }

    try {
      localStorage.setItem(this.KEYS.STATS, JSON.stringify(stats))
    } catch (e) {}

    // Add match to history
    this.addMatchHistory({
      date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      result,
      opponent: opponentName,
      mode,
      moves
    })

    return stats
  }

  // History Management
  getHistory() {
    try {
      const data = localStorage.getItem(this.KEYS.HISTORY)
      return data ? JSON.parse(data) : []
    } catch (e) {
      return []
    }
  }

  addMatchHistory(match) {
    const history = this.getHistory()
    history.unshift(match)
    if (history.length > 25) history.pop() // Keep last 25

    try {
      localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history))
    } catch (e) {}
  }

  clearStatsAndHistory() {
    try {
      localStorage.removeItem(this.KEYS.STATS)
      localStorage.removeItem(this.KEYS.HISTORY)
    } catch (e) {}
  }
}

window.storageManager = new StorageManager()
