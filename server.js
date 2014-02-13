var pkg = require('./package');

var restify = require('restify');
var restifySwagger = require('node-restify-swagger');
var restifyValidation = require('node-restify-validation');


var server = restify.createServer({
    name: pkg.name,
    version: pkg.version
});

server.use(restify.acceptParser(['image/gif', 'image/png']));
server.use(restify.bodyParser());
server.use(restify.CORS());
server.use(restify.fullResponse());
server.use(restify.gzipResponse());
server.use(restify.queryParser());
server.use(restifyValidation.validationPlugin({errorsAsArray: false}));

server.get(/\/static\/?.*/, restify.serveStatic({
    directory: './static'
}));

restifySwagger.configure(server);
restifySwagger.loadRestifyRoutes();

module.exports = server;
