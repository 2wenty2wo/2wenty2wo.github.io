# Gridfinity Label Maker

## Overview

Gridfinity Label Maker is a static web application for designing and printing
labels sized for Gridfinity storage bins.  The app runs entirely in the browser
and relies on modern HTML, CSS, and JavaScript.  Bootstrap utilities provide a
responsive layout, while lightweight third-party libraries loaded from CDNs
handle optional QR code generation and label export.

The repository is structured as a traditional GitHub Pages site, making it easy
to host the tool directly from the `main` branch.

## Project Structure

```
├── index.html        # Application shell and UI markup
├── style.css         # Custom styling layered on Bootstrap defaults
├── js/
│   └── main.js       # Client-side logic for building and exporting labels
└── images/           # Icons used for favicons and progressive web app assets
```

## Building the Project

No build step is required.  All assets are committed in their final form and
referenced directly from `index.html`.  When making changes, open the HTML file
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

This project is available under the terms of the MIT License.  See
[`LICENSE`](LICENSE) for the full text.

## Change Log

Release history is tracked in [`CHANGELOG.md`](CHANGELOG.md) using the
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/) convention.  Refer to
that file for a detailed summary of notable updates.
