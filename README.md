# VSCode Glean

The extention allows extracting Javascript/Typescript into a new or existing file.
The extention automatically exports all exported declarations from target file and imports them in the origin file.
For example, this is super useful during refactoring of your code - just select the code you would like to extract and choose the destination.
Copying between non-js files is supported aswell




## Features
- Typescript support
- ES2015 modules support
- CommonJS modules support
- Plain Text support

Select text and  either VSCode's code suggestion (aka "Lightbulb") or Command Pallet ('Extract to File' command) to extract the text.

![Image of Yaktocat](https://media.giphy.com/media/5QI4abbeZqWpWN0nP8/giphy.gif)

## Configuration Options
#### glean.jsModuleSystem (Default: 'esm')
Determines how the selected code will be exported/imported. Valid options are 'esm' and 'commonjs'.

#### glean.jsFilesExtentions (Default: [ "js", "jsx", "ts", "tsx" ])
List of extentions of files that should be treated as javascript files. This determines whether or not the snippet will be exported and imported. The snippet will be treated as javascript only if the extention of both origin and target files appears in this list.


