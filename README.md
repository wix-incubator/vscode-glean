<p align="center">
  <img src="https://github.com/wix/vscode-glean/blob/master/assets/github_logo.png?raw=true">
</p>

# VSCode Glean

> The extension provides refactoring tools for your React/Javascript/Typescript codebase

[![Build Status](https://travis-ci.org/wix/vscode-glean.svg?branch=master)](https://travis-ci.org/wix/vscode-glean)
[![](https://vsmarketplacebadge.apphb.com/version/wix.glean.svg)](https://marketplace.visualstudio.com/items?itemName=wix.glean)

The extension provides refactoring tools for your React codebase: extract JSX into a new component, convert Class Components to Functional Components and more! In addition, you can extract regular Javascript/Typescript code between files, while handling exporting the selected code from the old location and importing in the new one!

## Highlights

- Allows extracting JSX into new component
- Allows converting Class Components to Functional Components and vice-verse
- Allows wrapping JSX with conditional
- Moving code between files
- Typescript support
- ES2015 modules support
- CommonJS modules support

## Installation

Go to the link below and click `Install`.

[Visual Studio Code Market Place: Glean](https://marketplace.visualstudio.com/items?itemName=wix.glean)

## Features

### Extracting JSX into a new Component

Glean allows easy extraction of JSX into new React components. Just select the JSX to extract, and Glean will handle all the rest:

- Generate Stateful or Stateless Component, such that the extracted JSX will continue to function.
- It will identify all inputs to the newly created component.
- Replace extracted JSX with newly created component, while providing it with all the props.

![Example of JSX extraction](https://github.com/wix/vscode-glean/blob/master/assets/extract-to-comp.gif?raw=true)

### Converting Functional Component to Stateful Component

![Example of Stateless to Stateful Component Conversion](https://github.com/wix/vscode-glean/blob/master/assets/stateless-to-stateful.gif?raw=true)

### Converting Stateful Component to Functional Component

![Example of Stateful to Stateless Component Conversion](https://github.com/wix/vscode-glean/blob/master/assets/stateful-to-stateless.gif?raw=true)

**WARNING!!! This refactoring will delete all Lifecycle methods and setState calls!**

### Render Conditionally

![Example of Render Conditionally](https://github.com/wix/vscode-glean/blob/master/assets/glean-conditional.gif?raw=true)

### Extract to file

Select text and either VSCode's code suggestion (aka "Lightbulb") or Command Pallet ('Extract to File' command) to extract the text.

![Example of Javascript Extraction](https://github.com/wix/vscode-glean/blob/master/assets/extract-to-file.gif?raw=true)

## Experiments Features

All the experimental features are opt-in and need to be enabled through the configuration.

### Hooks Support for Class Component to Functional Component Refactoring

![Example of Hooks Support](https://github.com/wix/vscode-glean/blob/master/assets/hooks.gif?raw=true)

## Configuration Options

#### glean.jsModuleSystem (Default: 'esm')

Determines how the selected code will be exported/imported. Valid options are 'esm' and 'commonjs'.

#### glean.jsFilesExtensions (Default: [ "js", "jsx", "ts", "tsx" ])

List of extensions of files that should be treated as javascript files. This determines whether or not the snippet will be exported and imported. The snippet will be treated as javascript only if the extension of both origin and target files appears in this list.

#### glean.switchToTarget (Default: false)

Determines whether VSCode should switch to target file after extracting.

#### glean.experiments (Default: [])

A list of enabled experimental features. Available experimental features:

- "hooksForFunctionalComponents" - Hooks Support

#### glean.showConversionWarning (Default: true)

Determines whether VSCode should show conversion warning when converting Stateful Component to Functional Component.

## Contribute

Feel free to open issues or PRs!

### Getting started

In order to start working all you need to do is:

```sh
$ git clone git@github.com:wix/vscode-glean.git
$ cd vscode-glean
$ npm install
$ code .
```

### Running Extension

- Go to VSCode debug sidebar
- Select `Extension` from the dropdown
- Hit `F5`

### Running Tests

- Go to VSCode debug sidebar
- Select `Extension Tests` from the dropdown
- Hit `F5`

### Commit messages

Please refer to to the following [guide](https://marketplace.visualstudio.com/items?itemName=wix.glean).

