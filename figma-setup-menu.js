#!/usr/bin/env node

/**
 * FIGMA DESIGN SYSTEM - Interactive Implementation Menu
 * Choose your implementation path and get started
 */

const fs = require('fs');
const path = require('path');

// Color output without external dependencies
const colors = {
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

const TOKEN = 'FIGMA_TOKEN_REDACTED';

function clearScreen() {
  console.clear();
}

function printHeader() {
  console.log(`\n${colors.blue('=')} ${colors.bold('KEALEE PLATFORM - FIGMA DESIGN SYSTEM')} ${colors.blue('=')}\n`);
}

function printMenu() {
  clearScreen();
  printHeader();
  
  console.log(colors.yellow('Choose your implementation path:\n'));
  
  console.log(`${colors.green('1.')} ${colors.bold('AUTOMATED SETUP')} (Fastest - 10 minutes)`);
  console.log(`   ${colors.dim('Creates complete design system via API')}`);
  console.log(`   Includes: Colors, Typography, Components, Themes\n`);
  
  console.log(`${colors.green('2.')} ${colors.bold('FIGMA PLUGIN')} (Easy - 15 minutes)`);
  console.log(`   ${colors.dim('One-click setup with visual UI')}`);
  console.log(`   Load plugin → Click button → Done\n`);
  
  console.log(`${colors.green('3.')} ${colors.bold('MANUAL SETUP')} (Full Control - 6-8 hours)`);
  console.log(`   ${colors.dim('Step-by-step guide with full customization')}`);
  console.log(`   Best for learning and deep customization\n`);
  
  console.log(`${colors.green('4.')} ${colors.bold('VIEW DOCUMENTATION')}`);
  console.log(`   ${colors.dim('Read implementation guides')}\n`);
  
  console.log(`${colors.green('5.')} ${colors.bold('EXIT')}\n`);
  
  process.stdout.write(colors.blue('Choose (1-5): '));
}

function showAutomatedInstructions() {
  clearScreen();
  printHeader();
  
  console.log(colors.yellow('⚡ AUTOMATED SETUP INSTRUCTIONS\n'));
  
  console.log(colors.bold('STEP 1: Create Figma File'));
  console.log('  1. Go to figma.com');
  console.log('  2. Create new file');
  console.log('  3. Name: "Kealee Platform Design System"');
  console.log('  4. Copy URL and extract FILE_ID\n');
  
  console.log(colors.bold('STEP 2: Install Dependencies'));
  console.log(colors.cyan('  npm install axios\n'));
  
  console.log(colors.bold('STEP 3: Run Setup Script'));
  console.log(colors.cyan('  node figma-setup-script.js YOUR_FILE_ID ' + TOKEN + '\n'));
  
  console.log(colors.bold('STEP 4: Verify in Figma'));
  console.log('  1. Open Figma file');
  console.log('  2. Go to Assets panel');
  console.log('  3. Check for 32 colors + 13 text styles');
  console.log('  4. Success! ✅\n');
  
  console.log(colors.green('✓ Setup Report will be saved as: FIGMA_SETUP_REPORT.md\n'));
  
  process.stdout.write(colors.yellow('Ready? (yes/no): '));
}

function showPluginInstructions() {
  clearScreen();
  printHeader();
  
  console.log(colors.yellow('🎯 FIGMA PLUGIN INSTRUCTIONS\n'));
  
  console.log(colors.bold('STEP 1: Load Plugin in Figma'));
  console.log('  1. Open Figma desktop app');
  console.log('  2. Plugins → Development → New plugin');
  console.log('  3. Link existing code');
  console.log('  4. Select figma-plugin-manifest.json\n');
  
  console.log(colors.bold('STEP 2: Run Plugin'));
  console.log('  1. Plugins → Kealee Design System Manager');
  console.log('  2. Click "Apply Design System"');
  console.log('  3. Wait for completion');
  console.log('  4. Check Assets panel\n');
  
  console.log(colors.green('✓ All components generated automatically\n'));
  
  process.stdout.write(colors.yellow('Ready? (yes/no): '));
}

function showManualInstructions() {
  clearScreen();
  printHeader();
  
  console.log(colors.yellow('📖 MANUAL SETUP INSTRUCTIONS\n'));
  
  console.log(colors.bold('Read this guide step-by-step:'));
  console.log(colors.cyan('  FIGMA_COMPLETE_SETUP_GUIDE.md\n'));
  
  console.log(colors.bold('Timeline breakdown:'));
  console.log('  Phase 1: Setup & Variables (1 hour)');
  console.log('  Phase 2: Text Styles (1 hour)');
  console.log('  Phase 3: Components (2-3 hours)');
  console.log('  Phase 4: Module Themes (1-2 hours)');
  console.log('  Phase 5: Responsive Design (1 hour)');
  console.log('  Phase 6: Documentation (1 hour)');
  console.log('  Phase 7: Handoff (1 hour)\n');
  
  console.log(colors.green('✓ Total: 6-8 hours for complete system\n'));
  
  process.stdout.write(colors.yellow('Ready? (yes/no): '));
}

function showDocumentation() {
  clearScreen();
  printHeader();
  
  console.log(colors.yellow('📚 DOCUMENTATION AVAILABLE\n'));
  
  const docs = [
    { name: 'FIGMA_QUICK_START.md', time: '5 min', desc: 'Quick overview' },
    { name: 'FIGMA_COMPLETE_SETUP_GUIDE.md', time: '30 min', desc: 'Full end-to-end guide' },
    { name: 'KEALEE_FIGMA_DESIGN_SPECIFICATION.md', time: '45 min', desc: 'Complete design specs' },
    { name: 'FIGMA_IMPLEMENTATION_GUIDE.md', time: '20 min', desc: 'Phase-by-phase breakdown' },
    { name: 'FIGMA_ICON_LIBRARY_SETUP.md', time: '15 min', desc: 'Icon system guide' },
    { name: 'FIGMA_INDEX.md', time: '10 min', desc: 'File index & navigation' },
    { name: 'IMPLEMENTATION_PLAN.md', time: '10 min', desc: 'This implementation roadmap' },
  ];
  
  docs.forEach((doc, i) => {
    console.log(`${colors.green((i+1) + '.')} ${doc.name}`);
    console.log(`   ${colors.dim(doc.time + ' read')} - ${doc.desc}\n`);
  });
  
  process.stdout.write(colors.yellow('Back to menu? (yes/no): '));
}

function printSummary() {
  clearScreen();
  printHeader();
  
  console.log(colors.green('✅ SETUP COMPLETE!\n'));
  
  console.log(colors.bold('What\'s included:'));
  console.log('  ✓ 32 color styles');
  console.log('  ✓ 13 text styles');
  console.log('  ✓ 20+ component templates');
  console.log('  ✓ 10 module themes');
  console.log('  ✓ 160+ documentation pages');
  console.log('  ✓ Icon library (Lucide - 560+ icons)\n');
  
  console.log(colors.bold('Next steps:'));
  console.log('  1. Create your Figma file');
  console.log('  2. Run your chosen setup method');
  console.log('  3. Customize as needed');
  console.log('  4. Share with team\n');
  
  console.log(colors.yellow('Your Figma Token:'));
  console.log(colors.cyan('  ' + TOKEN + '\n'));
  
  console.log(colors.dim('For questions, see documentation files listed above.\n'));
}

// Read user input synchronously (simple approach)
const readline = require('readline');

function askQuestion(query) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    rl.question(query, answer => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function main() {
  let running = true;
  
  while (running) {
    printMenu();
    const choice = await askQuestion('');
    
    switch(choice) {
      case '1':
        showAutomatedInstructions();
        await askQuestion('');
        break;
      
      case '2':
        showPluginInstructions();
        await askQuestion('');
        break;
      
      case '3':
        showManualInstructions();
        await askQuestion('');
        break;
      
      case '4':
        showDocumentation();
        await askQuestion('');
        break;
      
      case '5':
        printSummary();
        running = false;
        break;
      
      default:
        console.log(colors.red('Invalid choice. Please try again.'));
        await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { colors, TOKEN };
