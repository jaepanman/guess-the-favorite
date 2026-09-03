const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const serverBundle = path.join(__dirname, 'dist', 'server.cjs');

if (!fs.existsSync(serverBundle)) {
  console.log('[start.cjs] dist/server.cjs not found. Running build automatically...');
  try {
    cp.execSync('npm run build', { stdio: 'inherit' });
  } catch (err) {
    try {
      cp.execSync('bun run build', { stdio: 'inherit' });
    } catch (bunErr) {
      console.error('[start.cjs] Build failed:', bunErr);
      process.exit(1);
    }
  }
}

// Start the production server
require(serverBundle);
