# Contributing to Gridfinity Label Maker

Thank you for your interest in improving the Gridfinity Label Maker! This guide
covers local development, project conventions, and how to propose changes.

## Local Development

The site is a static web application. No bundlers or build steps are required.

1. Clone the repository.
2. From the repository root, start a simple HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
3. Visit <http://localhost:8000> to explore and test your updates.

Any other static server (for example, `npx serve` or a local web server
extension) will also work.

## Development Workflow

To keep the `main` branch deployable at all times:

1. Create a new branch for each feature, bug fix, or modernization effort.
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

## Contribution Checklist

1. Fork the repository and create a branch for your contribution.
2. Follow the development workflow above to keep changes isolated.
3. Add or update documentation and tests where relevant.
4. Submit a pull request summarizing the changes and any notable impacts.

## Questions

Open a GitHub issue if you need clarification on the codebase or want to
propose a larger feature before implementation.
