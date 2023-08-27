/*----- constants -----*/
const players = {
    "1" : "X",
    "-1" : "O",
    "null" : null,
  };
  
  /*----- app's state (variables) -----*/
  let board;      //3x3 array
  let turn;       // oscillates between 1 and -1
  let winner;     // ??? 1 = Player 1; -1 = Player 2; 'T' = tie; null = no winner/tie ???
  
  
  /*----- cached element references -----*/""
  const squares = Array.from(document.querySelectorAll('#board > div'));
  const winnerLine = document.getElementById('winner');
  const playerTurn = document.getElementById('playerTurn');
  
  /*----- event listeners -----*/
  document.getElementById('board').addEventListener('click', handleClick);
  document.getElementById('reset').addEventListener('click', resetClick);
  
  
  /*----- functions -----*/
  init();
  
  function init() {
    board = [null, null, null, null, null, null, null, null, null];
    turn = 1;
    // winner = null;
    winnerLine.innerText = " ";
    render();
  };
  
  
  function render () {
  board.map((currElement, index) => {
  const div = document.getElementById(`g${index}`);
  div.innerHTML = players[currElement];
  // console.log("The current iteration is: " + index);
  // console.log("The current element is: " + currElement);
  // console.log(div);
  return currElement; //equivalent to list[index]
  });
  sayPlayer();
  };
  
  
  function handleClick(evt) {
    const colIdx = squares.indexOf(evt.target);
  
    if(board[colIdx] !== null){
      return
    } else{
    board[colIdx] = turn;
    }
    turn *= -1;
    render();
    winLog();
  }
  
  
  function resetClick(evt) {
     init();
  }
  
  
  
  function winLog() {
  if(Math.abs(board[0]+board[1]+board[2])===3) {
  winnerLine.innerText = "Winner!";
  } else if(Math.abs(board[3]+board[4]+board[5])===3) {
  winnerLine.innerText = "Winner!";
  } if(Math.abs(board[6]+board[7]+board[8])===3) {
  winnerLine.innerText = "Winner!";
  } if(Math.abs(board[0]+board[3]+board[6])===3) {
  winnerLine.innerText = "Winner!";
  } if(Math.abs(board[1]+board[4]+board[7])===3) {
  winnerLine.innerText = "Winner!";
  } if(Math.abs(board[2]+board[5]+board[8])===3) {
  winnerLine.innerText = "Winner!";
  } if(Math.abs(board[0]+board[4]+board[8])===3) {
  winnerLine.innerText = "Winner!";
  } if(Math.abs(board[2]+board[4]+board[6])===3) {
  winnerLine.innerText = "Winner!";
  } else {
  return;
  }
  };
  
  function sayPlayer(){
  playerTurn.innerText = `Player ${turn}'s turn.`
  };
  