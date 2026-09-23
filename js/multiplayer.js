class MultiplayerEngine {
  constructor() {
    this.peer = null
    this.conn = null
    this.bc = null
    this.isHost = false
    this.mySymbol = "X"
    this.opponent = {
      name: "Remote Opponent",
      avatar: "wifi"
    }
    this.roomCode = null
    this.isConnected = false
    this.clientId = "client_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36)
    this.seenMessages = new Set()
    this.localPlayerInfo = {}

    // Event callbacks
    this.onStatusChange = null
    this.onOpponentJoined = null
    this.onMoveReceived = null
    this.onRematchReceived = null
    this.onReactionReceived = null
    this.onResetReceived = null
    this.onError = null
  }

  generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = ""
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  getPrefix() {
    return "tictactoe-royale-"
  }

  /**
   * Host a new multiplayer room
   */
  hostRoom(roomCode = this.generateRoomCode(), localPlayerInfo = {}) {
    this.disconnect()
    this.isHost = true
    this.mySymbol = "X"
    this.roomCode = roomCode.toUpperCase()
    this.isConnected = false
    this.localPlayerInfo = localPlayerInfo

    // Immediately trigger waiting status so code is displayed right away in UI
    if (this.onStatusChange) {
      this.onStatusChange("waiting", this.roomCode)
    }

    const fullPeerId = `${this.getPrefix()}${this.roomCode}`

    // 1. Setup BroadcastChannel (instant local cross-tab support)
    if (typeof BroadcastChannel !== "undefined") {
      try {
        this.bc = new BroadcastChannel(`ttt_channel_${this.roomCode}`)
        this.bc.onmessage = (ev) => {
          this.handleIncomingData(ev.data)
        }
      } catch (e) {
        console.warn(e)
      }
    }

    // 2. Setup PeerJS (cross-device WebRTC support)
    if (typeof Peer !== "undefined") {
      try {
        this.peer = new Peer(fullPeerId, {
          debug: 0,
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:global.stun.twilio.com:3478" }
            ]
          }
        })

        this.peer.on("open", () => {
          if (!this.isConnected && this.onStatusChange) {
            this.onStatusChange("waiting", this.roomCode)
          }
        })

        this.peer.on("connection", (conn) => {
          this.conn = conn
          this.setupConnectionHandlers()
        })

        this.peer.on("error", (err) => {
          if (err.type === "unavailable-id") {
            // Collision retry
            this.hostRoom(this.generateRoomCode(), this.localPlayerInfo)
          }
        })
      } catch (e) {
        console.warn(e)
      }
    }
  }

  /**
   * Join an existing room code
   */
  joinRoom(roomCode, localPlayerInfo = {}) {
    this.disconnect()
    this.isHost = false
    this.mySymbol = "O"
    this.roomCode = roomCode.trim().toUpperCase()
    this.isConnected = false
    this.localPlayerInfo = localPlayerInfo

    if (this.onStatusChange) {
      this.onStatusChange("connecting", this.roomCode)
    }

    const targetPeerId = `${this.getPrefix()}${this.roomCode}`

    // 1. Setup BroadcastChannel join ping
    if (typeof BroadcastChannel !== "undefined") {
      try {
        this.bc = new BroadcastChannel(`ttt_channel_${this.roomCode}`)
        this.bc.onmessage = (ev) => {
          this.handleIncomingData(ev.data)
        }

        setTimeout(() => {
          if (this.bc) {
            this.sendData({
              type: "join_request",
              name: this.localPlayerInfo.name || "Player 2",
              avatar: this.localPlayerInfo.avatar || "user-check"
            })
          }
        }, 120)
      } catch (e) {
        console.warn(e)
      }
    }

    // 2. Setup PeerJS WebRTC connection
    if (typeof Peer !== "undefined") {
      try {
        this.peer = new Peer(undefined, {
          debug: 0,
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:global.stun.twilio.com:3478" }
            ]
          }
        })

        this.peer.on("open", () => {
          const conn = this.peer.connect(targetPeerId, {
            reliable: true
          })
          this.conn = conn
          this.setupConnectionHandlers()
        })

        this.peer.on("error", () => {
          if (!this.isConnected && this.onError) {
            this.onError("Room not found or host disconnected.")
          }
        })
      } catch (e) {
        console.warn(e)
      }
    }
  }

  setupConnectionHandlers() {
    if (!this.conn) return

    this.conn.on("open", () => {
      const wasConnected = this.isConnected
      this.isConnected = true

      if (!wasConnected && this.onStatusChange) {
        this.onStatusChange("connected", this.roomCode)
      }

      // Handshake: send our local player profile
      this.sendData({
        type: "handshake",
        name: (this.localPlayerInfo && this.localPlayerInfo.name) || (this.isHost ? "Player 1" : "Player 2"),
        avatar: (this.localPlayerInfo && this.localPlayerInfo.avatar) || (this.isHost ? "user" : "user-check")
      })
    })

    this.conn.on("data", (data) => {
      this.handleIncomingData(data)
    })

    this.conn.on("close", () => {
      this.isConnected = false
      if (this.onStatusChange) {
        this.onStatusChange("disconnected")
      }
    })

    this.conn.on("error", (err) => {
      console.warn(err)
    })
  }

  handleIncomingData(data) {
    if (!data || !data.type) return

    // Ignore messages originating from this same client instance
    if (data.senderId === this.clientId) return

    // Deduplicate identical message received over both PeerJS and BroadcastChannel
    if (data.id) {
      if (this.seenMessages.has(data.id)) return
      this.seenMessages.add(data.id)
      if (this.seenMessages.size > 200) {
        const first = this.seenMessages.values().next().value
        this.seenMessages.delete(first)
      }
    }

    switch (data.type) {
      case "join_request":
        if (this.isHost) {
          const wasConnected = this.isConnected
          this.isConnected = true
          this.opponent = {
            name: data.name || "Player 2",
            avatar: data.avatar || "user-check"
          }

          if (!wasConnected && this.onStatusChange) {
            this.onStatusChange("connected", this.roomCode)
          }
          if (this.onOpponentJoined) {
            this.onOpponentJoined(this.opponent)
          }

          // Reply with host handshake
          this.sendData({
            type: "handshake",
            name: (this.localPlayerInfo && this.localPlayerInfo.name) || "Player 1",
            avatar: (this.localPlayerInfo && this.localPlayerInfo.avatar) || "user"
          })
        }
        break

      case "handshake": {
        const wasConnected = this.isConnected
        this.isConnected = true
        this.opponent = {
          name: data.name || (this.isHost ? "Player 2" : "Player 1"),
          avatar: data.avatar || (this.isHost ? "user-check" : "user")
        }

        if (!wasConnected && this.onStatusChange) {
          this.onStatusChange("connected", this.roomCode)
        }
        if (this.onOpponentJoined) {
          this.onOpponentJoined(this.opponent)
        }
        break
      }

      case "move":
        if (this.onMoveReceived && typeof data.index === "number" && data.symbol) {
          this.onMoveReceived(data.index, data.symbol)
        }
        break

      case "rematch":
        if (this.onRematchReceived) {
          this.onRematchReceived()
        }
        break

      case "reaction":
        if (this.onReactionReceived && data.emoji) {
          this.onReactionReceived(data.emoji)
        }
        break

      case "reset":
        if (this.onResetReceived) {
          this.onResetReceived()
        }
        break
    }
  }

  sendData(payload) {
    if (!payload.id) {
      payload.id = "msg_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36)
    }
    payload.senderId = this.clientId

    // Remember our own sent message ID so we don't process it if echoed
    this.seenMessages.add(payload.id)

    // Send via PeerJS WebRTC DataChannel
    if (this.conn && this.conn.open) {
      try { this.conn.send(payload) } catch (e) {}
    }
    // Also send via BroadcastChannel
    if (this.bc) {
      try { this.bc.postMessage(payload) } catch (e) {}
    }
  }

  sendMove(index, symbol) {
    this.sendData({ type: "move", index, symbol })
  }

  sendRematch() {
    this.sendData({ type: "rematch" })
  }

  sendReaction(emoji) {
    this.sendData({ type: "reaction", emoji })
  }

  sendReset() {
    this.sendData({ type: "reset" })
  }

  disconnect() {
    this.isConnected = false
    this.seenMessages.clear()
    if (this.conn) {
      try { this.conn.close() } catch (e) {}
      this.conn = null
    }
    if (this.peer) {
      try { this.peer.destroy() } catch (e) {}
      this.peer = null
    }
    if (this.bc) {
      try { this.bc.close() } catch (e) {}
      this.bc = null
    }
  }
}

window.MultiplayerEngine = MultiplayerEngine
