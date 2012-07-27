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

  var updateStats = function(options) {
    enemy.data('hp', options.enemy_hp);
    stats.find('#hp span').text(options.player_hp);
    stats.find('#damage span').text(options.enemy_damage);
    stats.find('#gold span').text(options.gold);
    stats.find('#xp span').text(options.xp);
    stats.find('#mp span').text(options.mp);
    stats.find('#enemy-hp span').text(options.enemy_hp);
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
          enemy: enemy.data('enemy'),
          enemy_hp: enemy.data('hp'),
          tool: self.data('tool')
        };

        fightAction.fadeIn();

        $.post('/battle', params, function(data) {
          var playerHP = data.result.player_hp;
          var enemyHP = data.result.enemy_hp;
          var enemyDamage = data.result.enemy_damage;
          var gold = data.result.gold;
          var xp = data.result.xp;
          var mp = data.result.mp;

          if (enemyHP < 1 || playerHP < 1) {
            if (enemyHP < 1) {
              enemy.attr('src', enemy.attr('src').replace('-alive', '-dead'));
              enemy.addClass('dead').removeClass('alive');
              enemyHP = 0;
              message.text('You win!');

              if (playerHP > 1 && enemyHP < 1) {
                fightAgain.fadeIn();
              }
            } else {
              player.attr('src', player.attr('src').replace('-alive', '-dead'));
              player.addClass('dead').removeClass('alive');
              playerHP = 0;
              message.text('You lost :(');
            }
          }

          updateStats({
            player_hp: playerHP,
            enemy_hp: enemyHP,
            enemy_damage: enemyDamage,
            gold: gold,
            xp: xp,
            mp: mp
          });

          fightAction.fadeOut();
        });
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
        });
      }
    },
    addTool: function(self) {
      if (currentTools.find('li').length < 6) {
        var params = {
          tool: self.find('span').text()
        };

        $.post('/add_tool', params, function(data) {
          if (data.result.tool) {
            var toolItem = $('<li><img><span></span></li>');
            toolItem.find('img').attr('src', '/tools/' + data.result.tool.name.replace(/\s/, '_') + '.png');
            toolItem.find('span').text(data.result.tool.name);
            currentTools.append(toolItem);
            inventory.find('span').text(data.result.tool.name).parent().remove();
          };
        });
      }
    },
    removeTool: function(self) {
      if (currentTools.find('li').length > 1) {
        var params = {
          tool: self.find('span').text()
        };

        $.post('/remove_tool', params, function(data) {
          if (data.result.tool) {
            var toolItem = $('<li><img><span></span></li>');
            toolItem.find('img').attr('src', '/tools/' + data.result.tool.name.replace(/\s/, '_') + '.png');
            toolItem.find('span').text(data.result.tool.name);
            currentTools.find('span').text(data.result.tool.name).parent().remove();
            inventory.append(toolItem);
          };
        });
      }
    }
  };

  return self;
});
