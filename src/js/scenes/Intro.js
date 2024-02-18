import Phaser from 'phaser';
import { HandTracking, webcamGui } from '@new-objects/libs';
import packageJson from '../../../package.json';

export class Intro extends Phaser.Scene {
  constructor() {
    super('Intro');
    this._handTracking = null;
    this._hands = {
      left: {},
      right: {},
    };
    this._rects = { left: null, right: null };
    this._version = packageJson.version;
  }

  preload() {
    this.load.image('sky', 'assets/sky.png');

    this.load.spritesheet('fullscreenCtrl', 'assets/fullscreen.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.image('nextCtrl', 'assets/next.png');

    const { width, height } = this.sys.game.canvas;
    this._width = width;
    this._height = height;
  }

  create() {
    // Create a Text Game Object to display the version number
    this.add.text(10, 10, 'Version: ' + this._version, {
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#ffffff',
    });
    // switch scenes
    this.input.keyboard.once(
      'keydown-SPACE',
      () => {
        this.scene.start('Glockenspiel');
      },
      this,
    );

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

    this._rects.left = this.add.rectangle(
      this._width * 0.3,
      this._height * 0.2,
      50,
      50,
      0x0000ff,
    );
    this.physics.add.existing(this._rects.left);

    this._rects.right = this.add.rectangle(
      this._width * 0.7,
      this._height * 0.2,
      50,
      50,
      0x0000ff,
    );
    this.physics.add.existing(this._rects.right);

    // overlap of hands and ropes
    // this.physics.add.overlap(this.sprite, this.healthGroup, this.spriteHitHealth, null, this);
    this.physics.add.overlap(this._hands.left, this._rects.left);
    this.physics.add.overlap(this._hands.right, this._rects.right);

    this.nextBtn = this.add
      .image(this._width - 96, this._height - 16, 'nextCtrl', 0)
      .setOrigin(1)
      .setScale(0.05);

    this.fullscreenBtn = this.add
      .image(this._width - 16, this._height - 16, 'fullscreenCtrl', 0)
      .setOrigin(1, 1)
      .setInteractive();

    this.nextBtn.on(
      'pointerup',
      () => {
        console.log('----');
        this.scene.start('Glockenspiel');
      },
      this,
    );

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

    const lineLeft = new Phaser.Geom.Line(
      this._width * 0.3,
      this._height * 0.2,
      this._width * 0.3,
      this._height * 0.8,
    );
    const lineRight = new Phaser.Geom.Line(
      this._width * 0.7,
      this._height * 0.2,
      this._width * 0.7,
      this._height * 0.8,
    );

    const graphics = this.add.graphics({
      lineStyle: { width: 4, color: 0xaa00aa },
    });
    graphics.strokeLineShape(lineLeft);
    graphics.strokeLineShape(lineRight);

    HandTracking.initialize({
      hands: 2,
      width: this._width,
      height: this._height,
      webcamOptions: { video: { width: this._width, height: this._height } },
    }).then(tracker => {
      this._handTracking = tracker;

      // register resize action
      this.scale.on('resize', this.handleResize, this);

      // gui
      webcamGui();
    });
  }

  update() {
    if (!this._handTracking) return;

    // gesture and collision
    const results = this._handTracking.getHands(this._width, this._height);

    if (results.detected) {
      if (results.handLeft) {
        this._hands.left.setX(results.handLeft.x);
        this._hands.left.setY(results.handLeft.y);

        if (results.handLeft.gesture === 'Closed_Fist') {
          this._hands.left.fillColor = 0xffff00;
          this._rects.left.setY(results.handLeft.y);
        } else {
          this._hands.left.fillColor = 0xe4bfc8;
        }
      }

      if (results.handRight) {
        this._hands.right.setX(results.handRight.x);
        this._hands.right.setY(results.handRight.y);

        if (results.handRight.gesture === 'Closed_Fist') {
          this._hands.right.fillColor = 0xffff00;
          this._rects.right.setY(results.handRight.y);
        } else {
          this._hands.right.fillColor = 0xe4bfc8;
        }
      }
    }
  }

  handleResize(gameSize) {
    if (!window.webcam) return;

    this._width = gameSize.width;
    this._height = gameSize.height;

    // update cameras view
    this.cameras.resize(this._width, this._height);
  }
}

// const sprite = this.handSprites[hand.handName];
