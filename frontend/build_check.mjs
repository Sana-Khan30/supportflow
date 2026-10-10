import { build } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runViteBuild() {
  console.log('🚀 Starting Vite Production Build verification...');
  try {
    const result = await build({
      root: __dirname,
      configFile: path.resolve(__dirname, 'vite.config.js'),
    });
    console.log('✅ Vite build completed successfully! Production bundle is verified.');
  } catch (err) {
    console.error('❌ Vite build failed with error:', err);
    process.exit(1);
  }
}

runViteBuild();
