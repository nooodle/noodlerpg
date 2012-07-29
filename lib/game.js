'use strict';

var config = require('../config/defaults');
var user = require('./user');
var battleConstant = 3;
var levelConstant = 12;

var multiplier = function(high_range, low_range) {
  return Math.floor(Math.random() * (high_range - low_range + 1)) + low_range;
};

var enemyDamageGenerator = function(req) {
  var job = req.session.job;
  var tools = req.session.activeTools;
  var tool = tools[req.body.tool];
  var speedJobMultiplier = multiplier(job.speed_multiplier_high_range, job.speed_multiplier_low_range);
  var magicJobMultiplier = multiplier(job.mp_multiplier_high_range, job.mp_multiplier_low_range);
  var moxieJobMultiplier = multiplier(job.moxie_multiplier_high_range, job.moxie_multiplier_low_range);
  var xpMultiplier = parseInt(req.session.xp, 10) + parseInt(req.session.level, 10);
  var toolDamage = multiplier(tool.damage_high_range, tool.damage_low_range);
  var toolMagic = multiplier(tool.mp_high_range, tool.mp_low_range);

  return (toolDamage * speedJobMultiplier) + (magicJobMultiplier * toolMagic) *
    (moxieJobMultiplier * (toolDamage + toolMagic) + (xpMultiplier * toolDamage) / battleConstant);
};

var playerDamageGenerator = function(enemy) {
  return multiplier(enemy.damage_high_range, enemy.damage_low_range);
};

/* Game battle
 * Requires: web request, db connection
 * Returns: resulting user stats during battle
 */
exports.battle = function(req, db, callback) {
  var enemy = req.session.enemy;
  var enemyHP = parseInt(req.session.enemy_remaining_hp, 10) || enemy.hp;
  var enemyDamage = enemyDamageGenerator(req);
  var xp = parseInt(req.session.xp, 10);
  var gold = parseInt(req.session.gold, 10);
  var level = parseInt(req.session.level, 10);

  req.session.hp -=  playerDamageGenerator(enemy);
  enemyHP -= enemyDamage;
  req.session.enemy_remaining_hp = enemyHP;

  if (req.session.hp < 1) {
    req.session.hp = 0;
    req.session.enemy_remaining_hp = null;

  } else if (enemyHP < 1) {
    enemyHP = 0;
    req.session.enemy_remaining_hp = null;

    // enemy is dead, so let's count up the gold
    req.session.gold = gold + multiplier(enemy.gold_high_range, enemy.gold_low_range);

    // let's also calculate the xp
    req.session.xp = xp + multiplier(enemy.xp_high_range, enemy.xp_low_range);

    /* Calculate to see if player can level up
     * Formula is currently: (x * x + x) * 12
     */
    var currentLevel = (level * level + level) * (levelConstant + level);
    if (currentLevel < xp) {
      req.session.level = level + 1;
    }
  }

  user.saveStats(req, db, function(err, user) {
    if (err) {
      callback(err);

    } else {
      var result = {
        player_hp: user.hp,
        enemy_hp: enemyHP,
        gold: user.gold,
        enemy_damage: enemyDamage,
        xp: user.xp,
        mp: user.mp
      };

      callback(null, result);
    }
  });
};
