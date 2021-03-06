var express = require('express'),
    fetcher = require('./fetcher'),
    parser = require('./parser'),
    config = require('./config'),
    pkg = require('../package.json'),
    app = express();


var start = function() {
    var port = config.port,
        host = config.host;

    app.listen(port, host, function() {
        console.log('Server started on %s:%s', host, port);
    });
};


var sendError = function(res, status, msg) {
    var body = { 'error': msg };

    res.status(status).send(body);
    return;
};


module.exports = {
    'start': start,
    'app': app
};

/*
 * Middleware
 */

app.use(function(req, res, next) {

    // All requests are in JSON format
    res.setHeader('Content-Type', 'application/json');

    // Check for API key
    if (config.apiKey) {
        var recieved = req.query['api-key'] || req.get('X-API-KEY') || false;
        if (config.apiKey != recieved || !recieved) {
            return sendError(res, 401, 'API-key reguired, bad token supplied');
        }
    }

    next();
});


/*
 * Routes
 */

app.get('/', function(req, res) {
    res.setHeader('Location', '/search');
    sendError(res, 302, 'Welcome to Yarr! Take a look at /search');
});


app.get('/search', function(req, res) {

    // Check for q in params
    if (!req.query.q) {
        return sendError(res, 400, 'Missing required \'q\' parameter.');
    }

    var q = req.query.q,
        hd = req.query.hd || false,
        season = req.query.s || false,
        episode = req.query.e || false,
        body;

    var parseTester = function(err, _res, body) {
        if (err || _res.statusCode !== 200) {
            return sendError(res, 500, 'Couldn\'t fetch from URL.');
        }

        var a = new parser(body);
        a.parse();
        body = a.data[0] || { 'error': 'No results found.'};
        res.send(body);
    };

    var f = new fetcher(q, hd, season, episode);
    f.load(parseTester);
});


app.get('/version', function(req, res) {
    var body = { 'version': pkg.version };
    res.send(body);
});
