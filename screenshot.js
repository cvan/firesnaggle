/*

    Sample usage:

        lib/packages/slimerjs/slimerjs screenshot.js

    Headlessly:

        sudo xvfb-run lib/packages/slimerjs/slimerjs screenshot.js

    On stackato:

        stackato run sudo xvfb-run lib/packages/slimerjs/slimerjs screenshot.js

*/

console.log('Capturing screenshot ...');

var fs = require('fs');
var system = require('system');
var webpage = require('webpage');


var CONFIG = {
    delay: system.env.FIRESNAGGLE_DELAY || 5000,
    fn_doc: system.env.FIRESNAGGLE_FILENAME_DOC || 'output.html',
    fn_image: system.env.FIRESNAGGLE_FILENAME_IMAGE || 'output.png',
    fn_json: system.env.FIRESNAGGLE_FILENAME_JSON || 'output.json',
    height: parseInt(system.env.FIRESNAGGLE_HEIGHT, 10) || 480,
    url: system.env.FIRESNAGGLE_URL || 'http://www.mysnuggiestore.com',
    width: parseInt(system.env.FIRESNAGGLE_WIDTH, 10) || 320
};

// Workaround for bug where slimerjs does not inherit environment
// variables when run headlessly.
system.args.slice(1).forEach(function (key) {
    var chunks = key.split('=');
    CONFIG[chunks[0]] = chunks.slice(1).join('=');
});
CONFIG.height = parseInt(CONFIG.height, 10);
CONFIG.width = parseInt(CONFIG.width, 10);
console.log('config:' + JSON.stringify(CONFIG, null, 2));

var urlStatuses = {};
var page = webpage.create();

page.viewportSize = {width: CONFIG.width, height: CONFIG.height};

page.onResourceReceived = function (response) {
    // We don't know what the final URL is yet, but we will later,
    // so we'll just look up the status for that URL later. (This is a
    // workaround for https://github.com/ariya/phantomjs/issues/10185)
    urlStatuses[response.url] = {
        status: response.status,
        statusText: response.statusText
    };
};

page.open(CONFIG.url, function (status) {
    if (status === 'fail') {
        return phantom.exit();
    }
    window.setTimeout(function () {
        page.clipRect = {
            height: CONFIG.height,
            left: 0,
            top: 0,
            width: CONFIG.width
        };

        page.render(CONFIG.fn_image);

        var data = page.evaluate(function () {
            return {
                location: window.location.href,
                title: document.title
            };
        });

        data.html = page.content;

        var status = urlStatuses[data.location];
        data.status = status.status;
        data.statusText = status.statusText;
        console.log(JSON.stringify(data, null, 2));

        fs.write(CONFIG.fn_doc, data.html);
        fs.write(CONFIG.fn_json, JSON.stringify(data));

        phantom.exit();
    }, CONFIG.delay);
});
