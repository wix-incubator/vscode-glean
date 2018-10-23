<p align="center">
  <img src="https://github.com/wix/vscode-glean/blob/master/assets/github_logo.png?raw=true">
</p>

# VSCode Glean
> The extension provides refactoring tools for your React/Javascript/Typescript codebase



[![Build Status](https://travis-ci.org/wix/vscode-glean.svg?branch=master)](https://travis-ci.org/wix/vscode-glean)
[![](https://vsmarketplacebadge.apphb.com/version/wix.glean.svg)](https://marketplace.visualstudio.com/items?itemName=wix.glean)

The extension provides refactoring tools for your React codebase: extract JSX into a new component, convert Function to Stateful React Components and more! In addition, you can extract regular Javascript/Typescript code between files, while handling exporting the selected code from the old location and importing in the new one!

## Highlights
- Allows extracing JSX into new component as well as other React code refactoring options
- Moving code between files
- Typescript support
- ES2015 modules support
- CommonJS modules support
- Plain Text support

## Installation

Go to the link below and click `Install`.

[Visual Studio Code Market Place: Glean](https://marketplace.visualstudio.com/items?itemName=wix.glean)

## Features

### Extract to file

Select text and  either VSCode's code suggestion (aka "Lightbulb") or Command Pallet ('Extract to File' command) to extract the text.


![Example of Javascript Extraction](https://github.com/wix/vscode-glean/blob/master/assets/extract-to-file.gif?raw=true)


### JSX Support
#### Extracting JSX into a new Component
Glean allows easy extraction of JSX into new React components. Just select the JSX to extract, and Glean will handle all the rest:

- Generate Stateful or Stateless Component, such that the extracted JSX will continue to function.
- It will identify all inputs to the newly created component.
- Replace extracted JSX will newly created component, while providing it with all the props.

![Example of JSX extraction](https://github.com/wix/vscode-glean/blob/master/assets/extract-to-comp.gif?raw=true)

#### Converting Functional Component to Stateful Component

![Example of Stateless to Stateful Component Conversion](https://github.com/wix/vscode-glean/blob/master/assets/stateful-to-stateless.gif?raw=true)


#### Converting Stateful Component to Functional Component

![Example of Stateless to Stateful Component Conversion](https://github.com/wix/vscode-glean/blob/master/assets/stateless-to-stateful.gif?raw=true)

**WARNING!!! This refactoring will delete all Lifecycle methods and setState calls!**

#### Render Conditionally

![Example of Render Conditionally](https://github.com/wix/vscode-glean/blob/master/assets/glean-conditional.gif?raw=true)

## Configuration Options
#### glean.jsModuleSystem (Default: 'esm')
Determines how the selected code will be exported/imported. Valid options are 'esm' and 'commonjs'.

#### glean.jsFilesExtensions (Default: [ "js", "jsx", "ts", "tsx" ])
List of extensions of files that should be treated as javascript files. This determines whether or not the snippet will be exported and imported. The snippet will be treated as javascript only if the extension of both origin and target files appears in this list.

#### glean.switchToTarget (Default: false)
Determines whether VSCode should switch to target file after extracting.


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
* Go to VSCode debug sidebar
* Select `Extension` from the dropdown
* Hit `F5`

### Running Tests
* Go to VSCode debug sidebar
* Select `Extension Tests` from the dropdown
* Hit `F5`

