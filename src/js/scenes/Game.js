import Phaser from 'phaser';
import app from '../index';
import HandTracking from './game/HandTracking';

export default class Game extends Phaser.Scene {
  totalTime = 0;
  // init mediapipe hand tracking
  numHands = 2;
  handTracking = new HandTracking({ hands: this.numHands });
  height = app.config.height;
  width = app.config.width;
  level = 3;
  constructor() {
    super('game');
  }

  preload() {
    this.load.image('bg', 'assets/Glockenspiel_BG.jpg');
    this.load.spritesheet('fullscreen', 'assets/fullscreen.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.image('rope', 'assets/Seil_einzeln2.png');
    this.load.image('handLeft', 'assets/bird.png');
    this.load.image('handRight', 'assets/bird.png');
    this.load.audio('churchBell', 'assets/church-bell.mp3');
  }

  create() {
    this.churchBellFX = this.sound.add('churchBell', {
      loop: false,
      volume: 0.5,
    });
    this.add.image(400, 300, 'bg').setScale(0.5);

    // create a group of ropes
    this.ropes = this.physics.add.staticGroup();

    for (let i = 0; i < this.level; ++i) {
      // splits the width of the screen into equal parts
      const x = (this.width / (this.level + 1)) * (i + 1);
      const y = 20;

      /** @type {Phaser.Physics.Arcade.Sprite} */
      const rope = this.ropes.create(x, y, 'rope').setScale(0.5);
      /** @type {Phaser.Physics.Arcade.StaticBody} */
      const body = rope.body;
      body.updateFromGameObject();
    }

    // left hand
    this.leftHandSprite = this.add.circle(800 * 0.5, 600 * 0.5, 20, 0xe4bfc8);
    this.leftHandSprite.setStrokeStyle(6, 0xe4bfc8);

    this.physics.add.existing(this.leftHandSprite);
    // right hand
    this.rightHandSprite = this.add.circle(
      800 * 0.5 + 100,
      600 * 0.5,
      20,
      0xe4bfc8,
    );
    this.rightHandSprite.setStrokeStyle(6, 0xe4bfc8);

    this.physics.add.existing(this.rightHandSprite);

    // add collision between hands and ropes
    this.physics.add.collider(this.leftHandSprite, this.ropes, (_, rope) => {
      this.leftHandCollides = true;
      this.lastLeftHandRope = rope; // Store the collided rope
    });
    this.physics.add.collider(this.rightHandSprite, this.ropes, (_, rope) => {
      this.rightHandCollides = true;
      this.lastRightHandRope = rope; // Store the collided rope
    });

    const button = this.add
      .image(800 - 16, 16, 'fullscreen', 0)
      .setOrigin(1, 0)
      .setInteractive();

    button.on(
      'pointerup',
      function () {
        if (this.scale.isFullscreen) {
          button.setFrame(0);

          this.scale.stopFullscreen();
        } else {
          button.setFrame(1);

          this.scale.startFullscreen();
        }
      },
      this,
    );
  }

  update(_, delta) {
    this.totalTime += delta;

    // get hand tracking results
    /** @type {import('@mediapipe/tasks-vision').GestureRecognizerResult} */
    const trackedHandsMediapipe = this.handTracking.getResult().result;

    // map mediapipe results to game coordinates
    this.trackedHands = this.calculateCoordinates(trackedHandsMediapipe);

    // update hands
    const { handLeft: leftHandTracked, handRight: rightHandTracked } =
      this.trackedHands ?? {};
    this.updateHandPosition(this.leftHandSprite, leftHandTracked);
    this.updateHandPosition(this.rightHandSprite, rightHandTracked);

    if (
      leftHandTracked &&
      leftHandTracked.gesture &&
      leftHandTracked.gesture === 'Closed_Fist' &&
      this.leftHandCollides
    ) {
      console.log('left hand gesture', leftHandTracked.gesture);

      this.lastLeftHandRope.setY(this.leftHandSprite.y - 200);
      this.rightHandCollides = false;
      this.churchBellFX.play();

      this.tweens.add({
        targets: this.lastLeftHandRope,
        x: this.lastLeftHandRope.x,
        y: 20,
        delay: 1500, // Delay of 5 seconds
        duration: 1000, // Duration of the animation, e.g., 1 second
        ease: 'Power2', // Easing function for the animation
      });
    }

    if (
      rightHandTracked &&
      rightHandTracked.gesture &&
      rightHandTracked.gesture === 'Closed_Fist' &&
      this.rightHandCollides
    ) {
      console.log('right hand gesture', rightHandTracked.gesture);
      this.lastRightHandRope.setY(this.rightHandSprite.y - 200);
      this.rightHandCollides = false;
      this.churchBellFX.play();

      this.tweens.add({
        targets: this.lastRightHandRope,
        x: this.lastRightHandRope.x,
        y: 20,
        delay: 1500, // Delay of 5 seconds
        duration: 1000, // Duration of the animation, e.g., 1 second
        ease: 'Power2', // Easing function for the animation
      });
    }
  }

  updateHandPosition(hand, handData) {
    if (!handData) return;

    const { x, y } = handData;
    hand.setX(x);
    hand.setY(y);
    hand.body.reset(x, y);
  }

  calculateCoordinates(modelData) {
    const hands = {};
    if (modelData && modelData.landmarks && modelData.landmarks.length > 0) {
      const { width } = this.game.config;

      modelData.handedness.forEach((hand, index) => {
        const handName =
          hand[0].categoryName === 'Left' ? 'handLeft' : 'handRight'; // left or right
        const { x, y } = modelData.landmarks[index][8];
        const gesture = modelData.gestures[index][0].categoryName;
        hands[handName] = {
          x: width - x * width || 0,
          y: y * width || 0,
          gesture,
        };
      });
    }

    return hands;
  }
}
