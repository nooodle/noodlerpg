'use strict';

define(['jquery'], function ($) {
  var enemy = $('img.enemy');
  var stats = $('ol.stats');
  var statsDashboard = $('ol.dashboard-stats');
  var player = $('img.player');
  var fightAction = $('img.action');
  var message = $('.battle-message');
  var fightAgain = $('.fight-again');
  var goldAmount = $('.stats .gold');
  var currentTools = $('.dashboard .tools ul');
  var inventory = $('.dashboard .inventory ul');
  var activeStoreItems = $('.store .items li.enabled');
  var drop = $('#drop img');

  var updateStats = function(options) {
    enemy.data('hp', options.enemy_hp);
    stats.find('#hp span').text(options.player_hp);
    stats.find('#damage span').text(options.enemy_damage);
    stats.find('#gold span').text(options.gold);
    stats.find('#xp span').text(options.xp);
    stats.find('#mp span').text(options.mp);
    stats.find('#enemy-hp span').text(options.enemy_hp);
  };

  var battleTrigger = function(params) {
    $.post('/battle', params, function(data) {
      var playerHP = Math.round(data.result.player_hp);
      var enemyHP = data.result.enemy_hp;
      var enemyDamage = Math.round(data.result.enemy_damage);
      var gold = data.result.gold;
      var xp = data.result.xp;
      var mp = data.result.mp;

      if (enemyHP < 1 || playerHP < 1) {
        if (enemyHP < 1 && playerHP > 0) {
          if (data.result.drop === 'wormhole') {
            message.text('You win!');
            enemy.fadeOut(2500, function() {
              player.fadeOut(2500, function() {
                $('.wrapper').fadeOut(2500, function() {
                  document.location = '/the_end';
                });
              });
            });
          } else {
            enemy.attr('src', enemy.attr('src').replace('-alive', '-dead'));
            enemy.addClass('dead').removeClass('alive');
            enemyHP = 0;
            message.text('You win!');

            if (playerHP > 1 && enemyHP < 1) {
              if (data.result.drop) {
                drop.attr('src', '/drops/' + data.result.drop + '.png');
                drop.parent().fadeIn();
              }

              fightAgain.fadeIn();
            }
          }

        } else {
          if (enemyHP < 0) {
            enemyHP = 0;
          }

          message.text('You lost :(');
          player.attr('src', player.attr('src').replace('-alive', '-dead'));
          player.addClass('dead').removeClass('alive');
          playerHP = 0;
          message.text('You lost :(');
        }
      }

      updateStats({
        player_hp: Math.round(playerHP),
        enemy_hp: enemyHP,
        enemy_damage: Math.round(enemyDamage),
        gold: gold,
        xp: xp,
        mp: mp
      });

      fightAction.fadeOut();
    });
  };

  var self = {
    refuel: function() {
      $.get('/refuel', function(data) {
        statsDashboard.find('#gold span').text(data.result.gold);
        statsDashboard.find('#hp span').text(data.result.hp);
      });
    },

    fight: function(self) {
      if (enemy.hasClass('alive') && player.hasClass('alive')) {
        var params = {
          level: self.parent().data('level'),
          tool: self.data('tool')
        };

        fightAction.fadeIn();

        battleTrigger(params);
      }
    },

    buy: function(self) {
      var goldAmountNum = parseInt(goldAmount.text(), 10);

      var params = {
        cost: parseInt(self.find('span.cost').text(), 10),
        tool: self.find('span.tool-type').data('key')
      };

      if (goldAmountNum >= params.cost && !self.hasClass('disabled')) {
        $.post('/buy', params, function(data) {
          goldAmount.text(data.result.gold);
          self.removeClass('enabled').addClass('disabled');
          activeStoreItems.each(function(idx, item) {
            var item = $(this);
            if (item.data('cost') > data.result.gold) {
              item.removeClass('enabled').addClass('disabled');
            }
          });
        });
      }
    },

    addTool: function(self) {
      if (currentTools.find('li').length < 6) {
        var params = {
          tool: self.data('tool')
        };

        $.post('/add_tool', params, function(data) {
          if (data.result.tool) {
            var toolItem = inventory.find('li[data-tool="' + self.data('tool') + '"]');
            currentTools.append(toolItem);
          };
        });
      }
    },

    removeTool: function(self) {
      var params = {
        tool: self.data('tool')
      };

      $.post('/remove_tool', params, function(data) {
        if (data.result.tool) {
          var toolItem = currentTools.find('li[data-tool="' + self.data('tool') + '"]');
          inventory.append(toolItem);
        };
      });
    }
  };

  return self;
});
