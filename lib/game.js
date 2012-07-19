'use strict';

var user = require('./user');
var battleConstant = 3;
var levelConstant = 5;

var enemyDamageGenerator = function(req) {
  var job = req.session.job;
  var tools = req.session.tools;
  var tool = tools[req.body.tool];

  var speedJobMultiplier = Math.floor(Math.random() *
    (job.speed_multiplier_high_range - job.speed_multiplier_low_range + 1)) +
    job.speed_multiplier_low_range;

  var magicJobMultiplier = Math.floor(Math.random() *
    (job.mp_multiplier_high_range - job.mp_multiplier_low_range + 1)) +
    job.mp_multiplier_low_range;

  var moxieJobMultiplier = Math.floor(Math.random() *
    (job.moxie_multiplier_high_range - job.moxie_multiplier_low_range + 1)) +
    job.moxie_multiplier_low_range;

  var toolDamage = Math.floor(Math.random() *
    (tool.damage_high_range - tool.damage_low_range + 1)) +
    tool.damage_low_range;

  var toolMagic = Math.floor(Math.random() *
    (tool.mp_high_range - tool.mp_low_range + 1)) +
    tool.mp_low_range;

  return (toolDamage * speedJobMultiplier) + (magicJobMultiplier * toolMagic) *
    (moxieJobMultiplier * (toolDamage + toolMagic) / battleConstant);
};

var playerDamageGenerator = function(enemy) {
  return Math.floor(Math.random() *
    (enemy.damage_high_range - enemy.damage_low_range + 1)) +
    enemy.damage_low_range;
};

/* Game battle
 * Requires: web request, db connection
 * Returns: resulting user stats during battle
 */
exports.battle = function(req, enemy, db, callback) {
  var gold = req.session.gold;
  var xp = req.session.xp;
  var mp = req.session.mp;
  var enemyDamage = 0;
  var enemyHP = parseInt(req.body.enemy_hp, 10);

  var playerDamage = playerDamageGenerator(enemy);
  enemyDamage = enemyDamageGenerator(req);

  req.session.hp = req.session.hp - playerDamage;
  enemyHP = enemyHP - enemyDamage;

  if (req.session.hp < 1) {
    req.session.hp = 0;

  } else if (enemyHP < 1) {
    enemyHP = 0;

    // enemy is dead, so let's count up the gold
    gold = Math.floor(Math.random() *
      (enemy.gold_high_range - enemy.gold_low_range + 1)) +
      enemy.gold_low_range * battleConstant;

    gold += req.session.gold;
    req.session.gold = gold;

    // let's also calculate the xp
    xp = Math.floor(Math.random() *
      (enemy.xp_high_range - enemy.xp_low_range + 1)) +
      enemy.xp_low_range;

    xp += req.session.xp;
    req.session.xp = xp;

    /* Calculate to see if player can level up
     * Formula is currently: (x * x + x) * 5
     */
    var currentLevel = (req.session.level * req.session.level + req.session.level) * levelConstant;
    if (currentLevel < req.session.xp) {
      req.session.level = req.session.level + 1;
    }
  }

  user.saveStats(req, db, function(err, user) {
    if (err) {
      callback(err);
    } else {
      var result = {
        player_hp: user.hp,
        enemy_hp: enemyHP,
        gold: gold,
        enemy_damage: enemyDamage,
        xp: xp,
        mp: mp
      };

      callback(null, result);
    }
  });
};
