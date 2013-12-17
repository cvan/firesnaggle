var system = require('system');


casper.start(system.env.FIRESNAGGLE_URL || 'http://www.mysnuggiestore.com', function() {
    casper.viewport(system.env.FIRESNAGGLE_WIDTH || 320,
                    system.env.FIRESNAGGLE_WIDTH || 480);
    this.wait(system.env.FIRESNAGGLE_DELAY || 5000);
});

casper.then(function() {
    this.capture(system.env.FIRESNAGGLE_FILENAME || 'output.png');
});

casper.run();
