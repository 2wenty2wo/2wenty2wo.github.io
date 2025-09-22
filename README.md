# Gridfinity Label Maker

## Overview

Gridfinity Label Maker is a static web application for designing and printing
labels sized for Gridfinity storage bins. The app runs entirely in the browser
and relies on modular JavaScript, modern HTML, and layered CSS for styling.
Bootstrap utilities provide responsive layout primitives, while lightweight
third-party libraries are lazy-loaded to power optional QR code generation and
image export.

Key capabilities exposed through `index.html` and the supporting scripts
include:

- Dark and light theme toggle with preference persistence.
- Hardware presets that reconfigure the form for screws, nuts, inserts, fuses,
  bearings, electronic components, and fully custom labels.
- Contextual validation and helper messaging that keep the preview in sync with
  selected options.
- Optional QR code content with automatic library loading only when needed.
- Download-and-print flows that use html2canvas to export the on-screen label
  preview.
- Shareable label URLs with Web Share API support and clipboard fallback.

The repository is structured as a traditional GitHub Pages site, making it easy
to host the tool directly from the `main` branch.

## Project Structure

```
├── index.html             # Application shell, form markup, and feature toggles
├── js/
│   ├── actions.js         # Shared action handlers invoked by UI events
│   ├── controls.js        # Entry point that bootstraps modules and listeners
│   ├── data.js            # Static measurements, presets, and asset lookups
│   ├── dom-elements.js    # Cached DOM references for easier querying
│   ├── events.js          # Wiring for form, download, and print events
│   ├── forms.js           # Field population, validation, and UI helpers
│   ├── lazy-loaders.js    # On-demand loading of html2canvas and QR libraries
│   ├── render.js          # Label preview updates and export orchestration
│   ├── state.js           # Centralized application state store
│   ├── theme.js           # Theme toggle behavior and persistence helpers
│   └── threadSizes.js     # Thread-size presets for hardware options
├── style.css              # Custom styling layered on Bootstrap defaults
├── style-print.css        # Print-specific overrides for labels
├── print.css              # Utility styles applied to print views
├── manifest.json          # Progressive Web App metadata
└── images/
    └── icons/             # Favicons and touch icons used across devices
```

## Building the Project

No build step is required. All assets are committed in their final form and
referenced directly from `index.html`. When making changes, open the HTML file
in a browser or serve the repository via a static file server to reflect your
updates.

## Running Locally

1. Clone the repository.
2. From the repository root, start a simple HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
3. Navigate to <http://localhost:8000> in your browser to use the tool.

Any other static server (for example, `npx serve` or a local web server
extension) will also work.

## Sharing Labels

Use the **Share** button next to Download and Print to generate a link that
captures the current label configuration. The helper serializes every relevant
state value—including hardware selections, measurements, toggles, QR content,
and custom imagery—into a compact base64 payload stored in the `label` query
parameter.

When supported, the app invokes the Web Share API so the link can be sent via
native share sheets on mobile and desktop. Browsers without Web Share support
fall back to copying the link to the clipboard and display a confirmation
message. Opening a shared URL pre-populates the form and preview so the label is
ready to review, print, or export without additional input.

## Development Workflow and Version Control Safeguards

To keep the `main` branch deployable at all times:

1. Create a new branch for each feature or modernization effort.
2. Commit and test your changes on the feature branch.
3. Open a pull request back to `main`, ensuring that reviews or automated checks
   pass before merging.

This workflow preserves a working reference point so that you can revert or
compare changes easily if something goes wrong.

## Deployment

Because the project is a static site, deployment can be as simple as pushing the
contents of the `main` branch to GitHub Pages or any static hosting provider.
When using GitHub Pages, ensure the publishing source is set to the `main`
branch (or `/docs` folder if you choose to relocate the site assets).

## Contributing

1. Fork the repository and create a branch for your contribution.
2. Follow the development workflow above to keep changes isolated.
3. Add or update documentation and tests where relevant.
4. Submit a pull request summarizing the changes and any notable impacts.

## License

This project is available under the terms of the MIT License. See
[`LICENSE`](LICENSE) for the full text.

## Change Log

Release history is tracked in [`CHANGELOG.md`](CHANGELOG.md) using the
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/) convention. Refer to
that file for a detailed summary of notable updates.
