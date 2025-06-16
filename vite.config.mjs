import {resolve} from 'node:path';
import {defineConfig} from 'vite';
import pkg from './package.json' with {type: 'json'};

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/cbx-tree.mjs'),
      name: 'CbxTree',
      fileName: 'cbx-tree',
      formats: ['es'],
    },
    target: 'esnext',
    rollupOptions: {
      output: {
        entryFileNames: '[name].mjs',
        banner: `/*!
${pkg.name} v${pkg.version}
${pkg.homepage}
(c) ${new Date().getUTCFullYear()} ${pkg.author}
*/`,
      },
    },
    emptyOutDir: false,
  },
});
