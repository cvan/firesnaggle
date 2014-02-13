var fs = require('fs');
var system = require('system');

var delay = system.env.FIRESNAGGLE_DELAY || 5000;
var height = parseInt(system.env.FIRESNAGGLE_HEIGHT, 10) || 480;
var width = parseInt(system.env.FIRESNAGGLE_WIDTH, 10) || 320;

casper.start(system.env.FIRESNAGGLE_URL || 'http://www.mysnuggiestore.com', function() {
    casper.viewport(width, height);
    this.wait(delay);
});

casper.then(function() {
    this.capture(system.env.FIRESNAGGLE_FILENAME_IMAGE || 'output.png', {
        height: height,
        left: 0,
        top: 0,
        width: width
    });

    var html = this.getPageContent();

    var location = this.evaluate(function () {
        return window.location.href;
    });

    var title = this.evaluate(function () {
        return document.title;
    });

    var data = {
        html: html,
        location: location,
        title: title
    };

    fs.write(system.env.FIRESNAGGLE_FILENAME_DOC || 'output.html', html);

    fs.write(system.env.FIRESNAGGLE_FILENAME_JSON || 'output.json',
             JSON.stringify(data));
});

casper.run();
