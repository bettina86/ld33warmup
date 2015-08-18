var height = 600;
var playerWidth = 32;
var playerHeight = 32;
var gravity = 0.8;
var speed = 8;
var jumpSpeed = 15;

Crafty.init(1024, height, document.getElementById('game'));

Crafty.c('Particle', {
  velocity: function(vx, vy) {
    this.bind('EnterFrame', function(e) {
      this.x += vx;
      this.y += vy;
      vy += gravity;
    });
    return this;
  },
});

Crafty.c('Explodable', {
  explode: function() {
    for (var y = 0; y < 4; y++) {
      for (var x = 0; x < 4; x++) {
        var particle = Crafty.e('2D, Canvas, Color, Particle')
            .attr({x: this.x + x * this.w / 4, y: this.y + y * this.h / 4, w: this.w / 4, h: this.h / 4})
            .color(this._red, this._green, this._blue)
            .velocity(5 * (x - 1.5), 5 * ( y - 1.5));

        for (var i = 0; i < 16; i++) {
          Crafty.e('2D, Canvas, Color, Trail')
              .trail(particle, 16, i);
        }
      }
    }
    this.destroy();
    return this;
  },
});

Crafty.c('Trail', {
  init: function() {
    var frame = 0;
    var alpha = 0;
    this.bind('EnterFrame', function() {
      frame++;
      if (this.entity_ && (frame - this.offset_) % this.frames_ == 0) {
        this.attr({x: this.entity_.x, y: this.entity_.y, w: this.entity_.w, h: this.entity_.h})
            .color(this.entity_._red, this.entity_._green, this.entity_._blue);

        alpha = 1;
      }
      alpha *= 0.8;
      this.color(this._red, this._green, this._blue, alpha);
    });
  },

  trail: function(entity, frames, offset) {
    this.entity_ = entity;
    this.frames_ = frames;
    this.offset_ = offset;
    this.entity_.bind('Remove', function() {
      this.entity_ = null;
    }.bind(this));
    return this;
  },
});

Crafty.c('Floor', {
  init: function() {
    this.addComponent('2D, Canvas, Color');
    this.color('#333333');
  },
});

Crafty.viewport.clampToEntities = false;

function random(min, max) {
  return min + Math.floor(max * Math.random());
}

function randomSign() {
  return Math.random() > 0.5 ? 1 : -1;
}

function jumpPossible(xgap, ygap) {
  xgap -= playerWidth;
  var t = xgap / currentSpeed();
  var y = t * (jumpSpeed - 0.5 * gravity * t);
  return y >= ygap;
}

var player;

function level() {
  return Math.floor(player.x / 3000);
}

function currentSpeed() {
  return speed + level();
}

function start() {
  player = Crafty.e('2D, Canvas, Color, Collision, Gravity, Twoway, Explodable')
      .attr({x: 0, y: height / 2, w: playerWidth, h: playerHeight})
      .gravity('Floor')
      .gravityConst(gravity)
      .twoway(0, jumpSpeed)
      .color('#dddddd')
      .bind('EnterFrame', function(e) {
        this.x += currentSpeed();
        if (this.y > height || this.hit('Floor').length > 0) {
          this.explode();
          Crafty.e('').timeout(restart, 1000);
        }
        Crafty.viewport.scroll('_x', -this.x + 150);
      });

  for (var i = 0; i < 16; i++) {
    Crafty.e('2D, Canvas, Color, Trail')
        .trail(player, 16, i);
  }

  var x = 0;
  var y = height / 2;
  for (var i = 0; i < 100; i++) {
    var w = (100 + 500 * Math.random()) | 0;
    if (i == 0) w = 500;
    Crafty.e('Floor').attr({x: x, y: y, w: w, h: height - y});
    do {
      var xgap = Math.random() > 0.5 ? random(playerWidth, 400) : 0;
      var ygap = randomSign() * random(playerHeight, 100);
    } while (!jumpPossible(xgap, ygap));
    xgap *= 1 - Math.pow(0.5, level() + 1);
    ygap *= 1 - Math.pow(0.5, level() + 1);
    xgap = Math.floor(xgap);
    ygap = Math.floor(ygap);
    x += w + xgap;
    y += ygap;
    if (y > height - 100) y = height - 100;
    if (y < 200) y = 200;
  }

  var prevLevel = -1;
  Crafty.e('').bind('EnterFrame', function() {
    if (prevLevel != level()) {
      var r = level() * 16;
      Crafty.background('rgba(' + r + ', 0, 0, 1)');
      prevLevel = level();
      if (prevLevel >= 0) {
        var q = 0;
        var text = Crafty.e('2D, DOM, Text')
            .attr({x: player.x, y: player.y})
            .text(level)
            .textFont({size: '32px'})
            .textColor('#dddddd')
            .bind('EnterFrame', function() {
              text.x = player.x + 8;
              text.y = player.y - q;
              q++;
            })
            .timeout(function() {
              text.destroy();
            }, 1000);
      }
    }
  });
}

function restart() {
  Crafty('*').destroy();
  start();
}

start();
