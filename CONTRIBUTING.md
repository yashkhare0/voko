# Contributing to voko

Thank you for your interest in contributing to `voko`! We welcome contributions from the community.

## Project Structure

- **`src/`**: Source code for the CLI tool.
- **`site/`**: Source code for the documentation website.
- **`dist/`**: Compiled JavaScript files (generated).
- **`coverage/`**: Test coverage reports (generated).

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally.
3.  **Install dependencies**:
    ```bash
    npm install
    ```

## Development

### Building

To compile the TypeScript code:

```bash
npm run build
```

### Watching

To watch for changes and recompile automatically:

```bash
npm run dev
```

### Testing

To run the test suite:

```bash
npm test
```

To run tests with coverage:

```bash
npm run test:coverage
```

### Linting and Formatting

Ensure your code adheres to the project's style:

```bash
npm run lint
npm run format
```

## Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) to automate versioning and changelogs. Please format your commit messages as follows:

- `feat: description` - A new feature
- `fix: description` - A bug fix
- `docs: description` - Documentation only changes
- `style: description` - Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor: description` - A code change that neither fixes a bug nor adds a feature
- `perf: description` - A code change that improves performance
- `test: description` - Adding missing tests or correcting existing tests
- `chore: description` - Changes to the build process or auxiliary tools and libraries

Example:

```
feat: add support for Italian language
```

## Pull Request Process

1.  Create a new branch for your feature or fix: `git checkout -b my-feature`.
2.  Make your changes.
3.  Ensure tests pass: `npm test`.
4.  Commit your changes using the guidelines above.
5.  Push to your fork and submit a Pull Request.
6.  Wait for review and address any feedback.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
