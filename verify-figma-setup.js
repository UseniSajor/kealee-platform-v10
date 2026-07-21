#!/usr/bin/env node

/**
 * FIGMA Design System Setup Verification
 * Verifies all setup files are in place and ready to execute
 */

const fs = require('fs');
const path = require('path');

// Simple color output without external dependency
const colors = {
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

// Configuration
const REQUIRED_FILES = {
  'figma-tokens.json': 'Design tokens in JSON format',
  'figma-setup-script.js': 'Automated setup script (requires Figma API)',
  'figma-plugin-manifest.json': 'Figma plugin manifest',
  'figma-plugin-code.js': 'Figma plugin code logic',
  'figma-plugin-ui.html': 'Figma plugin UI',
  'FIGMA_IMPLEMENTATION_GUIDE.md': 'Step-by-step implementation guide',
  'FIGMA_ICON_LIBRARY_SETUP.md': 'Icon library setup guide',
  'FIGMA_COMPLETE_SETUP_GUIDE.md': 'Complete end-to-end setup guide',
  'KEALEE_FIGMA_DESIGN_SPECIFICATION.md': 'Comprehensive design spec',
  'FIGMA_QUICK_START.md': 'Quick start guide',
  'FIGMA_SYSTEM_READY.md': 'System readiness summary',
  'FIGMA_INDEX.md': 'File index and navigation',
};

const TOKEN = 'FIGMA_TOKEN_REDACTED';

// Verification functions
function checkFileExists(filepath) {
  return fs.existsSync(filepath);
}

function readFileSize(filepath) {
  try {
    const stats = fs.statSync(filepath);
    return (stats.size / 1024).toFixed(2); // KB
  } catch {
    return 0;
  }
}

function verifyJsonFile(filepath) {
  try {
    JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    return true;
  } catch {
    return false;
  }
}

function validateTokenStructure() {
  try {
    const tokens = JSON.parse(fs.readFileSync('figma-tokens.json', 'utf-8'));
    const required = ['colors', 'typography', 'spacing', 'borderRadius', 'shadows', 'zIndex', 'breakpoints', 'motion', 'modules'];
    
    let valid = true;
    for (const key of required) {
      if (!tokens.hasOwnProperty(key)) {
        console.log(`  ${colors.red('✗')} Missing key: ${key}`);
        valid = false;
      }
    }
    
    if (valid) {
      console.log(`  ${colors.green('✓')} All required token categories present`);
    }
    return valid;
  } catch (err) {
    console.log(`  ${colors.red('✗')} Invalid JSON: ${err.message}`);
    return false;
  }
}

function runVerification() {
  console.log(`\n${colors.cyan('=')} FIGMA DESIGN SYSTEM SETUP VERIFICATION ${colors.cyan('=')}\n`);
  
  console.log(colors.yellow('🔍 Checking required files...\n'));
  
  let allFilesPresent = true;
  const fileStatus = {};
  
  for (const [filename, description] of Object.entries(REQUIRED_FILES)) {
    const exists = checkFileExists(filename);
    fileStatus[filename] = exists;
    
    if (exists) {
      const size = readFileSize(filename);
      console.log(`${colors.green('✓')} ${filename} (${size} KB)`);
      console.log(`  └─ ${colors.dim(description)}`);
    } else {
      console.log(`${colors.red('✗')} ${filename} ${colors.dim('(MISSING)')}`);
      allFilesPresent = false;
    }
    console.log('');
  }
  
  // Validate token structure
  console.log(colors.yellow('📋 Validating design tokens...\n'));
  const tokensValid = checkFileExists('figma-tokens.json') && validateTokenStructure();
  
  // Check setup script
  console.log(colors.yellow('🔧 Checking setup utilities...\n'));
  if (checkFileExists('figma-setup-script.js')) {
    console.log(`${colors.green('✓')} Setup script present`);
    console.log(`  ${colors.dim('Usage: node figma-setup-script.js <FILE_ID> <API_TOKEN>')}`);
  }
  
  if (checkFileExists('figma-plugin-manifest.json')) {
    console.log(`${colors.green('✓')} Figma plugin files ready`);
    console.log(`  ${colors.dim('Files: manifest.json, code.js, ui.html')}`);
  }
  console.log('');
  
  // Token check
  console.log(colors.yellow('🔐 Figma API Token Status\n'));
  console.log(`${colors.green('✓')} Token provided: ${TOKEN.substring(0, 15)}...`);
  console.log(`  ${colors.dim('Ready for: $ node figma-setup-script.js <FILE_ID> <TOKEN>')}`);
  console.log('');
  
  // Summary
  console.log(colors.cyan('=')+colors.cyan('='.repeat(60))+colors.cyan('\n'));
  
  if (allFilesPresent && tokensValid) {
    console.log(colors.green('✓ ALL SYSTEMS GO!\n'));
    console.log(colors.blue('Choose your setup method:\n'));
    console.log(`  ${colors.yellow('Option 1: Automated Setup (Fastest)')}`);
    console.log(`    └─ node figma-setup-script.js <FILE_ID> ${TOKEN}\n`);
    console.log(`  ${colors.yellow('Option 2: Figma Plugin')}`);
    console.log(`    └─ Load plugin in Figma → Run "Apply Design System"\n`);
    console.log(`  ${colors.yellow('Option 3: Manual Setup')}`);
    console.log(`    └─ Follow: FIGMA_COMPLETE_SETUP_GUIDE.md\n`);
  } else {
    console.log(colors.red('✗ SETUP INCOMPLETE\n'));
    console.log(colors.yellow('Missing files:'));
    for (const [file, present] of Object.entries(fileStatus)) {
      if (!present) console.log(`  - ${file}`);
    }
  }
  
  console.log(`\n${colors.dim('Documentation:')}`);
  console.log(`  📖 Design Spec: KEALEE_FIGMA_DESIGN_SPECIFICATION.md`);
  console.log(`  📖 Setup Guide: FIGMA_COMPLETE_SETUP_GUIDE.md`);
  console.log(`  📖 Icons Guide: FIGMA_ICON_LIBRARY_SETUP.md`);
  console.log(`  📖 Implementation: FIGMA_IMPLEMENTATION_GUIDE.md\n`);
  
  process.exit(allFilesPresent && tokensValid ? 0 : 1);
}

// Run verification
runVerification();
