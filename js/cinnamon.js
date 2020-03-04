cinnamonCommand = Module.cwrap('command', 'string', ['string','string'])

var init = function() {

/* Initialize */
var board,
  game = new Chess(),
  statusEl = $('#status'),
  fenEl = $('#fen'),
  pgnEl = $('#pgn');

/* Speech Recognition Part */
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
var finalTranscript = '';
var recognition = new window.SpeechRecognition();

/* Experimental feature */
/*
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var positions = [ 'e1' , 'e2'];
var grammar = '#JSGF V1.0; grammar positions; public <position> = ' + positions.join(' | ') + ' ;'
var speechRecognitionList = new SpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);
recognition.grammars = speechRecognitionList;
*/

recognition.interimResults = true;
recognition.maxAlternatives = 10;
recognition.continuous = true;
recognition.lang = "it-IT";

var spokenWords = [];

recognition.onresult = (event) => {
  let interimTranscript = '';
  for (let i = event.resultIndex, len = event.results.length; i < len; i++) {
    let transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      finalTranscript += transcript + '<br>';

      /* Make move */
      console.log(spokenWords[spokenWords.length-1]);
      makeMove(spokenWords[spokenWords.length-1]);

    } else {
      interimTranscript += transcript;
      spokenWords.push(interimTranscript);
    }
  }
  //document.querySelector('#log').innerHTML = finalTranscript.toLowerCase() + '<i style="color:#ddd;">' + interimTranscript.toLowerCase() + '</>';
}
recognition.start();

function makeMove(move) {
  /* PREPROCESSING: "b1a3" */
  move = move.replace(/\s/g, ''); // remove spaces
  move = move.toLowerCase();

  source = move.substring(0, 2);
  target = move.substring(2, 4);

  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for simplicity
  });

  // illegal move
  if (move === null) return 'snapback';
  updateStatus();
  board.position(game.fen());
}

var onDragStart = function(source, piece) {
  // do not pick up pieces if the game is over
  // or if it's not that side's turn
  if (game.game_over() === true ||
      (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
};
var removeGreySquares = function() {
  $('#board .square-55d63').css('background', '');
};

var greySquare = function(square) {
  var squareEl = $('#board .square-' + square);
  
  var background = '#a9a9a9';
  if (squareEl.hasClass('black-3c85d') === true) {
    background = '#696969';
  }

  squareEl.css('background', background);
};

var onDrop = function(source, target) {
  removeGreySquares();

  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) return 'snapback';
  updateStatus();
};

// update the board position after the piece snap 
// for castling, en passant, pawn promotion
var onSnapEnd = function() {
  board.position(game.fen());
};

function engineGo() {

	cinnamonCommand("setMaxTimeMillsec","1000")
	cinnamonCommand("position",game.fen())
	var move=cinnamonCommand("go","")
	//alert(move)
	var from=move.substring(0,2);
	var to=move.substring(2,4);
 	var move = game.move({
    		from: from,
   		to: to,
    		promotion: 'q' // NOTE: always promote to a queen for example simplicity
  	});

}
var onMouseoverSquare = function(square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true
  });

  // exit if there are no moves available for this square
  if (moves.length === 0) return;

  // highlight the square they moused over
  greySquare(square);

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to);
  }
};

var onMouseoutSquare = function(square, piece) {
  removeGreySquares();
};

var updateStatus = function() {

  if (game.turn() === 'b') {
    engineGo()
  }
  var status = '';

  var moveColor = 'White';
  if (game.turn() === 'b') {
    moveColor = 'Black';
  }

  // checkmate?
  if (game.in_checkmate() === true) {
    status = 'Game over, ' + moveColor + ' is in checkmate.';
  }

  // draw?
  else if (game.in_draw() === true) {
    status = 'Game over, drawn position';
  }

  // game still on
  else {
    status = moveColor + ' to move';

    // check?
    if (game.in_check() === true) {
      status += ', ' + moveColor + ' is in check';
    }
  }

  statusEl.html(status);
  fenEl.html(game.fen());
  pgnEl.html(game.pgn());
};

var cfg = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  moveSpeed: 'slow',
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd
};
board = new ChessBoard('board', cfg);

updateStatus();
$('#startPositionBtn').on('click', function() {
	board.destroy();
	$(document).ready(init);
});
$('#startListeningBtn').on('click', function() {
	recognition.start();
});
};

$(document).ready(init);
