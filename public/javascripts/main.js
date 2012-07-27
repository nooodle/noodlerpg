'use strict';

requirejs.config({
  baseUrl: '/javascripts/lib',
  enforceDefine: true,
  paths: {
    jquery: 'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min'
  }
});

define(['jquery', 'game'],
  function($, game) {

    var loginForm = $('form#login-form');

    // Persona login
    loginForm.on('click', '#login', function() {
      navigator.id.getVerifiedEmail(function(assertion) {
        if (assertion) {
          loginForm.find('input[name="bid_assertion"]').val(assertion);
          loginForm.submit();
        }
      });
    });

    // Job selection
    var jobList = $('ul.jobs');

    jobList.on('click', 'li', function() {
      var self = $(this);
      $.post('/job', { job: self.data('job') }, function(data) {
        document.location = '/';
      });
    });

    // Battle action
    var tools = $('ol.tools');

    tools.on('click', 'li', function() {
      game.fight($(this));
    });

    // Refueling
    var stats = $('ol.dashboard-stats');

    stats.on('click', '#refuel', function(ev) {
      ev.preventDefault();
      game.refuel();
    });

    // Purchasing tools
    var toolItems = $('ul.items');

    toolItems.on('click', 'li', function() {
      game.buy($(this));
    });

    // Adding tools
    var inventory = $('div.inventory ul');

    inventory.on('click', 'li', function() {
      game.addTool($(this));
    });

    // Removing tools
    var activeTools = $('div.tools ul');

    activeTools.on('click', 'li', function() {
      game.removeTool($(this));
    });
});
