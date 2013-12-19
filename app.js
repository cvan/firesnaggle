var fs = require('fs');
var os = require('os');
var path = require('path');
var spawn = require('child_process').spawn;

var server = require('./server');
var utils = require('./lib/utils');


var firefoxBin = '$(which firefox)';
switch (os.platform()) {
    case 'darwin':
        firefoxBin = '/Applications/Firefox.app/Contents/MacOS/firefox';
        break;
}
if (process.env.FIREFOX_BIN) {
    firefoxBin = FIREFOX_BIN;
}


function screenshot(opts, cb) {
    console.log('Taking screenshot...')
    var output = '';
    var error = '';

    /*
        Command-line usage:

        %% FIRESNAGGLE_URL='http://www.mysnuggiestore.com' \
           FIRESNAGGLE_WIDTH=320 \
           FIRESNAGGLE_HEIGHT=480 \
           FIRESNAGGLE_DELAY=5000 \
           SLIMERJSLAUNCHER=$(which firefox) \
           lib/packages/casperjs/bin/casperjs test \
               --engine=slimerjs screenshot.js
    */

    var envVars = {
        FIRESNAGGLE_FILENAME: opts.filename,
        FIRESNAGGLE_URL: opts.url,
        FIRESNAGGLE_WIDTH: opts.width,
        FIRESNAGGLE_HEIGHT: opts.height,
        FIRESNAGGLE_DELAY: opts.delay,
        SLIMERJSLAUNCHER: firefoxBin,
        PATH: process.env.PATH + ':' + __dirname + '/lib/packages/casperjs/bin:' + __dirname + '/lib/packages/slimerjs'
    };

    var args = [
        'test', '--engine=slimerjs', __dirname + '/screenshot.js'
    ];

    var job = spawn(__dirname + '/lib/packages/casperjs/bin/casperjs', args,
                    {env: envVars});

    job.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
        output += data;
    });

    job.stderr.on('data', function(data) {
        console.log('stderr: ' + data);
        error += data;
    });

    job.on('exit', function(code) {
        if (code !== 0) {
            if (error) {
                error = 'stderr: ' + error;
            } else {
                error = 'casperjs ' + args[0] + ' exited: ' + code;
            }
        }
        cb(error, output);
    });
}


function getScreenshotFilename(url) {
    return path.resolve('static', 'screenshots', utils.slugify(url) + '.png');
}


function createScreenshotView(req, res) {
    var DATA = req.params;
    console.log('\n' + new Date(), '[' + req.method + ']', req.url);
    console.log(DATA);

    var fn = getScreenshotFilename(DATA.url);

    if (fs.existsSync(fn)) {
        // We got it? Ship it.
        res.contentType = 'image/png';
        res.send(200, fs.readFileSync(fn)); // OK
    } else {
        // Not ready yet? Send a throbber.
        res.contentType = 'image/gif';
        res.send(202, fs.readFileSync('static/loading.gif'));  // Accepted

        // We write to a temporary file to avoid redundancy if we have
        // multiple simultaneous requests for the same URL.
        // if (fs.existsSync(fn + '.tmp')) {
        //     console.error('Screenshot "' + fn + '" already queued');
        //     return;
        // }
        fs.writeFile(fn + '.tmp');

        var baseDir = path.dirname(fn);
        if (!fs.existsSync(baseDir)) {
            console.error('Directory "' + baseDir + '" does not exist');
            utils.mkdirRecursive(baseDir);
        }

        screenshot({
            filename: fn,
            url: DATA.url,
            width: parseInt(DATA.width, 10) || 320,
            height: parseInt(DATA.height, 10) || 480,
            delay: parseInt(DATA.delay, 10) || 5000,
        }, function(err, data) {
            if (err) {
                console.error('Error creating ' + fn + ':\n', err);
            } else {
                console.log('Successfully created ' + fn +':\n', output);
            }
        });
    }
}


function deleteScreenshotView(req, res) {
    var DATA = req.params;
    console.log('\n' + new Date(), '[' + req.method + ']', req.url);
    console.log(DATA);

    var fn = getScreenshotFilename(DATA.url);

    fs.exists(fn, function(exists) {
        if (exists) {
            fs.unlink(fn, function(err, data) {
                if (err) {
                    return console.error('Error reading ' + fn + ':\n', err);
                }
                console.log('Successfully deleted ' + fn);
            });
        } else {
            return console.error('Error reading ' + fn);
        }
    });

    res.send(202);
}


var createScreenshotEndpoint = {
    url: '/screenshot',
    validation: {
        url: {
            description: 'Website URL (http/https)',
            isUrl: true
        },
        width: {
            description: 'Viewport width (in px); default: 320',
            isNumeric: true,
            isRequired: false
        },
        height: {
            description: 'Viewport height (in px); default: 480',
            isNumeric: true,
            isRequired: false
        },
        delay: {
            description: 'How long to wait before taking screenshot' +
                         '(in ms); default: 5000, 5 seconds)',
            isNumeric: true,
            isRequired: false
        }
    }
};

var deleteScreenshotEndpoint = {
    url: '/screenshot',
    validation: {
        url: createScreenshotEndpoint.validation.url
    }
}


server.get(createScreenshotEndpoint, createScreenshotView);
server.post(createScreenshotEndpoint, createScreenshotView);
server.del(deleteScreenshotEndpoint, deleteScreenshotView);


server.listen(process.env.PORT || 5000, function() {
    console.log('%s listening at %s', server.name, server.url);
});
