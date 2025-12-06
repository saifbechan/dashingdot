/* eslint-disable @typescript-eslint/no-require-imports */
require('jest-canvas-mock');
const ResizeObserver = require('resize-observer-polyfill');

// @ts-expect-error - ResizeObserver polyfill type mismatch
global.ResizeObserver = ResizeObserver;
