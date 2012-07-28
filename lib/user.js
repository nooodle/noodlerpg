'use strict';

var config = require('../config/defaults');
var jobs = require('../config/jobs');
var utils = require('./utils');
var tools = require('../config/tools');
var toolObj = {};
toolObj['fist'] = tools['fist'];

var verifyStatValue = function(statName, statItem) {
  statItem = parseInt(statItem, 10);

  if (isNaN(statItem) || statItem < 0) {
    statItem = config[statName];
  }

  return statItem;
};

var userInit = function(req) {
  var user = {
    email: req.session.email,
    job: req.session.job || {},
    gold: verifyStatValue('gold', req.session.gold),
    level: verifyStatValue('level', req.session.level),
    hp: verifyStatValue('hp', req.session.hp),
    tools: req.session.tools || {},
    activeTools: req.session.activeTools || toolObj,
    xp: verifyStatValue('xp', req.session.xp),
    mp: verifyStatValue('mp', req.session.mp),
    enemy: {}
  };

  return user;
};

/* Set user job
 * Requires: job name
 * Returns: job object
 */
exports.setJob = function(job, callback) {
  callback(null, jobs[job] || jobs['engineer']);
};

/* Add active tool
 * Requires: web request, tool name, db connection
 * Returns: tool object if successful, false otherwise
 */
exports.addActiveTool = function(req, db, callback) {
  if (!req.body.tool) {
    callback(null, false);

  } else {
    var toolName = req.body.tool;
    var newToolCount = utils.getObjectSize(req.session.activeTools) + 1;

    if (!toolName || (!req.session.activeTools[toolName] && !req.session.tools[toolName] && newToolCount > 6)) {
      callback(null, false);

    } else {
      req.session.activeTools[toolName] = req.session.tools[toolName];
      delete req.session.tools[toolName];

      this.saveStats(req, db, function(err, user) {
        if (err) {
          callback(err);

        } else {
          callback(null, tools[toolName]);
        }
      });
    }
  }
};

/* Remove active tool
 * Requires: web request, tool name, db connection
 * Returns: tool object if successful, false otherwise
 */
exports.removeActiveTool = function(req, db, callback) {
  if (!req.body.tool) {
    callback(null, false);

  } else {
    var toolName = req.body.tool;

    req.session.tools[toolName] = req.session.activeTools[toolName];
    delete req.session.activeTools[toolName];

    this.saveStats(req, db, function(err, user) {
      if (err) {
        callback(err);

      } else {
        callback(null, tools[toolName]);
      }
    });
  }
};

var setHash = function(db, userKey, user, name) {
  if (typeof user[name] === 'object') {
    db.hset(userKey, name, JSON.stringify(user[name]), function(err, resp) { });

  } else {
    db.hset(userKey, name, user[name], function(err, resp) { });
  }
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

  var user = userInit(req);

  for (var name in user) {
    setHash(db, userKey, user, name);
  }

  callback(null, user);
};

/* Get user info
 * Requires: email, db connection
 * Returns: A hash of the user's current score settings
 */
exports.getStats = function(email, db, callback) {
  var userKey = 'user:' + email;

  db.hgetall(userKey, function(err, userItems) {
    if (err) {
      callback(err);

    } else {
      if (!userItems) {
        // User hasn't been created
        var req = {
          session: {
            email: email
          }
        };

        userItems = userInit(req);

      } else {
        userItems.tools = JSON.parse(userItems.tools);
        userItems.job = JSON.parse(userItems.job);
        userItems.activeTools = JSON.parse(userItems.activeTools);
      }

      callback(null, userItems);
    }
  });
};

var deleteHash = function(db, userKey, name) {
  db.hdel(userKey, name, function(err, resp) { });
};

/* Reset user stats
 * Requires: email, db connection
 * Returns: A hash of the user's current score settings
 */
exports.resetStats = function(req, db, callback) {
  var userKey = 'user:' + req.session.email;

  for (var name in req.session) {
    deleteHash(db, userKey, name);
  }

  callback(null, true);
};
