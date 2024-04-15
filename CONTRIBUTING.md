# Contributing guide

## Overview

Hi, thank you for taking interest in contributing! Before contributing, please read the following guidelines:

- [Code of Conduct](CODE_OF_CONDUCT)
- [Pull request guidelines](#pull-request-guidelines)

If you have a question or want to chat, open [a new discussion](https://github.com/ghostrider-05/patreon-api.ts/discussions)!

### How to report a bug

> [!CAUTION]
> If you find a security vulnerability, do **NOT** open an issue. Email **info@ghostrider-05.com** instead.

1. [Create a new issue](https://github.com/ghostrider-05/patreon-api.ts/issues/new/choose) and choose the bug report template.
1. Submit all the information needed to reproduce the bug in the template
1. Answer questions if necessary. The report will be triaged and labelled accordingly.
1. (Optional) Create a new pull request that fixes the bug

### How to suggest a feature or enhancement

1. Check [open feature requests](https://github.com/ghostrider-05/patreon-api.ts/issues?q=is%3Aissue+is%3Aopen+label%3A%22feature+request%22) to see if your feature is not already suggested.
2. [Create a new issue](https://github.com/ghostrider-05/patreon-api.ts/issues/new/choose) and choose the feature request template.
3. Submit all the information needed to explain the feature in the template
4. Answer questions and discuss the implementation if necessary.
5. (Optional) Create a new pull request that implements the feature

## Pull request guidelines

> [!TIP]
> Pull requests don't have to improve the code. You can also add [how you use this wrapper](./examples/community.md) or [an example / template](./examples/)!

The following steps are recommended for creating a new pull request:

1. Create [a bug report](#how-to-report-a-bug) or [feature request](#how-to-suggest-a-feature-or-enhancement).
2. Install Git and Node.js v18+.
3. Fork the repository, clone locally and create a new branch on your fork.
4. Run `npm install` to install dependencies.
5. Implement the feature or bug fix on your branch.
6. Create a new pull request.
   * Make sure that the title of your pull request follows the [Semantic Version](https://semver.org/) standard.
   * If closing an issue, mention `closes #number` in the description of the pull request
   * Mention what changes and why it should be merged. Or link the related issue for more details.
7. Address comments and review suggestions.
8. Your pull request will be approved and merged. Thank you for contributing!
