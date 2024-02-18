import Phaser from 'phaser';
import { HandTracking, webcamGui } from '@new-objects/libs';

export class Intro extends Phaser.Scene {
  constructor() {
    super('Intro');
    this._handTracking = null;
    this._hands = {
      left: {},
      right: {},
    };
    this._rects = { left: null, right: null };
  }

  preload() {
    this.load.image('sky', 'assets/sky.png');

    this.load.spritesheet('fullscreenCtrl', 'assets/fullscreen.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    const { width, height } = this.sys.game.canvas;
    this._width = width;
    this._height = height;
  }

  create() {
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
    this.physics.add.overlap(
      this._hands.left,
      this._rects.left,
      this.handleCollision,
      null,
      this,
    );
    this.physics.add.overlap(
      this._hands.right,
      this._rects.right,
      this.handleCollision,
      null,
      this,
    );

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

    // register resize action
    this.scale.on(
      'resize',
      gameSize => {
        const width = gameSize.width;
        const height = gameSize.height;

        this.cameras.resize(width, height);
      },
      this,
    );

    HandTracking.initialize({
      hands: 2,
      width: this._width,
      height: this._height,
      webcamOptions: { video: { width: this._width, height: this._height } },
    }).then(tracker => {
      this._handTracking = tracker;

      // register gesture handler
      this._handTracking.on('gestureDetected', this.handleGesture.bind(this));

      // register resize action
      this.scale.on('resize', this.handleResize, this);

      // gui
      // !!! - (debug) - replaced it with my local variant
      webcamGui();
    });
  }

  update() {
    if (!this._handTracking) return;

    this._handTracking.getHands(this._width, this._height);
  }

  handleResize(gameSize) {
    if (!window.webcam) return;

    this._width = gameSize.width;
    this._height = gameSize.height;

    // update fullscreen btn
    this.fullscreenBtn.x = this._width - 16;
    this.fullscreenBtn.y = this._height - 16;

    // update cameras view
    this.cameras.resize(this._width, this._height);

    window.webcam.changeOptions({
      video: { width: this._width, height: this._height },
    });
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

  handleCollision(hand, line) {
    // select the right hand with the name property of the sprite
    const selectedHand = this._hands[hand.name];
    const selectedRect = this._rects[hand.name];
    if (selectedHand.gesture === 'Closed_Fist') {
      hand.fillColor = 0xffff00;
      selectedRect.y = selectedHand.y;
      line.body.updateFromGameObject();
    } else {
      hand.fillColor = 0xe4bfc8;
    }
  }
}

// const sprite = this.handSprites[hand.handName];
