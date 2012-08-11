'use strict';

var game = require('../lib/game');
var user = require('../lib/user');
var utils = require('../lib/utils');
var config = require('../config/defaults');
var tools = require('../config/tools');

module.exports = function(app, db, isLoggedIn, hasJob, hasNoJob,
  sufficientLevelAccess, hasEnemy, resetEnemy, hasActiveTool, hasFinalLevelAccess) {

  app.get('/', function(req, res) {
    if (req.session.email) {
      res.redirect('/dashboard');
    } else {
      res.render('index', {
        pageType: 'landing'
      });
    }
  });

  app.get('/dashboard', isLoggedIn, resetEnemy, function(req, res) {
    var hasJob = false;
    if (utils.getObjectSize(req.session.job) > 0) {
      hasJob = true;
    }

    res.render('game_dashboard', {
      pageType: 'dashboard',
      level: req.session.level,
      hasJob: hasJob,
      title: 'Dashboard'
    });
  });

  app.post('/add_tool', isLoggedIn, function(req, res) {
    user.addActiveTool(req, db, function(err, tool) {
      var toolName = tool.name.replace(/\s/, '_');

      delete req.session.tools[toolName];
      req.session.activeTools[toolName] = tool;

      var data = {};
      data.result = {
        tool: tool
      };

      res.json(data);
    });
  });

  app.post('/remove_tool', isLoggedIn, function(req, res) {
    user.removeActiveTool(req, db, function(err, tool) {
      var toolName = tool.name.replace(/\s/, '_');

      delete req.session.activeTools[toolName];
      req.session.tools[toolName] = tool;

      var data = {};
      data.result = {
        tool: tool
      };

      res.json(data);
    });
  });

  app.get('/reset', isLoggedIn, function(req, res) {
    user.resetStats(req, db, function(err, user) {
      res.redirect('/logout', 303);
    });
  });

  app.get('/store', isLoggedIn, resetEnemy, function(req, res) {
    res.render('store', {
      pageType: 'store',
      level: req.session.level,
      tools: tools,
      title: 'Noodle Goods Shoppe'
    });
  });

  app.post('/buy', isLoggedIn, resetEnemy, function(req, res) {
    var toolName = req.body.tool;
    var gold = parseInt(req.session.gold, 10);

    if (!req.session.activeTools[toolName] &&
      !req.session.tools[toolName] &&
      gold >= tools[toolName].cost &&
      parseInt(req.session.level, 10) >= tools[toolName].min_level) {

      req.session.gold = gold - parseInt(req.body.cost, 10);
      req.session.tools[toolName] = tools[toolName];
    }

    user.saveStats(req, db, function(err, user) {
      var data = {};
      data.result = {};

      if (err) {
        data.result.status = 500;
      } else {
        data.result = {
          hp: user.hp,
          gold: user.gold,
          status: 200
        };
      }

      res.json(data);
    });
  });

  app.get('/universe', isLoggedIn, resetEnemy, function(req, res) {
    res.render('universe', {
      pageType: 'universe',
      level: req.session.level,
      title: 'Noodle Universe'
    });
  });

  app.get('/refuel', isLoggedIn, resetEnemy, function(req, res) {
    var data = { result: {} };

    user.refuel(req, db, function(err, userResp) {
      if (err) {
        data.result.status = 500;
      } else {
        data.result = {
          hp: userResp.hp,
          gold: userResp.gold,
          status: 200
        };
      }

      res.json(data);
    });
  });

  app.get('/job', isLoggedIn, hasNoJob, resetEnemy, function(req, res) {
    res.render('job', {
      pageType: 'job',
      title: 'Choose a job!'
    });
  });

  app.post('/job', isLoggedIn, hasNoJob, resetEnemy, function(req, res) {
    user.setJob(req, function(err, job) {
      req.session.job = job;

      user.saveStats(req, db, function(err, user) {
        res.redirect('/dashboard');
      });
    });
  });

  app.get('/preview/:level', isLoggedIn, hasJob, sufficientLevelAccess,
    resetEnemy, hasFinalLevelAccess, function(req, res) {

    var level = parseInt(req.params.level, 10);
    var config = require('../config/level' + level);
    var pharmacy = false;

    if (config.pharmacy) {
      pharmacy = true;
    }

    res.render('game_preview', {
      pageType: 'game level' + level,
      level: level,
      title: config.location,
      pharmacy: pharmacy
    });
  });

  app.get('/pharmacy/:level', isLoggedIn, hasJob, sufficientLevelAccess,
    resetEnemy, function(req, res) {

    var level = parseInt(req.params.level, 10);
    var config = require('../config/level' + level);
    var items = config.pharmacy;

    res.render('pharmacy', {
      pageType: 'pharmacy',
      title: 'Pharmacy',
      items: items
    });
  });

  app.get('/detail/:level', isLoggedIn, hasJob, sufficientLevelAccess,
    hasActiveTool, hasFinalLevelAccess, function(req, res) {

    var isBoss = '';
    var level = parseInt(req.params.level, 10);
    var config = require('../config/level' + level);
    var enemy = config.enemies[Math.floor(Math.random() * config.enemies.length)];

    req.session.enemy = enemy;
    req.session.last_level_played = level;

    if (level === 9) {
      isBoss = 'boss';
    }

    res.render('game_detail', {
      pageType: 'game detail level' + level,
      level: level,
      title: 'The world of ' + config.location,
      enemy: enemy,
      isBoss: isBoss,
      message: enemy.battle_messages[Math.floor(Math.random() * enemy.battle_messages.length)].message
    });
  });

  app.post('/battle', isLoggedIn, hasJob, sufficientLevelAccess, hasEnemy,
    hasActiveTool, function(req, res) {

    var level = parseInt(req.session.last_level_played, 10);
    var config = require('../config/level' + level);
    var result = {};

    game.battle(req, db, function(err, result) {
      res.json({
        result: result
      });
    });
  });

  app.get('/the_end', isLoggedIn, hasJob, hasFinalLevelAccess, function(req, res) {
    res.render('end', {
      pageType: 'end'
    })
  });

  app.get('/ascend', isLoggedIn, hasJob, hasFinalLevelAccess, function(req, res) {
    user.ascendStats(req, db, function(err, userResp) {
      if (err) {
        res.redirect('/500');

      } else {
        res.redirect('/dashboard');
      }
    });
  });
};
