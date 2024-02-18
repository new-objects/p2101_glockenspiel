import '../css/style.css';

import Phaser from 'phaser';
import { Glockenspiel } from './scenes/Game';
import { Intro } from './scenes/Intro';

export default new Phaser.Game({
  type: Phaser.AUTO,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'game',
    width: '100%',
    height: '100%',
  },
  scene: [Intro, Glockenspiel],
});
