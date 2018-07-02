<p align="center">
  <img src="assets/github_logo.png">
</p>

# VSCode Glean
> Extract Javascript/Typescript/JSX into a new or existing file.


[![Build Status](https://travis-ci.org/wix-incubator/vscode-glean.svg?branch=master)](https://travis-ci.org/wix-incubator/vscode-glean)
[![](https://vsmarketplacebadge.apphb.com/version/wix.glean.svg)](https://marketplace.visualstudio.com/items?itemName=wix.glean)

The extention allows extracting Javascript/Typescript/JSX into a new or existing file.
The extention automatically exports all exported declarations from target file and imports them in the origin file.
This is super useful while refactoring your code - just select the code you would like to extract and choose the destination.

Copying between non-js files is supported as well.




## Highlights
- Typescript support
- JSX Support (extract JSX strings into new components!)
- ES2015 modules support
- CommonJS modules support
- Plain Text support

Select text and  either VSCode's code suggestion (aka "Lightbulb") or Command Pallet ('Extract to File' command) to extract the text.


![Example of Javascript Extraction](https://media.giphy.com/media/5QI4abbeZqWpWN0nP8/giphy.gif)


## JSX Support
### Extracting JSX into a new Component
Glean allows easy extraction of JSX into new React components. Just select the JSX to extract, and Glean will handle all the rest:

- Generate Stateful or Stateless Component, such that the extracted JSX will continue to function.
- It will identify all inputs to the newly created component.
- Replace extracted JSX will newly created component, while providing it with all the props.

![Example of JSX extraction](https://media.giphy.com/media/22Q7TtNqCIqM7j8Ph6/giphy.gif)

### Converting Functional Component to Stateful Component

![Example of Stateless to Stateful Component Conversion](https://media.giphy.com/media/fipQDtl5shXdzxqPjB/giphy.gif)


### Converting Stateful Component to Functional Component

![Example of Stateless to Stateful Component Conversion](https://media.giphy.com/media/BHuT6tJuJGqldCTFGe/giphy.gif)

**WARNING!!! This refactoring will delete all Lifecycle methods and setState calls!**

## Configuration Options
#### glean.jsModuleSystem (Default: 'esm')
Determines how the selected code will be exported/imported. Valid options are 'esm' and 'commonjs'.

#### glean.jsFilesExtentions (Default: [ "js", "jsx", "ts", "tsx" ])
List of extentions of files that should be treated as javascript files. This determines whether or not the snippet will be exported and imported. The snippet will be treated as javascript only if the extention of both origin and target files appears in this list.

#### glean.switchToTarget (Default: false)
Determines whether VSCode should switch to target file after extracting.


## Contribute

Feel free to open issues or PRs!

### Getting started

In order to start working all you need to do is:
```sh
$ https://github.com/wix-incubator/vscode-glean
$ cd vscode-glean
$ npm install
$ code .
```

### Running Extention
* Go to VSCode debug sidebar
* Select `Extention` from the dropdown
* Hit `F5`

### Running Tests
* Go to VSCode debug sidebar
* Select `Extention Tests` from the dropdown
* Hit `F5`

