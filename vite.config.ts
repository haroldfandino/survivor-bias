import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Story files are authored as plain .ink and compiled to .json by
  // tools/build_story.mjs — see story/README.md. Raw .ink is never bundled.
  assetsInclude: ['**/*.ink'],
})
