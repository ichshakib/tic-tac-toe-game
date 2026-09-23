class TicTacToeAI {
  constructor(difficulty = "hard") {
    this.difficulty = difficulty
    this.aiSymbol = "O"
    this.humanSymbol = "X"
  }

  setDifficulty(level) {
    this.difficulty = level
  }

  /**
   * Determine the best move index (0-8) based on chosen difficulty
   */
  getMove(board) {
    const availableMoves = this.getAvailableMoves(board)
    if (availableMoves.length === 0) return null

    // 1. Easy Mode: Mostly random moves with occasional blocks
    if (this.difficulty === "easy") {
      if (Math.random() < 0.25) {
        const winningMove = this.findWinningMove(board, this.aiSymbol)
        if (winningMove !== null) return winningMove
      }
      return availableMoves[Math.floor(Math.random() * availableMoves.length)]
    }

    // 2. Medium Mode: Smart heuristic with partial minimax
    if (this.difficulty === "medium") {
      // Can AI win in 1 move? Take it!
      const winMove = this.findWinningMove(board, this.aiSymbol)
      if (winMove !== null) return winMove

      // Can Human win in 1 move? Block it!
      const blockMove = this.findWinningMove(board, this.humanSymbol)
      if (blockMove !== null) return blockMove

      // 50% chance to run optimal minimax, 50% pick strategic center/corners/random
      if (Math.random() < 0.5) {
        return this.getBestMoveMinimax(board)
      }

      if (board[4] === null) return 4 // Center
      return availableMoves[Math.floor(Math.random() * availableMoves.length)]
    }

    // 3. Hard / Unbeatable Mode: Pure Minimax
    return this.getBestMoveMinimax(board)
  }

  /**
   * Optimal move using Minimax
   */
  getBestMoveMinimax(board) {
    let bestScore = -Infinity
    let bestMove = null
    const available = this.getAvailableMoves(board)

    // Fast-path opening: If board is empty, take center or corner
    if (available.length === 9) {
      const corners = [0, 2, 6, 8, 4]
      return corners[Math.floor(Math.random() * corners.length)]
    }

    for (const move of available) {
      board[move] = this.aiSymbol
      const score = this.minimax(board, 0, false, -Infinity, Infinity)
      board[move] = null

      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
    }

    return bestMove !== null ? bestMove : available[0]
  }

  minimax(board, depth, isMaximizing, alpha, beta) {
    const winner = this.checkBoardWinner(board)
    if (winner === this.aiSymbol) return 10 - depth
    if (winner === this.humanSymbol) return depth - 10
    if (this.isBoardFull(board)) return 0
    if (depth >= 7) return 0 // Depth limit safety

    if (isMaximizing) {
      let maxScore = -Infinity
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = this.aiSymbol
          const score = this.minimax(board, depth + 1, false, alpha, beta)
          board[i] = null
          maxScore = Math.max(score, maxScore)
          alpha = Math.max(alpha, score)
          if (beta <= alpha) break // Alpha-beta pruning
        }
      }
      return maxScore
    } else {
      let minScore = Infinity
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = this.humanSymbol
          const score = this.minimax(board, depth + 1, true, alpha, beta)
          board[i] = null
          minScore = Math.min(score, minScore)
          beta = Math.min(beta, score)
          if (beta <= alpha) break // Alpha-beta pruning
        }
      }
      return minScore
    }
  }

  getAvailableMoves(board) {
    const moves = []
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) moves.push(i)
    }
    return moves
  }

  isBoardFull(board) {
    return board.every((cell) => cell !== null)
  }

  findWinningMove(board, symbol) {
    const lines = this.getWinningLines()
    for (const [a, b, c] of lines) {
      if (board[a] === symbol && board[b] === symbol && board[c] === null) return c
      if (board[a] === symbol && board[c] === symbol && board[b] === null) return b
      if (board[b] === symbol && board[c] === symbol && board[a] === null) return a
    }
    return null
  }

  checkBoardWinner(board) {
    const lines = this.getWinningLines()
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]
      }
    }
    return null
  }

  getWinningLines() {
    return [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ]
  }
}

window.TicTacToeAI = TicTacToeAI
