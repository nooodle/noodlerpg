'use strict';

var config = require('../config/defaults');
var jobs = require('../config/jobs');
var tools = require('../config/tools');

/* Set user job
 * Requires: job name, db connection
 * Returns: job object
 */
exports.setJob = function(jobName, db, callback) {
  callback(null, job.jobName);
};

/* Set user tool
 * Requires: tool name, db connection
 * Returns: tool object
 */
exports.setTool = function(tool, db, callback) {
  callback(null, tools.tool);
};

/* Set user info
 * Requires: web request, db connection
 * Returns: A hash of the user's current score settings
 */
exports.saveStats = function(req, db, callback) {
  var userKey = 'user:' + req.session.email;

  if (req.session.hp < 1) {
    req.session.hp = 0;
  }

  db.hset(userKey, 'job', req.session.job || {});
  db.hset(userKey, 'gold', req.session.gold);
  db.hset(userKey, 'level', req.session.level);
  db.hset(userKey, 'hp', req.session.hp);
  db.hset(userKey, 'tools', req.session.tools || config.tools);
  db.hset(userKey, 'xp', req.session.xp);
  db.hset(userKey, 'mp', req.session.mp || config.mp);

  var user = {
    email: req.session.email,
    job: req.session.job,
    gold: parseInt(req.session.gold, 10),
    level: parseInt(req.session.level, 10),
    hp: parseInt(req.session.hp, 10),
    tools: req.session.tools,
    xp: req.session.xp,
    mp: req.session.mp
  };

  callback(null, user);
};

/* Get user info
 * Requires: web request, db connection
 * Returns: A hash of the user's current score settings
 */
exports.getStats = function(email, db, callback) {
  var userKey = 'user:' + email;

  db.hgetall(userKey, function(err, userItems) {
    if (err) {
      callback(err);
    } else {
      if (userItems) {
        userItems.email = email;
      } else {
        // User hasn't been created
        userItems = {
          email: email,
          job: null,
          gold: config.gold,
          level: 1,
          hp: config.hp,
          tools: config.tools,
          xp: config.xp,
          mp: config.mp
        };
      }

      callback(null, userItems);
    }
  });
};
