const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running root build script...');

// 1. Build client
console.log('📦 Installing client dependencies and building Vite app...');
execSync('npm install', { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });
execSync('npm run build', { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });

// 2. Ensure root dist directory exists and copy assets from client/dist to root dist
const clientDist = path.join(__dirname, 'client', 'dist');
const rootDist = path.join(__dirname, 'dist');

console.log(`📁 Copying built assets from ${clientDist} to ${rootDist}...`);
if (fs.existsSync(rootDist)) {
  fs.rmSync(rootDist, { recursive: true, force: true });
}
fs.cpSync(clientDist, rootDist, { recursive: true });

console.log('✅ Build completed successfully! Assets are ready in root /dist.');
