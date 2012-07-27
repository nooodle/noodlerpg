'use strict';

var game = require('../lib/game');
var user = require('../lib/user');
var config = require('../config/defaults');
var tools = require('../config/tools');

module.exports = function(app, db, isLoggedIn, hasJob, hasNoJob, sufficientLevelAccess, hasEnemy, resetEnemy) {
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
    res.render('game_dashboard', {
      pageType: 'dashboard',
      level: req.session.level,
      title: 'Dashboard'
    });
  });

  app.post('/add_tool', isLoggedIn, function(req, res) {
    user.addActiveTool(req, db, function(err, tool) {
      req.session.activeTools[tool.name.replace(/\s/, '_')] = tool;

      var data = {};
      data.result = {
        tool: tool
      };

      res.json(data);
    });
  });

  app.post('/remove_tool', isLoggedIn, function(req, res) {
    user.removeActiveTool(req, db, function(err, tool) {
      delete req.session.activeTools[tool.name.replace(/\s/, '_')];

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
    var saleTools = tools;
    delete saleTools['fist'];

    res.render('store', {
      pageType: 'store',
      level: req.session.level,
      tools: saleTools,
      title: 'Noodle Goods Shoppe'
    });
  });

  app.post('/buy', isLoggedIn, resetEnemy, function(req, res) {
    if (!req.session.tools[req.body.tool]) {
      req.session.gold -= parseInt(req.body.cost, 10);
      req.session.tools[req.body.tool] = tools[req.body.tool];
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
    if (req.session.gold >= 10) {
      var data = { result: {} };
      req.session.hp += 15;
      req.session.gold -= 10;

      user.saveStats(req, db, function(err, user) {
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
    }
  });

  app.get('/job', isLoggedIn, hasNoJob, resetEnemy, function(req, res) {
    res.render('job', {
      pageType: 'job',
      title: 'Choose a job!'
    });
  });

  app.post('/job', isLoggedIn, hasNoJob, resetEnemy, function(req, res) {
    user.setJob(req.body.job, function(err, job) {
      req.session.job = job;

      user.saveStats(req, db, function(err, user) {
        res.redirect('/dashboard');
      });
    });
  });

  app.get('/preview/:level', isLoggedIn, hasJob, sufficientLevelAccess, resetEnemy, function(req, res) {
    var level = parseInt(req.params.level, 10);
    var config = require('../config/level' + level);

    res.render('game_preview', {
      pageType: 'game level' + level,
      level: level,
      title: config.location
    });
  });

  app.get('/detail/:level', isLoggedIn, hasJob, sufficientLevelAccess, function(req, res) {
    var level = parseInt(req.params.level, 10);
    var config = require('../config/level' + level);
    var enemy = config.enemies[Math.floor(Math.random() * config.enemies.length)];

    req.session.enemy = enemy;

    res.render('game_detail', {
      pageType: 'game detail level' + level,
      level: level,
      title: 'The world of ' + config.location,
      enemy: enemy,
      message: enemy.battle_messages[Math.floor(Math.random() * enemy.battle_messages.length)].message
    });
  });

  app.post('/battle', isLoggedIn, hasJob, sufficientLevelAccess, hasEnemy, function(req, res) {
    var level = parseInt(req.body.level, 10);
    var config = require('../config/level' + level);
    var result = {};

    game.battle(req, db, function(err, result) {
      res.json({
        result: result
      });
    });
  });
};
