#!/usr/bin/env node

/**
 * Monorepo Health Check
 * Validates dependency consistency, detects circular dependencies, and verifies package integrity
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

// Find all package.json files
function findPackages() {
  const packages = [];
  const dirs = ['apps', 'packages', 'services', 'bots'];

  for (const dir of dirs) {
    const dirPath = path.join(rootDir, dir);
    if (!fs.existsSync(dirPath)) continue;

    for (const name of fs.readdirSync(dirPath)) {
      const pkgPath = path.join(dirPath, name, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          packages.push({
            name: pkg.name || name,
            dir: path.join(dir, name),
            pkgPath,
            dependencies: { ...pkg.dependencies, ...pkg.devDependencies },
          });
        } catch (e) {
          log(colors.yellow, `⚠️  Failed to parse ${pkgPath}:`, e.message);
        }
      }
    }
  }

  return packages;
}

// Check for duplicate dependencies within a package
function checkDuplicates(pkg) {
  const deps = pkg.dependencies || {};
  const devDeps = pkg.devDependencies || {};
  const seen = new Set();
  const issues = [];

  for (const [dep, version] of Object.entries(deps)) {
    if (seen.has(dep)) {
      issues.push(`Duplicate dependency: ${dep}`);
    }
    seen.add(dep);
    if (devDeps[dep]) {
      issues.push(`Dependency in both dependencies and devDependencies: ${dep}`);
    }
  }

  return issues;
}

// Detect circular dependencies
function detectCircularDeps(packages) {
  const pkgMap = new Map(packages.map(p => [p.name, p]));
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function visit(name, path = []) {
    if (recursionStack.has(name)) {
      const cycleStart = path.indexOf(name);
      if (cycleStart !== -1) {
        const cycle = [...path.slice(cycleStart), name];
        cycles.push(cycle);
      }
      return;
    }

    if (visited.has(name)) return;

    visited.add(name);
    recursionStack.add(name);

    const pkg = pkgMap.get(name);
    if (pkg && pkg.dependencies) {
      for (const dep of Object.keys(pkg.dependencies)) {
        if (dep.startsWith('@kealee/')) {
          visit(dep, [...path, name]);
        }
      }
    }

    recursionStack.delete(name);
  }

  for (const pkg of packages) {
    visit(pkg.name);
  }

  return cycles;
}

// Check version consistency
function checkVersionConsistency(packages) {
  const versionMap = new Map();
  const issues = [];

  for (const pkg of packages) {
    if (!pkg.dependencies) continue;

    for (const [dep, version] of Object.entries(pkg.dependencies)) {
      if (!versionMap.has(dep)) {
        versionMap.set(dep, new Map());
      }

      const versions = versionMap.get(dep);
      if (!versions.has(version)) {
        versions.set(version, []);
      }
      versions.get(version).push(pkg.name);
    }
  }

  for (const [dep, versions] of versionMap.entries()) {
    if (versions.size > 1) {
      let msg = `⚠️  Version inconsistency for ${dep}:`;
      for (const [version, packages] of versions) {
        msg += `\n     ${version}: ${packages.slice(0, 3).join(', ')}${packages.length > 3 ? ` (+${packages.length - 3})` : ''}`;
      }
      issues.push(msg);
    }
  }

  return issues;
}

// Main check
function main() {
  log(colors.blue, '\n🔍 MONOREPO HEALTH CHECK\n');

  const packages = findPackages();
  log(colors.green, `✅ Found ${packages.length} packages\n`);

  // Check 1: Duplicates
  log(colors.blue, '1️⃣  Checking for duplicate dependencies...');
  let duplicateCount = 0;
  for (const pkg of packages) {
    const issues = checkDuplicates(pkg);
    if (issues.length > 0) {
      log(colors.yellow, `   ${pkg.name}:`);
      for (const issue of issues) {
        log(colors.yellow, `     - ${issue}`);
        duplicateCount++;
      }
    }
  }
  if (duplicateCount === 0) {
    log(colors.green, '   ✅ No duplicate dependencies found\n');
  } else {
    log(colors.red, `   ❌ Found ${duplicateCount} duplicate issues\n`);
  }

  // Check 2: Circular dependencies
  log(colors.blue, '2️⃣  Checking for circular dependencies...');
  const cycles = detectCircularDeps(packages);
  if (cycles.length === 0) {
    log(colors.green, '   ✅ No circular dependencies found\n');
  } else {
    log(colors.red, `   ❌ Found ${cycles.length} circular dependency chains:`);
    for (const cycle of cycles) {
      log(colors.red, `      ${cycle.join(' → ')}`);
    }
    log(colors.reset, '');
  }

  // Check 3: Version consistency
  log(colors.blue, '3️⃣  Checking version consistency...');
  const versionIssues = checkVersionConsistency(packages);
  if (versionIssues.length === 0) {
    log(colors.green, '   ✅ All dependencies have consistent versions\n');
  } else {
    log(colors.yellow, `   ⚠️  Found ${versionIssues.length} version inconsistencies:`);
    for (const issue of versionIssues) {
      log(colors.yellow, `   ${issue}`);
    }
    log(colors.reset, '');
  }

  // Summary
  const hasErrors = duplicateCount > 0 || cycles.length > 0;
  if (hasErrors) {
    log(colors.red, '❌ MONOREPO HEALTH CHECK FAILED');
    process.exit(1);
  } else {
    log(colors.green, '✅ MONOREPO HEALTH CHECK PASSED');
    process.exit(0);
  }
}

main();
