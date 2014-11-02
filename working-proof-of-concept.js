var five = require('johnny-five'), board

// 1-wire devices are on pin 20 on Mega
var pin = 3;
var board = new five.Board();

board.on("ready", function ()
            {
  board.io.sendOneWireConfig(pin, true);
  board.io.sendOneWireSearch(pin, function(error, devices) {
    if(error) {
      console.error(error);
      return;
    }
	console.log(devices);

    // only interested in the first device
    //var device = devices[0];
	

    var readTemperature = function(device) {
      // start transmission
      board.io.sendOneWireReset(pin);

      // a 1-wire select is done by ConfigurableFirmata
      board.io.sendOneWireWrite(pin, device, 0x44);

      // the delay gives the sensor time to do the calculation
      board.io.sendOneWireDelay(pin, 1000);

      // start transmission
      board.io.sendOneWireReset(pin);

      // tell the sensor we want the result and read it from the scratchpad
      board.io.sendOneWireWriteAndRead(pin, device, 0xBE, 9, function(error, data) {
        if(error) {
          console.error(error);
          return;
        }
        var raw = (data[1] << 8) | data[0];
        var celsius = raw / 16.0;
        var fahrenheit = celsius * 1.8 + 32.0;

        console.info("fahrenheit", fahrenheit);
      });
    };
    // read the temperature now
    readTemperature(devices[0]);
    readTemperature(devices[1]);
	// and every five seconds
    setInterval(readTemperature, 500, devices[0]);
	setInterval(readTemperature, 500, devices[1]);
  });
});