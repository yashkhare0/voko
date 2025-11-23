# Deploying voko to npm

This project uses an automated CI/CD pipeline for deployments, powered by GitHub Actions and [semantic-release](https://github.com/semantic-release/semantic-release).

## Prerequisites

To enable automated publishing, you need to configure the following secrets in your GitHub repository:

1.  **`NPM_TOKEN`**: An automation token from npm.
    - Go to [npmjs.com](https://www.npmjs.com/) -> Account -> Access Tokens.
    - Generate a new "Automation" token.
    - Add it to GitHub Secrets (Settings -> Secrets and variables -> Actions).

## Automated Deployment (Recommended)

Deployment is fully automated. You do **not** need to manually build or publish the package.

### How it works:

1.  **Push to `main`**: When code is pushed or merged into the `main` branch, the CI pipeline triggers.
2.  **Tests & Linting**: The pipeline first runs `npm test` and `npm run lint` to ensure code quality.
3.  **Semantic Release**: If tests pass, `semantic-release` analyzes the commit messages since the last release.
    - It determines the next version number based on Conventional Commits (e.g., `feat` -> minor, `fix` -> patch).
    - It generates a changelog.
    - It publishes the new version to npm.
    - It creates a GitHub Release.

## Manual Deployment (Not Recommended)

If you need to publish manually (e.g., for testing a pre-release), follow these steps:

1.  **Login to npm**:

    ```bash
    npm login
    ```

2.  **Build the project**:

    ```bash
    npm run build
    ```

3.  **Update Version**:

    ```bash
    npm version patch # or minor, major
    ```

4.  **Publish**:
    ```bash
    npm publish --access public
    ```
