'use strict';

var config = require('../config/defaults');
var user = require('./user');
var drops = require('../config/drops');
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

  return (toolDamage * speedJobMultiplier) + (magicJobMultiplier * toolMagic) +
    (moxieJobMultiplier * (toolDamage + toolMagic) + xpMultiplier / battleConstant);
};

var playerDamageGenerator = function(xp, enemy) {
  var enemyDamage = multiplier(enemy.damage_high_range, enemy.damage_low_range);
  var xpDamage = multiplier(xp / levelConstant, 1);
  var damage = Math.round(enemyDamage - (xpDamage / enemyDamage));

  return damage;
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
  var drop;
  var setEnemyMin = function() {
    enemyHP = 0;
    req.session.enemy_remaining_hp = null;
  };

  req.session.hp -=  playerDamageGenerator(xp, enemy);
  enemyHP -= enemyDamage;
  req.session.enemy_remaining_hp = enemyHP;

  if (req.session.hp < 1) {
    req.session.hp = 0;
    req.session.enemy_remaining_hp = null;

    if (enemyHP < 0) {
      setEnemyMin();
    }

  } else if (enemyHP < 1 && req.session.hp > 0) {
    setEnemyMin();

    // enemy is dead, so let's count up the gold
    req.session.gold = gold + multiplier(enemy.gold_high_range, enemy.gold_low_range);

    // let's also calculate the xp
    req.session.xp = xp + multiplier(enemy.xp_high_range, enemy.xp_low_range);

    // if the enemy has a drop available and the user does not have it already, let's provide it
    if (enemy.drop && !req.session.drops[enemy.drop]) {
      drop = enemy.drop;
      req.session.drops[enemy.drop] = drops[drop];
    }

    /* Calculate to see if player can level up
     * Formula is currently: (x * x + x) * (12 + x)
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
        player_hp: parseInt(user.hp, 10),
        enemy_hp: parseInt(enemyHP, 10),
        gold: parseInt(user.gold, 10),
        enemy_damage: parseInt(enemyDamage, 10),
        xp: parseInt(user.xp, 10),
        mp: parseInt(user.mp, 10),
        drop: drop
      };

      callback(null, result);
    }
  });
};
