# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Placeholder for upcoming changes.

## [1.0.0] - 2025-09-20

### Added

- Introduced a Bootstrap-backed interface with a persistent light/dark theme toggle that updates browser theme
  colors and iOS status bar styling for home screen installs.
- Expanded the hardware catalog with connector, component, bearing, fuse, and custom label workflows, providing
  richer form controls and data sets in `index.html` and `js/` modules.
- Added dedicated print stylesheets, printable area calculations, and a print preview template to generate
  accurate hard-copy labels.
- Added a progressive web app manifest and icon set so the label maker installs cleanly on mobile devices.
- Added Jest coverage for the thread size population helper to prevent regressions in hardware selectors.

### Changed

- Rebuilt the JavaScript into modular state, form, event, rendering, and lazy loader layers to simplify
  maintenance and enable future enhancements.
- Refined the label preview experience with checkerboard backgrounds, QR code controls, sanitized download
  filenames, and clearer validation messaging.

### Fixed

- Improved focus outlines, live status announcements, and validation feedback to strengthen accessibility for
  keyboard and assistive technology users.
- Ensured download and print actions remain disabled until required details are supplied, preventing blank
  exports.

## [0.1.0] - 2025-09-20

### Added

- Project overview, build instructions, and local development guidance in `README.md`.
- MIT license text in `LICENSE`.
- Changelog scaffold capturing the current documentation baseline.

[Unreleased]: https://github.com/2wenty2wo/2wenty2wo.github.io/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/2wenty2wo/2wenty2wo.github.io/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/2wenty2wo/2wenty2wo.github.io/releases/tag/v0.1.0
