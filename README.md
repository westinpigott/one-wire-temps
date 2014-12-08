# one-wire-temps

Module for reading temperatures from a one-wire bus over firmata.

## Overview
The OneWireTemps module is a non-blocking module which can read the temperature probes from the one-wire protocol.  It is capable of handling many probes on the same bus.

The module works by cycling through each device on the bus and reading the temperature and storing it.  The process then repeats perpetually.  

### Retreiving Measurements

At any time, the most recent temperture and updated time for each probe can be retreived by calling getSingleTemp(unitType, deviceNumber, callback) or all temps and last updated times can be retreived by calling getTemperatures(unitType, callback).   The callback takes two arguments.  The temperatue(s) and the lastUpdate(s).

### UnitTypes
* owts.unit_raw = UNIT_TYPE_RAW; - The raw reading returned from the probe.
* owts.unit_celcius = UNIT_TYPE_CELCIUS; - The temperature converted into Celcius.
* owts.unit_farenheit = UNIT_TYPE_FARENHEIT; - The temperature converted into Farenheit.

### Configuration
An optional configuration object can be passed into the constructor with one or more properties.
* cycleDelay - Time to delay the entire cycle each time it resets in milliseconds.
* nextDeviceDelay - Time to delay the reading of each probe before moving to the next one in milliseconds.
Example
```JavaScript
// Lets have the temperatures refresh every 5 seconds.
var config = { cycleDelay:0, nextDeviceDelay:5000 };
var onewiretemps = new owts.obj(board, pin, config);
```

### Events
* Initialized - Called once all devices have been identified but before the temperature reading has started.
* Ready - Called once all temperature probes have been read one time ( a single full cycle).
* CycleComplete - Called everytime the temperature cycle completes.

## Examples
* Initialization
```JavaScript
// Import dependencies
var five = require('johnny-five'), board
var owts = require('one-wire-temps');

// Establish ssome of the confiugration
var pin = 3;
var board = new five.Board();

// Create the OneWireTemps object
var onewiretemps = new owts.obj(board, pin, {cycleDelay:100});
```
* A basic case to output all the temperatures every 100ms, regardless of how fast they are updated.
```JavaScript
onewiretemps.on("Ready", function() {
	setInterval(onewiretemps.getTemperatures,100, owts.unit_farenheit, function(temps, lastUpdates){
		console.log(temps);
	});
});
```
* Getting a single temperature from probe #2 once all the temperatures have been initialized the first time.
```JavaScript
onewiretemps.on("Ready", function() {
	onewiretemps.getSingleTemp(owts.unit_farenheit, 2, function(temp, lastUpdate) {
		console.log(temp + ' @ ' + lastUpdate);
	});
});
```
* Output all temperatures each time the temperature loop cycles.
```JavaScript
onewiretemps.on("CycleComplete", function() {
	onewiretemps.getTemperatures(owts.unit_farenheit, function(temps, lastUpdate) {
		console.log(temps);
	});
});
```
