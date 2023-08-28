var scores,roundScore,activePlayer,dice;

scores = [0,0];
roundScore = 0;
activePlayer = 0;

dice = Math.floor(Math.random()*6)+1;
console.log("this is a dice number" + " "+ dice);

document.querySelector('.dice').style.display = 'none';

document.querySelector('#current-'+ activePlayer).textContent=dice;

var x = document.querySelector('#current-1').textContent;
console.log("this is a store variable"+ " "+ x);