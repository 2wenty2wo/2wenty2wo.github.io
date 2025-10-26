/**
 * Forms Module - Barrel Export
 *
 * This file re-exports all functions from the forms/ subdirectory modules
 * to maintain backward compatibility with existing code.
 *
 * The forms.js file has been split into logical modules:
 * - bearing-picker.js: Bearing type selection
 * - component-mount.js: Component mount type selection
 * - custom-part-picker.js: Custom part graphic selection
 * - forms-core.js: Core form handling (hardware types, electrical components, fuses, etc.)
 */

export * from './forms/index.js';
