import Phaser from 'phaser';
import { HandTracking, mergeObjects } from '@new-objects/libs';
import GUI from 'lil-gui';

export class Glockenspiel extends Phaser.Scene {
  ROPES_TOTAL = 5;

  constructor() {
    super('Glockenspiel');
    this._handTracking = null;
    this._hands = {
      left: {},
      right: {},
    };
    this.audioIsPlaying = false;
  }

  preload() {
    this.load.image('background', 'assets/Glockenspiel_BG.jpg');
    this.load.spritesheet('fullscreenCtrl', 'assets/fullscreen.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.image('rope', 'assets/Seil_Griff.png');
    this.load.image('hand', 'assets/bird.png');

    // audio
    this.load.audio('churchBell', 'assets/church-bell.mp3');

    this.load.audio('bell1', 'assets/bell_1.mp3');
    this.load.audio('bell2', 'assets/bell_2.mp3');
    this.load.audio('bell3', 'assets/bell_3.mp3');
    this.load.audio('bell4', 'assets/bell_4.mp3');
    this.load.audio('bell5', 'assets/bell_5.mp3');

    const { width, height } = this.sys.game.canvas;
    this._width = width;
    this._height = height;
  }

  create() {
    // switch scenes
    this.input.keyboard.once(
      'keydown-SPACE',
      () => {
        this.scene.start('Intro');
      },
      this,
    );
    this.churchBell = this.sound.add('churchBell', {
      loop: false,
      volume: 0.5,
    });
    const bell1 = this.sound.add('bell1', { loop: false, volume: 0.5 });
    const bell2 = this.sound.add('bell2', { loop: false, volume: 0.5 });
    const bell3 = this.sound.add('bell3', { loop: false, volume: 0.5 });
    const bell4 = this.sound.add('bell4', { loop: false, volume: 0.5 });
    const bell5 = this.sound.add('bell5', { loop: false, volume: 0.5 });

    this.bells = [bell1, bell2, bell3, bell4, bell5];

    this.background = this.add
      .image(0, 0, 'background')
      .setOrigin(0)
      .setDisplaySize(this._width, this._height);

    this.createRopes();

    // left hand
    this._hands.left = this.add.circle(
      this._width * 0.5,
      this._height * 0.5,
      20,
      0xe4bfc8,
    );
    this._hands.left.name = 'left';
    this._hands.left.setStrokeStyle(6, 0xe4bfc8);
    this.physics.add.existing(this._hands.left);

    // right hand
    this._hands.right = this.add.circle(
      this._width * 0.6,
      this._height * 0.5,
      20,
      0xe4bfc8,
    );
    this._hands.right.name = 'right';
    this._hands.right.setStrokeStyle(6, 0xe4bfc8);
    this.physics.add.existing(this._hands.right);

    // overlap of hands and ropes
    this.physics.add.overlap(this._hands.left, this.ropes);
    this.physics.add.overlap(this._hands.right, this.ropes);

    this.fullscreenBtn = this.add
      .image(this._width - 16, this._height - 16, 'fullscreenCtrl', 0)
      .setOrigin(1, 1)
      .setInteractive();

    this.fullscreenBtn.on(
      'pointerup',
      function () {
        if (this.scale.isFullscreen) {
          this.fullscreenBtn.setFrame(0);

          this.scale.stopFullscreen();
        } else {
          this.fullscreenBtn.setFrame(1);

          this.scale.startFullscreen();
        }
      },
      this,
    );
    /**
     * Hand-Tracking
     */

    HandTracking.initialize({
      hands: 2,
      width: this._width,
      height: this._height,
      webcamOptions: { video: { width: this._width, height: this._height } },
    }).then(tracker => {
      this._handTracking = tracker;

      // gui
      // !!! - (debug) - replaced it with my local variant
      webcamGui();
    });
  }

  update() {
    if (!this._handTracking) return;

    const results = this._handTracking.getHands(this._width, this._height);
    if (results.detected) {
      this.updateHand(results.handLeft, this._hands.left, 220);
      this.updateHand(results.handRight, this._hands.right, 320);
    }
  }

  updateHand(trackedHand, handObject, targetY) {
    if (trackedHand) {
      handObject.setX(trackedHand.x);
      handObject.setY(trackedHand.y);

      if (trackedHand.gesture === 'Closed_Fist') {
        handObject.fillColor = 0xffff00;

        const closestRope = this.selectClosestRope(handObject, this.ropes);
        closestRope.setY(trackedHand.y);

        if (!this.audioIsPlaying) {
          this.audioIsPlaying = true;
          closestRope.sample.play();
          setTimeout(() => {
            this.audioIsPlaying = false;
          }, 2000);

          this.tweens.add({
            targets: closestRope,
            x: closestRope.x,
            y: targetY,
            delay: 1500,
            duration: 1000,
            ease: 'Power2',
          });
        }
      } else {
        handObject.fillColor = 0xe4bfc8;
      }
    }
  }

  createRopes() {
    // create a group of ropes
    this.ropes = this.physics.add.staticGroup();

    for (let i = 0; i < this.ROPES_TOTAL; ++i) {
      // splits the width of the screen into equal parts
      const x = (this._width / (this.ROPES_TOTAL + 1)) * (i + 1);
      const y = Phaser.Math.Between(this._height * 0.8, this._height * 0.2);

      const rope = this.ropes.create(x, y, 'rope').setScale(0.5).setOrigin(1);
      rope.sample = this.bells[i % this.bells.length];
      rope.body.updateFromGameObject();
    }
  }

  updateRopes(width, height) {
    this.ropes.children.each((rope, idx) => {
      rope.x = (width / (this.ROPES_TOTAL + 1)) * (idx + 1);
      rope.y = Phaser.Math.Between(this._height * 0.2, this._height * -0.2);
    });
  }

  selectClosestRope(hand, ropes) {
    let closestRope = null;
    let _closestDist = Number.POSITIVE_INFINITY;

    this.ropes.children.each(rope => {
      const ropeBottomCenter = rope.getBottomCenter();
      const _dist = Phaser.Math.Distance.Between(
        hand.x,
        0,
        ropeBottomCenter.x,
        0,
      );
      if (_dist < _closestDist) {
        closestRope = rope;
        _closestDist = _dist;
      }
    });

    return closestRope;
  }

  handleGesture(trackedHand) {
    if (!trackedHand) return;

    const selectedHand =
      trackedHand.handName === 'handRight'
        ? this._hands.right
        : this._hands.left;

    selectedHand.gesture = trackedHand.gesture;
    selectedHand.setX(trackedHand.x);
    selectedHand.setY(trackedHand.y);
    selectedHand.body.reset(trackedHand.x, trackedHand.y);
  }
}

const webcamGui = () => {
  const resolution = {
    '1080p': {
      width: 1920,
      height: 1080,
    },
    '720p': {
      width: 1280,
      height: 720,
    },
    '450p': {
      width: 800,
      height: 450,
    },
    '360p': {
      width: 640,
      height: 360,
    },
  };
  const canavasEl = document.querySelector('canvas');
  const gui = new GUI();
  const config = {
    activeCamera: window.webcam.currentWebcam.label,
    backCamera: async () => {
      window.webcam.stop();
      window.webcam.startBack();
    },
    frontCamera: async () => {
      window.webcam.stop();
      window.webcam.startFront();
    },
    width: '720p',
    canvasOpacity: 1,
  };

  // switch active webcam
  gui
    .add(
      config,
      'activeCamera',
      window.webcam.allWebcams.map(cam => cam.label),
    )
    .name('Select camera')
    .onChange(value => window.webcam.changeByLabel(value));

  gui.add(config, 'backCamera').name('Switch to rear camera');
  gui.add(config, 'frontCamera').name('Switch to front camera');

  gui.add(config, 'Resolution', Object.keys(resolution)).onChange(value => {
    const newOptions = mergeObjects(window.webcam.webcamOptions, {
      video: {
        width: resolution[value].width,
        height: resolution[value].height,
      },
    });
    window.webcam.changeOptions(newOptions);
  });
  gui
    .add(config, 'canvasOpacity', 0, 1, 0.1)
    .name('Canvas opacity')
    .onChange(value => {
      canavasEl.style.opacity = value;
    });
};
