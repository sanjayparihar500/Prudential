# Contributing to TOC test automation
The following is a set of guidelines for contributing to this repository. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Intellij Settings
See this [wiki page](https://github.scm.tripwire.com/tw-mp/automation-end-to-end-testing/wiki/Setting-up-project-in-Intellij) for instructions on setting up this project in Intellij

## Code Style
Current contributors to this repo will typically write code in the Intellij IDEA application. This app will automatically format Python and JavaScript to match the settings applied within the configuration. With the exception of tab size and indentation, we use default settings for code formatting. Please use 4 character indentation for JavaScript. To modify IntelliJ indentation settings go to File > Settings > Code Style then choose the language(s) you use and set the value in the Indent box appropriately. 

## JavaScript language version
Current contributors to this repo will typically write code in the Intellij IDEA application. This app provides warnings or errors in code based on the JavaScript language version selected in the configuration. Please set the version to ECMAScript 6 and uncheck Prefer Strict mode and Only type-based completion. Contributors who write code in a text editor will not need to worry about this setting. The codebase is a mix of varying JavaScript language versions already, so there will not be any enforcement of contributions to conform to a particular standard.

## Pull Requests
New contributors whom are not in the tw-mp organization will have to perform the following steps to get their code merged in:
  - Fork this repo into your own account
  - Create a new local branch for your contribution
  - After committing code and pushing the branch up to remote, create a Pull Request
  - The Pull Request text should follow this template:
    - The description should fit on one line, whose limit is 72 characters, and should accurately summarize the changes
    - The details of the changes should be preceded by `== DETAILS` text header
    - The details of your local testing should be preceded by `== TESTING` text header
  - Tag @xyin, @gwhorley, and @slee in your Pull Request
  - If the tagged individuals approve of the change, they will mark the Pull Request as accepted then merge the change in themselves
