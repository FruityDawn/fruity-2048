const config = require("./config.json");

const MAXTILE = 11; //2^11 = 2048
const ROWS = 4;
const COLS = 4;
const CHANCEFOR4 = 10; //percent

class Game {
  constructor(user) {
    this.win = false;
    this.lose = false;
    this.user = user;
    this.userID = user.id;
    this.msg = null; // last msg
    this.board = emptyBoard();
    this.score = 0;
    this.possibleNext = []; // valid next moves
    this.startTiles();
    this.tryMoves();
  }

  // try to move (to check which ones are possible)
  tryMoves() {
    this.nextLeft  = moveLeft(this.board);
    this.nextRight = moveRight(this.board);
    this.nextUp    = moveUp(this.board);
    this.nextDown  = moveDown(this.board);
  }

  // check if next moves are valid
  checkNext() {

    this.possibleNext = [];

  	var t = this.randomFreeTile();

      if (t == null) {
      // no free tiles, therefore lose, not sure if this case will ever happen
      console.log("no free tiles case happened");
      this.lose = true;
      return;
      }

    this.setTileRandom(t[0], t[1]);

    this.tryMoves();
    var validNext = false; // need to have a valid next move
    var nextMoves = [this.nextLeft,
                     this.nextRight,
                     this.nextUp,
                     this.nextDown];

    for (let i = 0; i < nextMoves.length; i++) {
    	if (!compareBoards(this.board, nextMoves[i][1])) {
        validNext = true;
        this.possibleNext.push(i);
      }
    }

    if (!validNext) {
      this.lose = true;
    } 

  }

  /* movement */
  left() {
    var newBoard = this.nextLeft;
    this.score += newBoard[0];
    this.board = newBoard[1];
    this.checkNext();
  }

  right() {
    var newBoard = this.nextRight;
    this.score += newBoard[0];
    this.board = newBoard[1];
    this.checkNext();
  }

  up() {
    var newBoard = this.nextUp;
    this.score += newBoard[0];
    this.board = newBoard[1];
    this.checkNext();
  }

  down() {
    var newBoard = this.nextDown;
    this.score += newBoard[0];
    this.board = newBoard[1];
    this.checkNext();
  }

  // game starts with 2 random tiles
  startTiles() {
    var t = this.randomFreeTile();

    if (t == null) {
      console.log("Error: No free tiles.")
      return
    }

    this.setTileRandom(t[0], t[1]);
    t = this.randomFreeTile();

    this.checkNext();
  }

  /* setter and getter methods (I don't think I actually used them) */

  setMsg(id) {
  	this.msg = id;
  }

  getMsg(id) {
  	return this.msg;
  }

  /* draw operations */

  drawBoard() {
  	var rtn = "`" + this.user.username + "'s game`\n";
    rtn += "`Score: " + this.score + "`\n";
    for (let r = 0; r < ROWS; r++) {
      rtn += this.drawRow(r);
    }
    return rtn;
  }

  drawRow(row) {
    var rtn = "";
    for (let c = 0; c < COLS; c++) {
      rtn += renderTile(this.board[row][c]);
      if (this.board[row][c] == MAXTILE) {
        this.win = true;
      }
    }
    return rtn + '\n';
  }

  /* tile operations */

  setTile(row, col, n) {
    this.board[row][col] = n;
  }

  setTileRandom(row, col) {
    var r = Math.round (100 * Math.random());
    this.setTile(row, col, r >= CHANCEFOR4 ? 1 : 2);
  }

  randomFreeTile() {
    var freeTiles = getFreeTiles(this.board);
    return freeTiles[Math.floor (freeTiles.length * Math.random())];
  }

  freeTileCount() {
    var tmp = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.board[r][c] == 0) {
          tmp++;
        }
      }
    }

    return tmp;
  }

} // end class

/* determine board state after a movement in a certain direction */
function moveLeft(board){
  var tmp = squishLeft(board.slice()); //pre-squish (and array copy)
  var dScore = 0;

  // try join
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      if (tmp[r][c] == 0) {
        continue;
      }
      if (tmp[r][c] == tmp[r][c+1]) {
        dScore += Math.pow(2,++tmp[r][c]);
        tmp[r][c + 1] = 0;
      }
    // squish again
    tmp = squishLeft(tmp);
    }
  }
  return [dScore, tmp];
}

function moveRight(board){
  var tmp = squishRight(board.slice()); // pre-squish (and array copy)
  var dScore = 0;

  // try join
  for (let r = 0; r < ROWS; r++) {
    for (let c = COLS - 1; c > 0; c--) {
      if (tmp[r][c] == 0) {
        continue;
      }
      if (tmp[r][c] == tmp[r][c-1]) {
        dScore += Math.pow(2,++tmp[r][c]);
        tmp[r][c - 1] = 0;
      }
    // squish again
    tmp = squishRight(tmp);
    }
  }

  return [dScore, tmp];
}

function moveUp(board){
  var tmp = squishUp(board.slice()); // pre-squish (and array copy)
  var dScore = 0;

  // try join
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 1; r++) {
      if (tmp[r][c] == 0) {
        continue;
      }
      if (tmp[r][c] == tmp[r + 1][c]) {
        dScore += Math.pow(2,++tmp[r][c]);
        tmp[r + 1][c] = 0;
      }
    }
  }
  tmp = squishUp(tmp); //post-squish 

  return [dScore, tmp];
}

function moveDown(board){
  var tmp = squishDown(board.slice()); // pre-squish (and array copy)
  var dScore = 0;

  // try join
  for (let c = 0; c < COLS; c++) {
    for (let r = ROWS - 1; r > 0; r--) {
      if (tmp[r][c] == 0) {
        continue;
      }
      if (tmp[r][c] == tmp[r - 1][c]) {
        dScore += Math.pow(2,++tmp[r][c]);
        tmp[r - 1][c] = 0;
      }
    }
  }
  tmp = squishDown(tmp); // post-squish

  return [dScore, tmp];
}

/* move all tiles on board as far in given direction as possible, ignoring blank tiles */
function squishLeft(b) {
  var tmp = emptyBoard();
  for (let r = 0; r < ROWS; r++) {
    let marker = 0;
  	for (let c = 0; c < COLS; c++) {
	  if (b[r][c] != 0) {
	    tmp[r][marker++] = b[r][c];
      }
  	}
  }
  
  return tmp;
}

function squishRight(b) {
  var tmp = emptyBoard();
  for (let r = 0; r < ROWS; r++) {
  	let marker = COLS - 1;
    for (let c = COLS - 1; c >= 0; c--) {
	  if (b[r][c] != 0) {
	    tmp[r][marker--] = b[r][c];
	  }
    }
  }
  
  return tmp;
}

function squishUp(b) {
  var tmp = emptyBoard();
  for (let c = 0; c < COLS; c++) {
    let marker = 0;
    for (let r = 0; r < ROWS; r++) {
      if (b[r][c] != 0) {
        tmp[marker++][c] = b[r][c];
      }
    }
  }

  return tmp;
}

function squishDown(b) {
  var tmp = emptyBoard();
  for (let c = 0; c < COLS; c++) {
    let marker = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (b[r][c] != 0) {
        tmp[marker--][c] = b[r][c];
      }
    }
  }

  return tmp;
}

function getFreeTiles(board) {
    var tmp = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] == 0) {
        	tmp.push([r,c]);
        }
      }
    }

    return tmp;
  }

function compareBoards(b1, b2) {
	for (let r = 0; r < ROWS; r++) {
		for (let c = 0; c < COLS; c++) {
			if (b1[r][c] != b2[r][c]) {
				return false;
			}
		}
	}

	return true;
}
function renderTile(n) {
  if (!config.tiles[n]) {
    console.log("Error: tile " + Math.pow(2,n) + " not specified in config.")
    return "";
  }

  return config.tiles[n];
}

function emptyBoard() {
  var tmp = new Array(ROWS);
  //init rows
  for (let r = 0; r < ROWS; r++) {
    tmp[r] = new Array(COLS);
  }
  //init cols
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      tmp[r][c] = 0;
    }
  }

  return tmp;
}

module.exports = Game;