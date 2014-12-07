var five = require('johnny-five'), board
var owts = require('./OneWireTemps.js');

var pin = 3;
var board = new five.Board();

var onewiretemps = new owts.obj(board, pin);

onewiretemps.on("ready", function() {
	setInterval(onewiretemps.getTemperatures,100, owts.unit_farenheit, function(temps){
		console.log(temps);
	});
});


