import { defineConfig } from 'astro/config';
import glsl from 'vite-plugin-glsl';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  vite: {
    plugins: [glsl()]
  },

  // site: 'https://kotivas.dev'
  site: 'https://kotivas.github.io',

  integrations: [sitemap()]
});