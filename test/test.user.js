'use strict';

var express = require('express');
var app = express.createServer();
var assert = require('should');
var user = require('../lib/user');
var nock = require('nock');
var should = require('should');
var nconf = require('nconf');
var redis = require("redis");
var db = redis.createClient();
var jobs = require('../config/jobs');
var tools = require('../config/tools');

nconf.argv().env().file({ file: 'test/local-test.json' });

db.select(app.set('redisnoodle'), function(err, res) {
  if (err) {
    console.log('TEST database connection failed.');
  }
});

var job = jobs[Object.keys(jobs)[0]];

var req = {
  session: {
    email: 'test@test.org',
    job: job,
    level: 1,
    gold: 100,
    tools: tools,
    hp: 50,
    xp: 1
  }
};

describe('user', function() {
  describe('saveStats', function() {
    it('saves user stats', function(done) {
      user.saveStats(req, db, function(err, user) {
        should.exist(user);
        user.email.should.equal(req.session.email);
        user.job.should.equal(req.session.job);
        user.level.should.equal(req.session.level);
        user.gold.should.equal(req.session.gold);
        user.xp.should.equal(req.session.xp);
        done();
      });
    });

    it('gets user stats', function(done) {
      user.saveStats(req, db, function(err, userStatSave) {
        user.getStats(req.session.email, db, function(err, userStat) {
          should.exist(userStat);
          userStat.email.should.equal(req.session.email);
          userStat.job.name.should.equal(req.session.job.name);
          userStat.level.should.equal(JSON.stringify(req.session.level));
          userStat.gold.should.equal(JSON.stringify(req.session.gold));
          userStat.xp.should.equal(JSON.stringify(req.session.xp));
          done();
        });
      });
    });

    it('sets the user job if correctly defined', function(done) {
      user.setJob('engineer', function(err, job) {
        should.exist(job);
        job.should.equal(jobs['engineer']);
        done();
      });
    });

    it('sets the user hp to the default if incorrectly defined', function(done) {
      req.session.hp = 'a';
      user.saveStats(req, db, function(err, userStatSave) {
        user.getStats(req.session.email, db, function(err, userStat) {
          should.exist(userStat);
          userStat.hp.should.equal('50');
          done();
        });
      });
    });

    it('sets the user job if incorrectly defined', function(done) {
      user.setJob('engineer-nonexistent', function(err, job) {
        should.exist(job);
        job.name.toLowerCase().should.equal('engineer');
        done();
      });
    });

    it('resets the user stats', function(done) {
      req.session.gold = 1000;
      req.session.hp = 1000;
      user.saveStats(req, db, function(err, userStatSave) {
        user.resetStats(req, db, function(err, resp) {
          should.exist(resp);
          done();
        });
      });
    });
  });
});
