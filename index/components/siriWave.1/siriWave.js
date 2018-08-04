var wave = require("./wave");

Component({
  ready() {
    new wave.SiriWave(
      {
        width: this.data.width,
        height: this.data.height,
        speed: 0.2,
        amplitude: 0.3,
        container: "siri",
        autostart: true
      },
      this
    );
  }
});
