
var Emitter = require("events").EventEmitter;
var util = require("util");

// Constants
var DEVICE_DS18B20 = 0x28;
var UNIT_TYPE_RAW = 'RAW';
var UNIT_TYPE_CELCIUS = 'CELCIUS';
var UNIT_TYPE_FARENHEIT = 'FARENHEIT';

var OneWireTemps = function(board, pin, config){

	// Setup properties
	var _board = board;
	var _pin = pin;
	var _temps = [];
	var _lastUpdate = [];
	var _devices = [];
	var _isReady = false;
	var _isInitialized = false;
	var _cycleDelay = 0;
	var _nextDeviceDelay = 0;
	var _config = config;
	
	
	
	// Setup the callbacks once it is initialized
	_board.on("ready", function initialize() {
		handeConfig(_config);
		_board.io.sendOneWireConfig(_pin, true);
		_board.io.sendOneWireSearch(_pin, function(error, allDevices) {
			if(error) {
				console.error(error);
				return;
			}
			
			// Clear temps
			_temps = [];
			_devices = [];
			
			// Parse out only the temperature probes
			for (var i = 0, len = allDevices.length; i < len; i++) {
				if(allDevices[i][0] == 0x28) {
					_devices.push(allDevices[i]);
					_temps.push(0);
				}
			}
			_isInitialized = true;
			// emit initialized event
			this.emit("Initialized");
		}.bind(this));
		
		this.on("Initialized", function() {
			readTemperatures();
		});
	}.bind(this));
	
	var handeConfig = function(config) {
		if(typeof config === "object") {
			if(typeof config.cycleDelay === "number") { _cycleDelay = config.cycleDelay; }
			if(typeof config.nextDeviceDelay === "number") { _nextDeviceDelay = config.nextDeviceDelay; }
		}
	}

	var readTemperatures = function readTemperatures() {
		if(_isInitialized !== true) {
			console.log('Not yet initialized.  Waiting 5ms.');
			setTimeout(readTemperatures,5);
			return;
		}
		for (var i = 0, len = _devices.length; i < len; i++) {
			_board.io.sendOneWireReset(_pin);
			_board.io.sendOneWireWrite(_pin, _devices[i], 0x44);
		}
		setTimeout(readSingle, _nextDeviceDelay, 0);
	}
	
	var readSingle = function(deviceNum) {
		if(_isInitialized !== true) {
			console.log('Not yet initialized.  Waiting 5ms.');
			setTimeout(readSingle,5, deviceNum);
			return;
		}
		
		if(!(deviceNum in _devices)) {
			if(!_isReady) {
				_isReady = true;
				this.emit("ready");
			}
			this.emit("CycleComplete");
			setTimeout(readTemperatures, _cycleDelay);
			return;
		}		
		_board.io.sendOneWireReset(_pin);

		// tell the sensor we want the result and read it from the scratchpad
		_board.io.sendOneWireWriteAndRead(_pin, _devices[deviceNum], 0xBE, 9, function(error, data) {
			if(error) {
				console.log('ERROR');
				console.log(error);
			}
			if(data === null) {
				console.log('Data is NULL for: ', deviceNum);
			} else {
				_temps[deviceNum] = (data[1] << 8) | data[0];
				_lastUpdate[deviceNum] = new Date();
			}
			setTimeout(readSingle, _nextDeviceDelay, deviceNum+1);
		}.bind(deviceNum));		
	}.bind(this);
	
	this.getTemperatures = function(unitType, callback) {
		var temps = [];		
		_temps.forEach(function(entry, index) {
			temps[index] = retreiveSingleTemp(unitType, index);
		});
		callback(temps, _lastUpdate);
	}
	
	this.getSingleTemp = function(unitType, deviceNum, callback) {
		callback(retreiveSingleTemp(unitType, deviceNum), _lastUpdate[deviceNum]);
	}
	
	var retreiveSingleTemp = function(unitType, deviceNum) {
		switch(unitType) {
			case UNIT_TYPE_RAW:
				return _temps[deviceNum];
			case UNIT_TYPE_CELCIUS:
				return convertToCelcius(_temps[deviceNum]);
			case UNIT_TYPE_FARENHEIT:
				return convertToFarenheit(_temps[deviceNum]);
			default:
				console.log('Invalid type: '+unitType.toString());
		}
	}
	
	var convertToCelcius = function(raw) {
		return raw / 16.0;
	}
	
	var convertToFarenheit = function(raw) {
		return convertToCelcius(raw) * 1.8 + 32;
	}
		
}

// Inherit event api
util.inherits(OneWireTemps, Emitter);

module.exports.obj = OneWireTemps;
module.exports.unit_raw = UNIT_TYPE_RAW;
module.exports.unit_celcius = UNIT_TYPE_CELCIUS;
module.exports.unit_farenheit = UNIT_TYPE_FARENHEIT;
