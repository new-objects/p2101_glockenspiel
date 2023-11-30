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
    this.load.image('rope', 'assets/Seil_einzeln2.png');
    this.load.image('handLeft', 'assets/bird.png');
    this.load.image('handRight', 'assets/bird.png');
  }

  create() {
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
    this.leftHandSprite = this.physics.add.sprite(250, 300, 'handLeft');
    this.leftHandSprite.setTint(0xff0000);
    // right hand
    this.rightHandSprite = this.physics.add.sprite(500, 300, 'handRight');

    // add collision between hands and ropes
    this.physics.add.collider(this.leftHandSprite, this.ropes, () => {
      console.log('hand and rope collision');
    });
    this.physics.add.collider(this.rightHandSprite, this.ropes, () => {
      console.log('hand and rope collision');
    });
  }

  update(_, delta) {
    this.totalTime += delta;

    // get hand tracking results
    /** @type {import('@mediapipe/tasks-vision').GestureRecognizerResult} */
    const trackedHandsMediapipe = this.handTracking.getResult().result;

    this.trackedHands = this.#parse(trackedHandsMediapipe);

    // update hand positions
    const { handLeft: leftHandTracked, handRight: rightHandTracked } =
      this.trackedHands ?? {};
    this.updateHandPosition(this.leftHandSprite, leftHandTracked);
    this.updateHandPosition(this.rightHandSprite, rightHandTracked);
  }

  updateHandPosition(hand, handData) {
    if (!handData) return;

    const { x, y } = handData;
    hand.setX(x);
    hand.setY(y);
    hand.body.reset(x, y);
  }

  #parse(modelData) {
    const hands = {};
    if (modelData && modelData.landmarks && modelData.landmarks.length > 0) {
      const { width } = this.game.config;

      modelData.handedness.forEach((hand, index) => {
        const handName =
          hand[0].categoryName === 'Left' ? 'handLeft' : 'handRight'; // left or right
        const { x, y } = modelData.landmarks[index][8];
        hands[handName] = {
          x: width - x * width || 0,
          y: y * width || 0,
        };
      });
    }

    return hands;
  }
}
