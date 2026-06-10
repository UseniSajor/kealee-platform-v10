/**
 * Custom Jest test environment: jsdom with canvas stubbed.
 *
 * Problem: `canvas` is listed under pnpm neverBuiltDependencies so the
 * native binary (canvas.node) is never compiled. jsdom's utils.js does
 * `require("canvas")` at module-load time (not construction time), which
 * crashes before any Jest hook can intercept it via moduleNameMapper.
 *
 * Fix: pre-populate Node's Module._cache for canvas with an empty stub
 * BEFORE requiring jest-environment-jsdom (which triggers jsdom loading
 * utils.js and the broken require). Jest's custom testEnvironment files
 * are loaded on demand, so this file runs first.
 */

'use strict';

const Module = require('module');

try {
  const canvasPath = require.resolve('canvas');
  // Only stub if not already cached (e.g. first worker to load this)
  if (!Module._cache[canvasPath]) {
    Module._cache[canvasPath] = {
      id: canvasPath,
      filename: canvasPath,
      loaded: true,
      exports: {},
      parent: null,
      children: [],
      paths: [],
    };
  }
} catch {
  // canvas package not installed at all — nothing to stub
}

// NOW safe to load jest-environment-jsdom; jsdom/utils.js will find canvas
// already in Module._cache and use the stub instead of the native binary.
const { TestEnvironment } = require('jest-environment-jsdom');

class JsdomCanvasMockEnvironment extends TestEnvironment {}

module.exports = JsdomCanvasMockEnvironment;
