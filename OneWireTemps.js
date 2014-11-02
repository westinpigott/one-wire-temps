
var Emitter = require("events").EventEmitter;
var util = require("util");

// Constants
var DEVICE_DS18B20 = 0x28;

// Internal functions
function readSingle(owt, deviceNum) {
	if(owt.isReady !== true) {
		console.log('Not yet initialized.  Waiting 5ms.');
		setTimeout(readSingle,5, owt, deviceNum);
		return;
	}
	console.log('Reading Single',deviceNum);


	if(!(deviceNum in owt.devices)) {
		setTimeout(readTemperatures,0, owt);
		return;
	}		
	owt.board.io.sendOneWireReset(owt.pin);

	// tell the sensor we want the result and read it from the scratchpad
	console.log('Device:',owt.devices[deviceNum]);
	owt.board.io.sendOneWireWriteAndRead(owt.pin, owt.devices[deviceNum], 0xBE, 9, function(error, data) {
		if(error) {
			console.log('ERROR');
		  console.log(error);
		  //return;
		}
		if(data === null) {
			console.log('Data is NULL for: ',deviceNum);
			//setTimeout(readSingle,500,owt,deviceNum);
			//return;
		} else {
			var raw = (data[1] << 8) | data[0];
			//var celsius = raw / 16.0;
			//var fahrenheit = celsius * 1.8 + 32.0;
			
			owt.temps[deviceNum] = raw;
			//console.log(i);
			//console.info(this.i, ' : ', fahrenheit);
		}
		setTimeout(readSingle,0,owt,deviceNum+1);
	}.bind(owt,deviceNum));
	
}

function readTemperatures(owt) {
	console.log('Cycle Reset');
	if(owt.isReady !== true) {
		console.log('Not yet initialized.  Waiting 5ms.');
		setTimeout(readTemperatures,5, owt);
		return;
	}
	for (var i = 0, len = owt.devices.length; i < len; i++) {
		owt.board.io.sendOneWireReset(owt.pin);
		console.log('Convert Command: ',owt.devices[i], owt.pin);
		owt.board.io.sendOneWireWrite(owt.pin, owt.devices[i], 0x44);
	}
	setTimeout(readSingle, 0, owt, 0);
}

function initialize(owt) {
	owt.board.io.sendOneWireConfig(owt.pin, true);
	owt.board.io.sendOneWireSearch(owt.pin, function(error, allDevices) {
		if(error) {
			console.error(error);
			return;
		}
		
		// Clear temps
		owt.temps = [];
		owt.devices = [];
		
		// Parse out only the temperature probes
		for (var i = 0, len = allDevices.length; i < len; i++) {
			if(allDevices[i][0] == 0x28) {
				owt.devices.push(allDevices[i]);
				owt.temps.push(0);
			}
		}
		owt.isReady = true;
		// emit ready event
		owt.emit("ready");
	}.bind(owt));
	
	owt.on("ready", function() {
		readTemperatures(owt);
	});
}


function OneWireTemps(board, pin) {
	// Check board is correct type
	
	// Setup properties
	this.board = board;
	this.pin = pin;
	this.temps = [];
	this.lastUpdate = [];
	this.devices = [];
	this.isReady = false;
	
	// Setup the callbacks once it is initialized
	board.on("ready", function () {
        initialize(this);
	}.bind(this));
	
	
}

// Inherit event api
util.inherits(OneWireTemps, Emitter);

OneWireTemps.prototype.initializeDevices = function() {
	initialize(this);
}

OneWireTemps.prototype.readSingleTemp = function(id, format) {
	
		//console.log(this.temps);
	
}

module.exports = OneWireTemps;

