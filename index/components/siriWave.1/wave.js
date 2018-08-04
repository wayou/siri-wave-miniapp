// adapted from https://github.com/kopiro/siriwavejs

var increment;

function SiriWave9Curve(opt) {
  this.controller = opt.controller;
  this.definition = opt.definition;
  this.tick = 0;

  this._respawn();
}

SiriWave9Curve.prototype._respawn = function() {
  this.amplitude = 0.3 + Math.random() * 0.7;
  this.seed = Math.random();
  this.openClass = (2 + Math.random() * 3) | 0;
};

SiriWave9Curve.prototype._ypos = function(i) {
  var p = this.tick;
  var y =
    -1 *
    Math.abs(Math.sin(p)) *
    this.controller.amplitude *
    this.amplitude *
    this.controller.cache.heightMax *
    Math.pow(1 / (1 + Math.pow(this.openClass * i, 2)), 2);

  if (Math.abs(y) < 0.001) {
    this._respawn();
  }

  return y;
};

SiriWave9Curve.prototype._draw = function(sign) {
  var ctx = this.controller.ctx;

  this.tick +=
    this.controller.speed * (1 - 0.5 * Math.sin(this.seed * Math.PI));

  ctx.beginPath();

  var xBase =
    this.controller.cache.width2 +
    (-this.controller.cache.width4 + this.seed * this.controller.cache.width2);
  var yBase = this.controller.cache.height2;

  var x, y;
  var xInit = null;

  for (var i = -3; i <= 3; i += 0.01) {
    x = xBase + i * this.controller.cache.width4;
    y = yBase + (sign || 1) * this._ypos(i);

    xInit = xInit || x;

    ctx.lineTo(x, y);
  }

  var height = Math.abs(this._ypos(0));

  // var gradient = ctx.createRadialGradient(xBase, yBase, height * 1.15, xBase, yBase, height * 0.3);
  var gradient = ctx.createCircularGradient(xBase, yBase, height * 1.15);
  gradient.addColorStop(0, "rgba(" + this.definition.color + ", 0.4)");
  gradient.addColorStop(1, "rgba(" + this.definition.color + ", 0.2)");
  // ctx.fillStyle = gradient;
  ctx.setFillStyle(gradient);

  ctx.lineTo(xInit, yBase);
  ctx.closePath();

  ctx.fill();
};

SiriWave9Curve.prototype.draw = function() {
  this._draw(-1);
  this._draw(1);
};

SiriWave9Curve.prototype.definition = [
  { color: "32,133,252" },
  { color: "94,252,169" },
  { color: "253,71,103" }
];

// Expose API

function SiriWave(opt, component) {
  opt = opt || {};
  this.component = component;

  this.phase = 0;
  this.run = false;
  this.cache = {};

  this.container = opt.container;

  this.width = opt.width || 240;
  this.height = opt.height || 320;
  // this.width = opt.width || window.getComputedStyle(this.container).width.replace('px', '');
  // this.height = opt.height || window.getComputedStyle(this.container).height.replace('px', '');
  this.ratio = 1;

  this.cache.width = this.ratio * this.width;
  this.cache.height = this.ratio * this.height;
  this.cache.height2 = this.cache.height / 2;
  this.cache.width2 = this.cache.width / 2;
  this.cache.width4 = this.cache.width / 4;
  this.cache.heightMax = this.cache.height2 - 4;

  // Constructor opt

  this.amplitude = opt.amplitude == undefined ? 1 : opt.amplitude;
  this.speed = opt.speed == undefined ? 0.2 : opt.speed;
  this.frequency = opt.frequency == undefined ? 6 : opt.frequency;
  if (Array.isArray(opt.color)) {
    this.color = this._hex2rgb(opt.color[0]);
  } else if (typeof opt.color === "string") {
    this.color = this._hex2rgb(opt.color);
  } else {
    this.color = this._hex2rgb("#fff");
  }

  // Interpolation

  this.speedInterpolationSpeed = opt.speedInterpolationSpeed || 0.005;
  this.amplitudeInterpolationSpeed = opt.amplitudeInterpolationSpeed || 0.05;

  this.cache.interpolation = {
    speed: this.speed,
    amplitude: this.amplitude
  };

  // Canvas

  // this.canvas = document.createElement('canvas');
  // this.ctx = this.canvas.getContext('2d');
  this.ctx = wx.createCanvasContext(this.container, this.component);
  // this.canvas.width = this.cache.width;
  // this.canvas.height = this.cache.height;

  // if (opt.cover) {
  // 	this.canvas.style.width = this.canvas.style.height = '100%';
  // } else {
  // 	this.canvas.style.width = (this.cache.width / this.ratio) + 'px';
  // 	this.canvas.style.height = (this.cache.height / this.ratio) + 'px';
  // }

  this.curves = [];

  var i = 0,
    j = 0;
  var colors = SiriWave9Curve.prototype.definition;
  for (; i < colors.length; i++) {
    for (j = 0; (j < 3 * Math.random()) | 0; j++) {
      this.curves.push(
        new SiriWave9Curve({
          controller: this,
          definition: colors[i]
        })
      );
    }
  }

  // Start
  // this.container.appendChild(this.canvas);
  if (opt.autostart) {
    this.start();
  }
}

SiriWave.prototype._hex2rgb = function(hex) {
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? parseInt(result[1], 16).toString() +
        "," +
        parseInt(result[2], 16).toString() +
        "," +
        parseInt(result[3], 16).toString()
    : null;
};

SiriWave.prototype._interpolate = function(propertyStr) {
  increment = this[propertyStr + "InterpolationSpeed"];

  if (
    Math.abs(this.cache.interpolation[propertyStr] - this[propertyStr]) <=
    increment
  ) {
    this[propertyStr] = this.cache.interpolation[propertyStr];
  } else {
    if (this.cache.interpolation[propertyStr] > this[propertyStr]) {
      this[propertyStr] += increment;
    } else {
      this[propertyStr] -= increment;
    }
  }
};

SiriWave.prototype._clear = function() {
  this.ctx.globalCompositeOperation = "destination-out";
  this.ctx.fillRect(0, 0, this.cache.width, this.cache.height);
  this.ctx.globalCompositeOperation = "source-over";
};

SiriWave.prototype._draw = function() {
  for (var i = 0, len = this.curves.length; i < len; i++) {
    this.curves[i].draw();
  }
  this.ctx.draw();
};

SiriWave.prototype._startDrawCycle = function() {
  if (this.run === false) return;
  this._clear();

  // Interpolate values
  this._interpolate("amplitude");
  this._interpolate("speed");

  this._draw();
  this.phase = (this.phase + Math.PI * this.speed) % (2 * Math.PI);

  // if (requestAnimationFrame) {
  // requestAnimationFrame(this._startDrawCycle.bind(this));
  // } else {
  setTimeout(this._startDrawCycle.bind(this), 20);
  // }
};

/* API */

SiriWave.prototype.start = function() {
  this.phase = 0;
  this.run = true;
  this._startDrawCycle();
};

SiriWave.prototype.stop = function() {
  this.phase = 0;
  this.run = false;
};

SiriWave.prototype.setSpeed = function(v, increment) {
  this.cache.interpolation.speed = v;
};

SiriWave.prototype.setAmplitude = function(v) {
  this.cache.interpolation.amplitude = Math.max(Math.min(v, 1), 0);
};

exports.SiriWave = SiriWave;
