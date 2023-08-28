var scores, roundScore, activePlayer;

scores = [0, 0];
roundScore = 0;
activePlayer = 0;



document.getElementById('score-0').textContent = '0';
document.getElementById('score-1').textContent = '0';
document.getElementById('current-0').textContent = '0';
document.getElementById('current-1').textContent = '0';

document.querySelector('.btn-roll').addEventListener('click', function () {
    // do something here 
    
    // 1. Random number
   var dice = Math.floor(Math.random() * 6) + 1;
   console.log(dice); 
    
    var img1 = document.getElementById('dice-1.png');
    var img2 = document.getElementById('dice-2.png');
    var img3 = document.getElementById('dice-3.png');
    var img4 = document.getElementById('dice-4.png');
    var img5 = document.getElementById('dice-5.png');
    var img6 = document.getElementById('dice-6.png');

    var imgArr = [img1,img2,img3,img4,img5,img6];
    console.log(imgArr);
    imgArr[0].style.display = "none";
    imgArr[1].style.display = "none";
    imgArr[2].style.display = "none";
    imgArr[3].style.display = "none";
    imgArr[4].style.display = "none";
    imgArr[5].style.display = "none";

    // 2. display results 
    if(dice ==1 ){
       imgArr[0].style.display = "block";
       
    }

    else if(dice == 2){
      
      imgArr[1].style.display = "block";
      
    }

    else if(dice == 3){
      
      imgArr[2].style.display = "block";
      
    }

    else if(dice == 4){
      
      imgArr[3].style.display = "block";
      
    }

    else if(dice == 5){
 
      imgArr[4].style.display = "block";
      
    }

    else {
      
      imgArr[5].style.display = "block";


    }

    if(dice !== 1){
        roundScore += dice;
        document.querySelector("#current-" + activePlayer).textContent = roundScore;  


    }
    else {
        // next player 
        nextPlayer();
       
    }

   }

  
  );
  
  document.querySelector('.btn-hold').addEventListener('click', function () {
    // ADD current score to global score 
    scores[activePlayer] += roundScore;
    

    // update the UI
    document.querySelector('#score-' + activePlayer).textContent = scores[activePlayer];
    

    //check if player won the game 
    if (scores[activePlayer] >= 50) {
        document.querySelector('#name-' + activePlayer).textContent = " Winner!";
        document.querySelector('.dice').style.display = "none";
        document.querySelector('.player-' + activePlayer + '-panel').classList.add('winner');
        document.querySelector('.player-' + activePlayer + '-panel').classList.remove('active');
    } else {
        nextPlayer();
    }