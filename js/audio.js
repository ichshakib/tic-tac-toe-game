class SoundEngine {
  constructor() {
    this.ctx = null
    this.enabled = true
    this.volume = 0.8
    this.initAudioContext()
  }

  initAudioContext() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      this.ctx = new AudioCtx()
    }
  }

  ensureContext() {
    this.initAudioContext()
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume()
    }
  }

  setSoundEnabled(val) {
    this.enabled = !!val
  }

  setVolume(percent) {
    this.volume = Math.max(0, Math.min(1, percent / 100))
  }

  /**
   * Sound when X or O is placed on the board
   */
  playMoveSound(symbol) {
    if (!this.enabled) return
    this.ensureContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = "sine"
    if (symbol === "X") {
      // Energetic high ping for X
      osc.frequency.setValueAtTime(587.33, now) // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.08) // A5
    } else {
      // Deep mellow tone for O
      osc.frequency.setValueAtTime(440.0, now) // A4
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.1) // E4
    }

    gain.gain.setValueAtTime(this.volume * 0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.12)
  }

  /**
   * Victory fanfare arpeggio (C5 -> E5 -> G5 -> C6)
   */
  playWinSound() {
    if (!this.enabled) return
    this.ensureContext()
    if (!this.ctx) return

    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    const startTime = this.ctx.currentTime

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const noteTime = startTime + i * 0.1

      osc.type = "triangle"
      osc.frequency.setValueAtTime(freq, noteTime)

      gain.gain.setValueAtTime(this.volume * 0.35, noteTime)
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(noteTime)
      osc.stop(noteTime + 0.35)
    })
  }

  /**
   * Defeat / Loss sound
   */
  playLossSound() {
    if (!this.enabled) return
    this.ensureContext()
    if (!this.ctx) return

    const notes = [440, 392, 349.23, 293.66] // A4, G4, F4, D4
    const startTime = this.ctx.currentTime

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const noteTime = startTime + i * 0.12

      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(freq, noteTime)

      gain.gain.setValueAtTime(this.volume * 0.25, noteTime)
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(noteTime)
      osc.stop(noteTime + 0.3)
    })
  }

  /**
   * Draw / Tie sound
   */
  playDrawSound() {
    if (!this.enabled) return
    this.ensureContext()
    if (!this.ctx) return

    const startTime = this.ctx.currentTime
    const osc1 = this.ctx.createOscillator()
    const osc2 = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc1.type = "sine"
    osc2.type = "sine"
    osc1.frequency.setValueAtTime(392.0, startTime) // G4
    osc2.frequency.setValueAtTime(415.3, startTime) // G#4 dissonant flat

    gain.gain.setValueAtTime(this.volume * 0.3, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(this.ctx.destination)

    osc1.start(startTime)
    osc2.start(startTime)
    osc1.stop(startTime + 0.4)
    osc2.stop(startTime + 0.4)
  }

  /**
   * Subtle button click tap
   */
  playClickSound() {
    if (!this.enabled) return
    this.ensureContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03)

    gain.gain.setValueAtTime(this.volume * 0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.03)
  }

  /**
   * Emoji reaction sound
   */
  playReactionSound() {
    if (!this.enabled) return
    this.ensureContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(300, now)
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.1)

    gain.gain.setValueAtTime(this.volume * 0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.15)
  }
}

window.soundEngine = new SoundEngine()
