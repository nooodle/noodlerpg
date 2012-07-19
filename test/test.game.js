'use strict';

var express = require('express');
var app = express.createServer();
var assert = require('should');
var user = require('../lib/user');
var nock = require('nock');
var should = require('should');
var nconf = require('nconf');
var redis = require('redis');
var db = redis.createClient();
var game = require('../lib/game');
var jobs = require('../config/jobs');
var tools = require('../config/tools');

nconf.argv().env().file({ file: 'test/local-test.json' });

db.select(app.set('redisnoodle'), function(err, res) {
  if (err) {
    console.log('TEST database connection failed.');
  }
});

var enemy = {
  name: 'Starky',
  hp: 20,
  damage_low_range: 1,
  damage_high_range: 10,
  gold_low_range: 2,
  gold_high_range: 5,
  xp_low_range: 2,
  xp_high_range: 3
};

var job = jobs[Object.keys(jobs)[0]]; // omg getting the first element of a hash.

var req = {
  session: {
    email: 'test@test.org',
    job: job,
    level: 1,
    gold: 100,
    tools: tools,
    hp: 50,
    xp: 1,
    mp: 0
  },
  body: {
    enemy: 'Starky',
    tool: 'battery',
    enemy_hp: enemy.hp
  }
};

describe('game', function() {
  describe('battle', function() {
    it('battles an enemy and both HPs are less', function(done) {
      req.body.enemy_hp = 20;
      game.battle(req, enemy, db, function(err, result) {
        should.exist(result);
        result.player_hp.should.not.equal(50);
        result.enemy_hp.should.not.equal(20);
        done();
      });
    });

    it('battles an enemy and player wins', function(done) {
      enemy.hp = 0;
      req.body.enemy_hp = 0;
      game.battle(req, enemy, db, function(err, result) {
        should.exist(result);
        result.gold.should.not.equal(0);
        result.xp.should.not.equal(1);
        result.player_hp.should.not.equal(0);
        done();
      });
    });

    it('battles an enemy and player loses', function(done) {
      req.session.hp = 0;
      game.battle(req, enemy, db, function(err, result) {
        should.exist(result);
        result.player_hp.should.equal(0);
        result.enemy_hp.should.not.equal(0);
        done();
      });
    });
  });
});
