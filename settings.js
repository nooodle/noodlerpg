// Module dependencies.
module.exports = function(app, configurations, express) {
  var clientSessions = require('client-sessions');
  var nconf = require('nconf');

  nconf.argv().env().file({ file: 'local.json' });

  // Configuration

  app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', { layout: false });
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
    app.use(express.cookieParser());
    app.use(express.session({ secret: nconf.get('session_secret') }));
    app.use(app.router);
    app.use(function(req, res, next) {
      res.status(403);
      res.render('403', { url: req.url, layout: 'error_layout.jade' });
      return;
    });
    app.use(function(req, res, next) {
      res.status(404);
      res.render('404', { url: req.url, layout: 'error_layout.jade' });
      return;
    });
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('500', { error: err, layout: 'error_layout.jade' });
    });
  });

  app.configure('development, test', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.configure('development', function() {
    app.set('redisnoodle', nconf.get('redis_dev'));
  });

  app.configure('test', function() {
    app.set('redisnoodle', nconf.get('redis_test'));
  });

  app.configure('production', function() {
    app.use(express.errorHandler());
    app.set('redisnoodle', nconf.get('redis_prod'));
  });

  app.dynamicHelpers({
    session: function (req, res) {
      return req.session;
    }
  });

  return app;
};
