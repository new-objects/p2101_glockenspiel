import { createServer } from 'vite';
import { tunnelmole } from 'tunnelmole';
import viteConfig from './vite.config.js';
import colors from 'colors';
import qrcode from 'qrcode';

// starting vite dev server
const viteServer = await createServer(viteConfig);
const startTime = process.hrtime();
await viteServer.listen();
const [seconds, nanoseconds] = process.hrtime(startTime);
const timeTaken = (seconds * 1000 + nanoseconds / 1e6).toFixed(0);

const port = viteServer.config.server.port;
console.log(
  `\n${colors.bgBlack('VITE')} ready in ${colors.green(timeTaken + ' ms')}\n`,
);
viteServer.printUrls();
viteServer.bindCLIShortcuts({ print: true });
console.log('\n');

// starting tunnelmole
let tunnelmoleUrl;
try {
  // XXX: tunnelmole is not handling errors properly
  tunnelmoleUrl = await tunnelmole({
    port,
  });
} catch (err) {
  console.error('Cannot reach tunnelmole. Offline? 🙃');
  console.log(err);
}

const qrcodeConfig = {
  type: 'terminal',
  small: true,
  color: {
    light: '#ffffff',
    dark: '#000000',
  },
};
console.log('\n');
qrcode.toString(tunnelmoleUrl, qrcodeConfig, (_, url) => {
  console.log(url);
});
