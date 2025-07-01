/** @type {import('vite').UserConfig} */

export default {
  server: {
    port: 1234,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  base: './',
  build: {
    outDir: './docs',
  },
};
