var crypto = require('crypto');
var fs = require('fs');
var os = require('os');
var path = require('path');
var spawn = require('child_process').spawn;

var request = require('request');

var server = require('./server');
var settings = require('./settings_local');
var utils = require('./lib/utils');


function debug(req) {
    if (!settings.DEBUG) {
        return;
    }
    console.log('\n' + new Date(), '[' + req.method + ']', req.url);
    console.log(req.params);
}


function getUrlboxURL(args) {
    var qs = utils.serialize(args);
    var token = crypto.createHmac('sha1', settings.URLBOX_API_SECRET).update(qs).digest('hex');
    return 'https://api.urlbox.io/v1/' + settings.URLBOX_API_KEY + '/' + token + '/png?' + qs;
}


function screenshot(opts, cb) {
    console.log('Taking screenshot...');
    var output = '';
    var error = '';

    /*
        Command-line usage:

        %% FIRESNAGGLE_URL='http://www.mysnuggiestore.com' \
           FIRESNAGGLE_WIDTH=320 \
           FIRESNAGGLE_HEIGHT=480 \
           FIRESNAGGLE_DELAY=5000 \
           lib/packages/slimerjs/slimerjs screenshot.js
    */

    var urlboxOpts = {
        height: opts.height,
        width: opts.width,
        url: opts.url
    };
    // Pipe urlbox image to a file.
    request(getUrlboxURL(urlboxOpts)).pipe(fs.createWriteStream(opts.filename_image));

    // Temporarily disable slimerjs screenshots.
    return;

    var envVars = {
        DISPLAY: ':0',
        FIRESNAGGLE_FILENAME_DOC: opts.filename_doc,
        FIRESNAGGLE_FILENAME_IMAGE: opts.filename_image,
        FIRESNAGGLE_FILENAME_JSON: opts.filename_json,
        FIRESNAGGLE_URL: opts.url,
        FIRESNAGGLE_WIDTH: opts.width,
        FIRESNAGGLE_HEIGHT: opts.height,
        FIRESNAGGLE_DELAY: opts.delay
    };

    var SLIMERJS_EXECUTABLE = process.env.SLIMERJS_EXECUTABLE ||
                              __dirname + '/lib/packages/slimerjs/slimerjs';

    var args = ['--debug=true', __dirname + '/screenshot.js'];
    var job;

    if (os.platform() === 'linux') {
        // Workaround for bug where slimerjs does not inherit environment
        // variables when run headlessly.
        args = args.concat([
            'delay=' + envVars.FIRESNAGGLE_DELAY,
            'fn_doc=' + envVars.FIRESNAGGLE_FILENAME_DOC,
            'fn_image=' + envVars.FIRESNAGGLE_FILENAME_IMAGE,
            'fn_json=' + envVars.FIRESNAGGLE_FILENAME_JSON,
            'height=' + envVars.FIRESNAGGLE_HEIGHT,
            'url=' + envVars.FIRESNAGGLE_URL,
            'width=' + envVars.FIRESNAGGLE_WIDTH
        ]);
        job = spawn('sudo', [SLIMERJS_EXECUTABLE].concat(args), {env: envVars});
    } else {
        console.log(SLIMERJS_EXECUTABLE, JSON.stringify(envVars));
        job = spawn(SLIMERJS_EXECUTABLE, args, {env: envVars});
    }

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
                error = 'slimerjs ' + args[0] + ' exited: ' + code;
            }
        }
        cb(error, output);
    });
}


function getBaseFilename(url) {
    return path.resolve('static', 'screenshots',
                        utils.slugify(url));
}


function getDocFilename(url) {
    return getBaseFilename(url) + '.html';
}


function getImageFilename(url) {
    return getBaseFilename(url) + '.png';
}


function getJSONFilename(url) {
    return getBaseFilename(url) + '.json';
}


function getTempFilename(url) {
    return getBaseFilename(url) + '.tmp';
}


function createScreenshotView(req, res, format) {
    debug(req);

    var DATA = req.params;

    var fnDoc = getDocFilename(DATA.url);
    var fnImg = getImageFilename(DATA.url);
    var fnJSON = getJSONFilename(DATA.url);
    var fnTemp = getTempFilename(DATA.url);

    if (fs.existsSync(fnImg)) {
        // We got it? Ship it.
        switch (format) {
            case 'html':
                res.contentType = 'text/plain';
                return fs.createReadStream(fnDoc).pipe(res);
            case 'json':
                res.contentType = 'application/json';
                return fs.createReadStream(fnJSON).pipe(res);
            default:
                res.contentType = 'image/png';
                return fs.createReadStream(fnImg).pipe(res);
        }
    }

    switch (format) {
        case 'html':
            res.contentType = 'text/plain';
            res.send(202);
            break;
        case 'json':
            res.contentType = 'application/json';
            res.json(202, {});
            break;
        default:
            // Not ready yet? Send a throbber.
            res.contentType = 'image/gif';
            res.send(202, fs.readFileSync('static/loading.gif'));  // Accepted
            break;
    }

    var baseDir = path.dirname(fnTemp);
    if (!fs.existsSync(baseDir)) {
        console.error('Directory "' + baseDir + '" does not exists');
        utils.mkdirRecursive(baseDir);
    }

    // We write to a temporary file to avoid redundancy if we have
    // multiple simultaneous requests for the same URL.
    if (fs.existsSync(fnTemp)) {
        console.error('Screenshot "' + fnImg + '" already queued');
        return;
    }
    fs.writeFile(fnTemp);

    screenshot({
        filename_doc: fnDoc,
        filename_image: fnImg,
        filename_json: fnJSON,
        url: DATA.url,
        width: parseInt(DATA.width, 10) || 320,
        height: parseInt(DATA.height, 10) || 480,
        delay: parseInt(DATA.delay, 10) || 5000,
    }, function(err, data) {
        if (err) {
            console.error('Error creating ' + fn + ':\n', err);
        } else {
            console.log('Successfully created ' + fn +':\n', data);
        }
    });
}


function deleteScreenshotView(req, res) {
    debug(req);

    var DATA = req.params;

    var fnDoc = getDocFilename(DATA.url);
    var fnImg = getImageFilename(DATA.url);
    var fnJSON = getJSONFilename(DATA.url);
    var fnTemp = getTempFilename(DATA.url);

    [fnDoc, fnImg, fnJSON, fnTemp].forEach(function(fn) {
        fs.exists(fn, function(exists) {
            if (exists) {
                fs.unlink(fn, function(err) {
                    if (err) {
                        return console.error('Error reading ' + fn + ':\n',
                                             err);
                    }
                    console.log('Successfully deleted ' + fn);
                });
            } else {
                return console.error('Error reading ' + fn);
            }
        });
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
};

server.get(createScreenshotEndpoint, createScreenshotView);
server.post(createScreenshotEndpoint, createScreenshotView);
server.del(deleteScreenshotEndpoint, deleteScreenshotView);


var createHTMLEndpoint = {
    url: '/html',
    validation: {
        url: {
            description: 'Website URL (http/https)',
            isUrl: true
        },
        delay: {
            description: 'How long to wait before taking screenshot' +
                         '(in ms); default: 5000, 5 seconds)',
            isNumeric: true,
            isRequired: false
        }
    }
};

function createHTMLView(req, res) {
    return createScreenshotView(req, res, 'html');
}

server.get(createHTMLEndpoint, createHTMLView);
server.post(createHTMLEndpoint, createHTMLView);
server.del(createHTMLEndpoint, deleteScreenshotView);


var createJSONEndpoint = {
    url: '/json',
    validation: {
        url: {
            description: 'Website URL (http/https)',
            isUrl: true
        },
        delay: {
            description: 'How long to wait before taking screenshot' +
                         '(in ms); default: 5000, 5 seconds)',
            isNumeric: true,
            isRequired: false
        }
    }
};

function createJSONView(req, res) {
    return createScreenshotView(req, res, 'json');
}

server.get(createJSONEndpoint, createJSONView);
server.post(createJSONEndpoint, createJSONView);
server.del(createJSONEndpoint, deleteScreenshotView);

server.listen(process.env.PORT || 7000, function() {
    console.log('%s listening at %s', server.name, server.url);
});
