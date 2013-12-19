var system = require('system');


casper.start(system.env.FIRESNAGGLE_URL || 'http://www.mysnuggiestore.com', function() {
    casper.viewport(parseInt(system.env.FIRESNAGGLE_WIDTH, 10) || 320,
                    parseInt(system.env.FIRESNAGGLE_HEIGHT, 10) || 480);
    this.wait(system.env.FIRESNAGGLE_DELAY || 5000);
});

casper.then(function() {
    this.capture(system.env.FIRESNAGGLE_FILENAME || 'output.png');
});

casper.run();
