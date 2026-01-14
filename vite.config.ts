import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import esbuildPluginReactVirtualized from 'esbuild-plugin-react-virtualized';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/components/shared'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss"; @import "@/styles/colors.scss";`,
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://calendar.test.difft.org/',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  optimizeDeps: {
    esbuildOptions: {
      //https://github.com/bvaughn/react-virtualized/issues/1722#issuecomment-1911672178
      plugins: [esbuildPluginReactVirtualized],
    },
  },
});
