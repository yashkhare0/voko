# Deploying voko to npm

Follow these steps to publish your package to npm.

## Prerequisites

1.  **npm Account**: You need an account on [npmjs.com](https://www.npmjs.com/).
2.  **Login**: Run `npm login` in your terminal and follow the prompts.

## Steps

1.  **Build the project**:
    Ensure you have the latest build.

    ```bash
    npm run build
    ```

2.  **Update Version**:
    Update the version number in `package.json` if needed, or use:

    ```bash
    npm version patch # or minor, major
    ```

3.  **Publish**:
    Run the publish command.

    ```bash
    npm publish
    ```

    _Note: If this is the first time you are publishing a scoped package (e.g. `@yourname/voko`), you might need to add `--access public`._

4.  **Verify**:
    Check [npmjs.com](https://www.npmjs.com/) to see your package live!
