import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

export default class HandTracking {
  vision;
  tracker;
  result;

  constructor(options) {
    this.videoId = options?.videoEl ? options.videoEl : '#webcam';
    this.hands = options?.hands ? options.hands : 1;
    /** @type {HTMLVideoElement} */
    this.videoEl = document.querySelector(this.videoId);
    this.totalTime = 0;
    this.lastVideoTime = -1;

    this.#loadGestureRecognizer()
      .then(result => {
        /** @type {import('@mediapipe/tasks-vision').GestureRecognizerResult} */
        this.tracker = result;
        console.log('HandTracking initialized');
      })
      .then(() => {
        this.#initVideo();
        console.log('Video initialized');
      });
  }

  async #loadGestureRecognizer() {
    this.vision = await FilesetResolver.forVisionTasks(
      // path/to/wasm/root
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    );
    return GestureRecognizer.createFromOptions(this.vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task',
        delegate: 'GPU',
      },
      numHands: this.hands,
      runningMode: 'VIDEO',
    });
  }

  async #initVideo() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoEl.srcObject = stream;

      await new Promise(resolve => {
        this.videoEl.addEventListener(
          'loadedmetadata',
          () => {
            this.videoEl.play();
            resolve();
          },
          { once: true },
        );
      });
    } catch (err) {
      console.error(err);
    }
  }

  getResult() {
    if (!this.tracker) {
      return this;
    }
    if (this.videoEl.readyState !== this.videoEl.HAVE_ENOUGH_DATA) {
      return this;
    }

    this.result = this.tracker.recognizeForVideo(this.videoEl, Date.now());

    return this;
  }
}
