var auth = require('../lib/authenticate');
var user = require('../lib/user');

module.exports = function(app, db, nconf, isLoggedIn) {
  // Login
  app.post('/login', function(req, res) {
    auth.verify(req, nconf, function(error, email) {
      if (email) {
        user.getStats(email, db, function(err, userStat) {
          for (var name in userStat) {
            req.session[name] = userStat[name];
          }

          req.session.email = email;

          res.redirect('/dashboard');
        });
      } else {
        res.redirect('/');
      }
    });
  });

  // Logout
  app.get('/logout', isLoggedIn, function(req, res) {
    req.session.reset();
    res.redirect('/?logged_out=1', 303);
  });
};
