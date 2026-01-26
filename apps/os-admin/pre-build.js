// pre-build.js - Workaround for Next.js 14 pnpm SWC issue
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log(' Preparing Next.js 14 build for pnpm workspace...');

// Check if SWC packages exist
const swcPackages = [
  '@next/swc-win32-x64-msvc',
  '@swc/core',
  '@swc/helpers'
];

let missingPackages = [];

swcPackages.forEach(pkg => {
  try {
    require.resolve(pkg);
    console.log(` ${pkg} found`);
  } catch {
    missingPackages.push(pkg);
    console.log(`  ${pkg} not found, will create dummy`);
    
    // Create dummy package
    const pkgPath = path.join(__dirname, 'node_modules', pkg);
    if (!fs.existsSync(pkgPath)) {
      fs.mkdirSync(pkgPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(pkgPath, 'package.json'),
      JSON.stringify({
        name: pkg,
        version: '1.0.0',
        main: 'index.js',
        description: 'Dummy package for Next.js build'
      }, null, 2)
    );
    
    fs.writeFileSync(
      path.join(pkgPath, 'index.js'),
      'module.exports = {};'
    );
  }
});

if (missingPackages.length > 0) {
  console.log(` Created ${missingPackages.length} dummy SWC packages`);
}

console.log(' Ready for Next.js build');
