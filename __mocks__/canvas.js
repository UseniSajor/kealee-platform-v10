// Stub for the `canvas` native module.
// The canvas package is listed under pnpm neverBuiltDependencies so the
// native binary is never compiled. jsdom optionally requires canvas for
// <canvas> element support; this stub prevents the load error in tests.
module.exports = {}
