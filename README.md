<p align="center">
  <img src="https://github.com/wix/vscode-glean/blob/master/assets/github_logo.png?raw=true">
</p>

# VSCode Glean

> The extension provides refactoring tools for your React codebase

[![Build Status](https://travis-ci.org/wix/vscode-glean.svg?branch=master)](https://travis-ci.org/wix/vscode-glean)
[![](https://vsmarketplacebadge.apphb.com/version/wix.glean.svg)](https://marketplace.visualstudio.com/items?itemName=wix.glean)

The extension provides refactoring tools for your React codebase: extract JSX into a new component, convert Class Components to Functional Components, wrapping with Hooks and more!
## Highlights

- Allows extracting JSX into new component
- Allows converting Class Components to Functional Components and vice-verse
- Allows wrapping JSX with conditional
- Allows renaming state variables and their setters simultaneously.
- Allows wrapping code with `useMemo`, `useCallback` or `useEffect`
- Moving code between files
- Typescript support
- ES2015 modules support
- CommonJS modules support

## Installation

Go to the link below and click `Install`.

[Visual Studio Code Market Place: Glean](https://marketplace.visualstudio.com/items?itemName=wix.glean)

## Features

### Extracting JSX into a new Component

Glean allows easy extraction of JSX into new React components (in the same or other file). Just select the JSX to extract, and Glean will handle all the rest:

- Generate Class or Functional Component, such that the extracted JSX will continue to function.
- It will identify all inputs to the newly created component.
- Replace extracted JSX with newly created component, while providing it with all the props.

![Example of JSX extraction](https://github.com/wix/vscode-glean/blob/master/assets/extract-to-comp.gif?raw=true)

### Converting Class Component to Functional Component
Glean seamlesly automates convertion of class components to functional component, while take care of all the complexity:

- Converts `setState` calls to `useState`
- Converts `componentDidMount` and `componentWillUnmount` to `useEffect`
- Converts class properties to `useRef`
- Wraps call non-Lifecycle methods with `useCallback`

**WARNING!!! If You are using React version older than 16.8.0, This refactoring will delete all Lifecycle methods and setState calls!**

![Example of Hooks Support](https://github.com/wix/vscode-glean/blob/master/assets/hooks.gif?raw=true)



### Converting Functional Component to Class Component

![Example of Stateless to Stateful Component Conversion](https://github.com/wix/vscode-glean/blob/master/assets/stateless-to-stateful.gif?raw=true)

### Rename State Variable

Rename any state variable and let Glean rename its setter accordingly for You!

![Example of Rename State](https://github.com/wix/vscode-glean/blob/master/assets/rename-state.gif?raw=true)

### Wrap with Hook (useMemo, useCallback or useEffect)

![Example of Rename State](https://github.com/wix/vscode-glean/blob/master/assets/use-callback.gif?raw=true)

### Render Conditionally

![Example of Render Conditionally](https://github.com/wix/vscode-glean/blob/master/assets/glean-conditional.gif?raw=true)

### Extract to file

Select text and either VSCode's code suggestion (aka "Lightbulb") or Command Pallet ('Extract to File' command) to extract the text.

![Example of Javascript Extraction](https://github.com/wix/vscode-glean/blob/master/assets/extract-to-file.gif?raw=true)

## Configuration Options

#### glean.jsModuleSystem (Default: 'esm')

Determines how the selected code will be exported/imported. Valid options are 'esm' and 'commonjs'.

#### glean.jsFilesExtensions (Default: [ "js", "jsx", "ts", "tsx" ])

List of extensions of files that should be treated as javascript files. This determines whether or not the snippet will be exported and imported. The snippet will be treated as javascript only if the extension of both origin and target files appears in this list.

#### glean.switchToTarget (Default: false)

Determines whether VSCode should switch to target file after extracting.

#### glean.experiments (Default: [])

A list of enabled experimental features. Available experimental features:

#### glean.showConversionWarning (Default: true)

Determines whether VSCode should show conversion warning when converting Class Component to Functional Component.

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

