# Contributing

Welcome! Thanks for your interest in helping to make the project better. Before making a contribution, please read through this document fully to be aware of what is expected. If you have any questions, please feel free to open an [issue](https://github.com/FrostCo/AdvancedProfanityFilter/issues/new), or reach out to the community on [Discord](https://discord.com/invite/MpE5Z3f).

Contributions to this project are released to the public under the [project's open source license](LICENSE). By participating in this project you agree to abide by its terms, and agree to donate your contributions to the project.

All contributors and community members should always be polite, courteous, and helpful. Please help to keep our community to be a welcoming one!

## Ways to Contribute

We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting an issue
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

Please reach out if you have any questions.

## Code Contributions (Pull Requests)

If you have any substantial changes that you would like to make, please [open an issue](https://github.com/FrostCo/AdvancedProfanityFilter/issues/new) so we can discuss it and avoid any wasted efforts.

1. [Fork](https://github.com/github/view_component/fork) and clone the repository
2. Install Node.js
3. Install needed dev dependencies: `npm install`
4. Create a new branch: `git checkout -b my-branch-name`
5. Run tests and make sure they are all passing: `npm run test`
6. Make your changes, add tests (if applicable)
7. Run tests again to make sure they still pass
8. Push to your fork and [submit a pull request](https://github.com/FrostCo/AdvancedProfanityFilter/compare)
9. Wait for your pull request to be reviewed, and be willing to answer questions or make adjustments as needed so that it can get merged

### Tips for a Good Review Process

- **Keep your changes focused.**  
  If you're making multiple unrelated changes, consider submitting them as separate pull requests. This makes reviews easier and helps isolate future regressions.

- **Adding a new feature?**  
  Please include a section in your pull request describing what should be added to the [main wiki page](https://github.com/FrostCo/AdvancedProfanityFilter/wiki).

- **Write tests when possible.**  
  This helps maintain confidence and stability in the project over time.

- **Write a clear and consistent commit message.**  
  We follow the [gitmoji](https://gitmoji.dev/) convention for commit messages. This keeps the commit history readable and easy to scan.

### Commit Message Format

You can use the [gitmoji-cli](https://www.npmjs.com/package/gitmoji-cli) to help write commits:

```bash
gitmoji -c
```

If you prefer not to install the CLI, follow this format (ignore the curly braces):

```txt
{emoji} ({scope}): {message}
```

**Example:**

```txt
✨ (filter): Add exact match method for words
```

### Commit Scopes

Use one of the following scopes when writing your commit message:

| Scope          | Description                                       |
| -------------- | ------------------------------------------------- |
| **audio**      | Audio muting feature                              |
| **background** | Background script behavior (lifecycle, messaging) |
| **build**      | Tooling for bundling, CI, or build output         |
| **config**     | Configuration changes and data migrations         |
| **dev**        | Development scripts, tooling, environment setup   |
| **docs**       | Documentation updates                             |
| **filter**     | Core filtering logic                              |
| **i18n**       | Translation/localization efforts                  |
| **misc**       | Catch-all for edge-cases, try to avoid overuse    |
| **options**    | Options/settings page logic/UI                    |
| **popup**      | Popup UI or behavior                              |
| **release**    | Changelog updates, version bumps, packaging       |
| **ui**         | Shared components, design changes, layout/styling |

## Releases

Releases are controlled by project maintainers and don't have a set schedule. Releases often happen when a milestone is reached, a new feature is ready to go, or a bug has been fixed.
