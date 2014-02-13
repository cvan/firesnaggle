console.log('Running screenshot.js...');

var fs = require('fs');
var system = require('system');


var delay = system.env.FIRESNAGGLE_DELAY || 5000;
var height = parseInt(system.env.FIRESNAGGLE_HEIGHT, 10) || 480;
var width = parseInt(system.env.FIRESNAGGLE_WIDTH, 10) || 320;

var status = null;
var statusText = null;

casper.start(system.env.FIRESNAGGLE_URL || 'http://www.mysnuggiestore.com',
             function(res) {
    consle.log('casper.start');
    casper.viewport(width, height);
    this.wait(delay);
    status = res.status;
    statusText = res.statusText;
});

casper.then(function() {
    consle.log('casper.then');
    // this.capture(system.env.FIRESNAGGLE_FILENAME_IMAGE || 'output.png', {
    //     height: height,
    //     left: 0,
    //     top: 0,
    //     width: width
    // });

    var html = this.getPageContent();

    var data = this.evaluate(function () {
        return {
            location: window.location.href,
            title: document.title
        };
    });

    data.html = html;
    data.status = status;
    data.statusText = statusText;

    console.log(html);
    console.log(data);
    console.log(system.env.FIRESNAGGLE_FILENAME_DOC || 'output.html');
    console.log(system.env.FIRESNAGGLE_FILENAME_JSON || 'output.json');

    fs.write(system.env.FIRESNAGGLE_FILENAME_DOC || 'output.html', html);

    fs.write(system.env.FIRESNAGGLE_FILENAME_JSON || 'output.json',
             JSON.stringify(data));
});

casper.run();
