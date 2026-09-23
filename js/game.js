class GameEngine {
  constructor() {
    this.board = Array(9).fill(null)
    this.currentPlayer = "X"
    this.status = "playing" // "playing" | "ended"
    this.winner = null // "X" | "O" | "draw" | null
    this.winningLine = null // [a, b, c]
    this.round = 1
    this.moveCount = 0

    this.scores = {
      X: 0,
      O: 0,
      draws: 0
    }

    // Strike line grid coordinates relative to 300x300 viewBox: [x1, y1, x2, y2]
    this.lineCoordinates = {
      row0: [20, 50, 280, 50],
      row1: [20, 150, 280, 150],
      row2: [20, 250, 280, 250],
      col0: [50, 20, 50, 280],
      col1: [150, 20, 150, 280],
      col2: [250, 20, 250, 280],
      diag0: [30, 30, 270, 270], // 0-4-8
      diag1: [270, 30, 30, 270], // 2-4-6
    }
  }

  resetRound() {
    this.board = Array(9).fill(null)
    this.currentPlayer = "X"
    this.status = "playing"
    this.winner = null
    this.winningLine = null
    this.moveCount = 0
  }

  resetScores() {
    this.resetRound()
    this.round = 1
    this.scores = { X: 0, O: 0, draws: 0 }
  }

  nextRound() {
    this.round++
    this.resetRound()
  }

  setTurn(symbol) {
    this.currentPlayer = symbol === "O" ? "O" : "X"
  }

  setBoard(newBoard, currentPlayer = "X") {
    this.board = [...newBoard]
    this.currentPlayer = currentPlayer
    this.moveCount = this.board.filter((c) => c !== null).length
    const winResult = this.checkWinner()
    if (winResult) {
      this.status = "ended"
      this.winner = winResult.winner
      this.winningLine = winResult.line
    } else {
      this.status = "playing"
      this.winner = null
      this.winningLine = null
    }
  }

  /**
   * Attempt to make a move at a given cell index (0-8)
   * Returns true if move was valid and placed
   */
  makeMove(index, symbol = this.currentPlayer) {
    if (this.status !== "playing") return false
    if (index < 0 || index > 8 || this.board[index] !== null) return false

    this.board[index] = symbol
    this.moveCount++

    // Check winner
    const winResult = this.checkWinner()
    if (winResult) {
      this.status = "ended"
      this.winner = winResult.winner
      this.winningLine = winResult.line

      if (this.winner === "draw") {
        this.scores.draws++
      } else {
        this.scores[this.winner]++
      }
      return true
    }

    // Switch turn
    this.currentPlayer = this.currentPlayer === "X" ? "O" : "X"
    return true
  }

  checkWinner() {
    const lines = [
      { line: [0, 1, 2], name: "row0" },
      { line: [3, 4, 5], name: "row1" },
      { line: [6, 7, 8], name: "row2" },
      { line: [0, 3, 6], name: "col0" },
      { line: [1, 4, 7], name: "col1" },
      { line: [2, 5, 8], name: "col2" },
      { line: [0, 4, 8], name: "diag0" },
      { line: [2, 4, 6], name: "diag1" },
    ]

    for (const item of lines) {
      const [a, b, c] = item.line
      if (
        this.board[a] &&
        this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        return {
          winner: this.board[a],
          line: item.line,
          name: item.name,
          coords: this.lineCoordinates[item.name]
        }
      }
    }

    // Check Draw
    if (this.board.every((cell) => cell !== null)) {
      return {
        winner: "draw",
        line: null,
        name: null,
        coords: null
      }
    }

    return null
  }

  getWinningCoords(lineName) {
    return this.lineCoordinates[lineName] || null
  }
}

window.GameEngine = GameEngine
