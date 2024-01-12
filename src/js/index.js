import '../css/style.css';

import Phaser from 'phaser';
import Game from './scenes/Game';

export default new Phaser.Game({
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: true,
    },
  },
  scene: Game,
});
