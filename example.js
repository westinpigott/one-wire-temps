var five = require('johnny-five'), board
var OneWireTemps = require('./OneWireTemps.js');

var pin = 3;
var board = new five.Board();

var owts = new OneWireTemps(board, pin);

owts.on("ready", function() {
	setInterval(owts.readSingleTemp,100, 0, 'eh');
});


