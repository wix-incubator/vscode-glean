## [5.2.2](https://github.com/wix/vscode-glean/compare/v5.2.1...v5.2.2) (2021-03-19)


### Bug Fixes

* **class-to-function:** Fixed conversion of class properties with function value. Fixes [#95](https://github.com/wix/vscode-glean/issues/95) ([e5177a1](https://github.com/wix/vscode-glean/commit/e5177a1c56cbb1291e09d35fc270bc6fcf929636))

## [5.2.1](https://github.com/wix/vscode-glean/compare/v5.2.0...v5.2.1) (2021-03-19)


### Bug Fixes

* **generla:** optional chaining support ([9ac114e](https://github.com/wix/vscode-glean/commit/9ac114ec15a478d53a0c6efc58ddb577e84f8554))

# [5.2.0](https://github.com/wix/vscode-glean/compare/v5.1.1...v5.2.0) (2021-03-19)


### Features

* **isJSX:** Add support for optional chainning ([7aa0826](https://github.com/wix/vscode-glean/commit/7aa082626c6a1a1c10f58006935d68bf1d68154d))

## [5.1.1](https://github.com/wix/vscode-glean/compare/v5.1.0...v5.1.1) (2021-01-06)


### Bug Fixes

* **class-to-functional:** fixd support for props distructuring. Fixes [#95](https://github.com/wix/vscode-glean/issues/95) ([060958c](https://github.com/wix/vscode-glean/commit/060958c738b573b235130375e6391685ce47f79b))

# [5.1.0](https://github.com/wix/vscode-glean/compare/v5.0.4...v5.1.0) (2020-12-14)


### Features

* **hooks-support:** BREAKING CHANGE:  Drop support to pre-hooks React versions ([9421b2f](https://github.com/wix/vscode-glean/commit/9421b2f0f7ebfcc2b5ca21edf8ca534c82e6bfbf))

## [5.0.4](https://github.com/wix/vscode-glean/compare/v5.0.3...v5.0.4) (2020-12-14)


### Bug Fixes

* **build:** all ([8e82121](https://github.com/wix/vscode-glean/commit/8e82121e0a7ea255f425bf3d64102b38477540a6))

## [5.0.3](https://github.com/wix/vscode-glean/compare/v5.0.2...v5.0.3) (2020-12-14)


### Bug Fixes

* **build:** config ([3a6e65e](https://github.com/wix/vscode-glean/commit/3a6e65e4fd2569cfa63ebfa0acf31f3bfbdfcc21))

## [5.0.2](https://github.com/wix/vscode-glean/compare/v5.0.1...v5.0.2) (2020-12-14)


### Bug Fixes

* **all:** improve react version detection ([a2db33f](https://github.com/wix/vscode-glean/commit/a2db33fc505d2287316c94016f4878dd268362f1))

## [5.0.1](https://github.com/wix/vscode-glean/compare/v5.0.0...v5.0.1) (2020-05-31)


### Bug Fixes

* **function-to-class:** Fix for wrap with useEffect refactoring relevancy detection. Closes [#113](https://github.com/wix/vscode-glean/issues/113) ([c273fdc](https://github.com/wix/vscode-glean/commit/c273fdc1befc08a2e880b3f6c793c12e1474a381))

# [5.0.0](https://github.com/wix/vscode-glean/compare/v4.21.1...v5.0.0) (2020-05-15)


### Features

* **v5:** New refactorings: wrap with useMemo, useCallback useEffect, rename state veriable ([#112](https://github.com/wix/vscode-glean/issues/112)) ([eba2954](https://github.com/wix/vscode-glean/commit/eba29546fc5430f7bbfc9e93a36baff79919366e))


### BREAKING CHANGES

* **v5:** Hooks support will now be activated automatically based on React version (16.8 and up) instead of a flag

* feat(rename-state-variable): New Refactoring! Rename State Variable

* feat(hooks-support): activate hooks support based on react version

* removed excess deps

* refactoring + wrap with effect refactoring

* feat(wrap-with-useCallback): New refactoring - wrap function with useCallback

* ts fix

* feat(wrap-with-usememo): New! Wrap expressions with useMemo

* docs: updated teh docs

* fix(wrap-with-memo): improved case detection

* docs: added new refactorings

* docs

* docs

## [4.21.1](https://github.com/wix/vscode-glean/compare/v4.21.0...v4.21.1) (2020-04-05)


### Bug Fixes

* **build:** updated travis setup ([efe0d8b](https://github.com/wix/vscode-glean/commit/efe0d8b3bb342bb3a32963c54540a848c9378ae0))

# [4.21.0](https://github.com/wix/vscode-glean/compare/v4.20.1...v4.21.0) (2020-04-05)


### Features

* **general:** auto import missing dependencies ([3d506cc](https://github.com/wix/vscode-glean/commit/3d506ccd02a621bb6b08637abd3928c3cad32e6a))

## [4.20.1](https://github.com/wix/vscode-glean/compare/v4.20.0...v4.20.1) (2020-03-14)


### Bug Fixes

* **conditional:** fixed wrapping with JSX expression when selection nested within JSX element. Fixes [#105](https://github.com/wix/vscode-glean/issues/105) ([65393db](https://github.com/wix/vscode-glean/commit/65393db2d273c1b50fc1149f62efaf3c18f5226e))

# [4.20.0](https://github.com/wix/vscode-glean/compare/v4.19.1...v4.20.0) (2020-01-05)


### Features

* **config:** support default exports ([6e95589](https://github.com/wix/vscode-glean/commit/6e955899128ca23017f619fa9de2ddf6373d0a58))

## [4.19.1](https://github.com/wix/vscode-glean/compare/v4.19.0...v4.19.1) (2020-01-05)


### Bug Fixes

* **class-to-functional:** fixed prop coversion ([e133f0e](https://github.com/wix/vscode-glean/commit/e133f0e6eb3e21b322d767fdf73c83a243b6cb80))

# [4.19.0](https://github.com/wix/vscode-glean/compare/v4.18.5...v4.19.0) (2019-10-31)


### Features

* **class-to-functional:** added support for converting class properties into useRef. Closes  [#77](https://github.com/wix/vscode-glean/issues/77) ([f399b84](https://github.com/wix/vscode-glean/commit/f399b84))

## [4.18.5](https://github.com/wix/vscode-glean/compare/v4.18.4...v4.18.5) (2019-10-31)


### Bug Fixes

* **class-to-functional:** useState calls not generated if no default is set ([d2de1cd](https://github.com/wix/vscode-glean/commit/d2de1cd))

## [4.18.4](https://github.com/wix/vscode-glean/compare/v4.18.3...v4.18.4) (2019-10-30)


### Bug Fixes

* **deployment:** fix ([061e324](https://github.com/wix/vscode-glean/commit/061e324))
* **deployment:** travis-ci config ([fa27c74](https://github.com/wix/vscode-glean/commit/fa27c74))

## [4.18.3](https://github.com/wix/vscode-glean/compare/v4.18.2...v4.18.3) (2019-10-30)


### Bug Fixes

* **config:** travis ci ([3bea081](https://github.com/wix/vscode-glean/commit/3bea081))
* **deploymet:** fix ([09ddfa2](https://github.com/wix/vscode-glean/commit/09ddfa2))

## [4.18.2](https://github.com/wix/vscode-glean/compare/v4.18.1...v4.18.2) (2019-10-30)


### Bug Fixes

* **config:** travisci ([52d3423](https://github.com/wix/vscode-glean/commit/52d3423))
* **config:** travisci ([900a215](https://github.com/wix/vscode-glean/commit/900a215))

## [4.18.1](https://github.com/wix/vscode-glean/compare/v4.18.0...v4.18.1) (2019-10-30)


### Bug Fixes

* **class-to-functional:** fixed return value of a generated state producer ([f0be91d](https://github.com/wix/vscode-glean/commit/f0be91d))

# [4.18.0](https://github.com/wix/vscode-glean/compare/v4.17.0...v4.18.0) (2019-10-30)


### Bug Fixes

* **class-to-functional:** fixed returned value from functional state producers ([74f4a15](https://github.com/wix/vscode-glean/commit/74f4a15))


### Features

* **class-to-functional:** support for functional state updates ([#86](https://github.com/wix/vscode-glean/issues/86)) ([6c6fa06](https://github.com/wix/vscode-glean/commit/6c6fa06))

# [4.17.0](https://github.com/wix/vscode-glean/compare/v4.16.0...v4.17.0) (2019-10-29)


### Features

* **class-to-functional:** support for default state initialization through class property ([5019116](https://github.com/wix/vscode-glean/commit/5019116))

# [4.16.0](https://github.com/wix/vscode-glean/compare/v4.15.2...v4.16.0) (2019-09-21)


### Bug Fixes

* **experiments:** update experiments settings schema in package.json ([#82](https://github.com/wix/vscode-glean/issues/82)) ([92066b5](https://github.com/wix/vscode-glean/commit/92066b5))


### Features

* **class-to-functional:** added ability to disable conversion warning ([a6a0789](https://github.com/wix/vscode-glean/commit/a6a0789))

## [4.15.2](https://github.com/wix/vscode-glean/compare/v4.15.1...v4.15.2) (2019-08-12)


### Bug Fixes

* **stateful-to-stateless:** fixed windows filepath ([a64aae1](https://github.com/wix/vscode-glean/commit/a64aae1))

## [4.15.1](https://github.com/wix/vscode-glean/compare/v4.15.0...v4.15.1) (2019-08-05)


### Bug Fixes

* **class-to-function:** Fixes [#75](https://github.com/wix/vscode-glean/issues/75) ([42b9493](https://github.com/wix/vscode-glean/commit/42b9493))

# [4.15.0](https://github.com/wix/vscode-glean/compare/v4.14.0...v4.15.0) (2019-07-16)


### Features

* **class-to-functional:** useCallback support for non-lifecycle methods ([be3301b](https://github.com/wix/vscode-glean/commit/be3301b))

# [4.14.0](https://github.com/wix/vscode-glean/compare/v4.13.0...v4.14.0) (2019-07-16)


### Features

* **class-to-functional:** useCallback support for non-lifecycle methods ([9910ed8](https://github.com/wix/vscode-glean/commit/9910ed8))

# [4.13.0](https://github.com/wix/vscode-glean/compare/v4.12.0...v4.13.0) (2019-07-16)


### Features

* **class-to-functional:** useCallback support for non-lifecycle methods ([cc82df7](https://github.com/wix/vscode-glean/commit/cc82df7))

# [4.12.0](https://github.com/wix/vscode-glean/compare/v4.11.0...v4.12.0) (2019-07-10)


### Features

* **class-to-functional:** add useCallback support when transforming non-lifecycle methods ([7f75267](https://github.com/wix/vscode-glean/commit/7f75267))

# [4.11.0](https://github.com/wix/vscode-glean/compare/v4.10.3...v4.11.0) (2019-05-10)


### Features

* **general:** Disabled the extension for plain text files ([#70](https://github.com/wix/vscode-glean/issues/70)) ([db119ef](https://github.com/wix/vscode-glean/commit/db119ef))

## [4.10.3](https://github.com/wix/vscode-glean/compare/v4.10.2...v4.10.3) (2019-04-23)


### Bug Fixes

* **general:** Fixes [#66](https://github.com/wix/vscode-glean/issues/66) ([8d104f4](https://github.com/wix/vscode-glean/commit/8d104f4))

## [4.10.2](https://github.com/wix/vscode-glean/compare/v4.10.1...v4.10.2) (2019-04-09)


### Bug Fixes

* **stateful-to-stateless:** Fixes [#43](https://github.com/wix/vscode-glean/issues/43) ([6d12723](https://github.com/wix/vscode-glean/commit/6d12723))

## [4.10.1](https://github.com/wix/vscode-glean/compare/v4.10.0...v4.10.1) (2019-03-28)


### Bug Fixes

* **class-to-function:** changed the labels of refactorings ([d2848ee](https://github.com/wix/vscode-glean/commit/d2848ee))

# [4.10.0](https://github.com/wix/vscode-glean/compare/v4.9.0...v4.10.0) (2019-03-26)


### Bug Fixes

* **class-to-functional:** useState hook not added for state variables not inited or set ([32c71f6](https://github.com/wix/vscode-glean/commit/32c71f6))
* **extract-component:** incorrect handling of nested member expressions. Fixes [#62](https://github.com/wix/vscode-glean/issues/62) ([1840c64](https://github.com/wix/vscode-glean/commit/1840c64))


### Features

* **extract-component:** added extraction to the same file ([63911e7](https://github.com/wix/vscode-glean/commit/63911e7))

# [4.9.0](https://github.com/wix/vscode-glean/compare/v4.8.0...v4.9.0) (2019-03-11)


### Features

* **function-to-class:** defaultProps support ([c650f96](https://github.com/wix/vscode-glean/commit/c650f96))
* **function-to-class:** defaultProps support ([2bc5858](https://github.com/wix/vscode-glean/commit/2bc5858))

# [4.8.0](https://github.com/wix/vscode-glean/compare/v4.7.0...v4.8.0) (2019-03-11)


### Features

* **function-to-class:** defaultProps support ([c38683a](https://github.com/wix/vscode-glean/commit/c38683a))

# [4.7.0](https://github.com/wix/vscode-glean/compare/v4.6.0...v4.7.0) (2019-03-10)


### Features

* **functional-to-class:** default props support ([3cf1c65](https://github.com/wix/vscode-glean/commit/3cf1c65))

# [4.6.0](https://github.com/wix/vscode-glean/compare/v4.5.0...v4.6.0) (2019-02-15)


### Features

* **extract-component:** Allow extracting component to same file ([f012bda](https://github.com/wix/vscode-glean/commit/f012bda))

# [4.5.0](https://github.com/wix/vscode-glean/compare/v4.4.1...v4.5.0) (2019-02-06)


### Features

* **class-to-functional:** use FC instead of SFC type in hooks are enabled ([a97b963](https://github.com/wix/vscode-glean/commit/a97b963))

## [4.4.1](https://github.com/wix/vscode-glean/compare/v4.4.0...v4.4.1) (2019-02-06)


### Bug Fixes

* **stateful-to-stateless:** fix crash in case constructor doesnt have state init ([493ecd9](https://github.com/wix/vscode-glean/commit/493ecd9))

# [4.4.0](https://github.com/wix/vscode-glean/compare/v4.3.0...v4.4.0) (2019-02-06)


### Features

* **general:** Glean V5 with Hooks support BREAKING CHANGES ([f94f81f](https://github.com/wix/vscode-glean/commit/f94f81f))

# [4.3.0](https://github.com/wix/vscode-glean/compare/v4.2.5...v4.3.0) (2019-02-05)


### Features

* **general:** Glean V5 ([#61](https://github.com/wix/vscode-glean/issues/61)) ([5ad9a80](https://github.com/wix/vscode-glean/commit/5ad9a80))

## [4.2.5](https://github.com/wix/vscode-glean/compare/v4.2.4...v4.2.5) (2019-01-13)


### Bug Fixes

* **docs:** fixed the description in the market ([f6d8cf7](https://github.com/wix/vscode-glean/commit/f6d8cf7))

## [4.2.5](https://github.com/wix/vscode-glean/compare/v4.2.4...v4.2.5) (2019-01-13)


### Bug Fixes

* **docs:** fixed the description in the market ([f6d8cf7](https://github.com/wix/vscode-glean/commit/f6d8cf7))

## [4.2.5](https://github.com/wix/vscode-glean/compare/v4.2.4...v4.2.5) (2019-01-10)


### Bug Fixes

* **docs:** fixed the description in the market ([f6d8cf7](https://github.com/wix/vscode-glean/commit/f6d8cf7))

## [4.2.4](https://github.com/wix/vscode-glean/compare/v4.2.3...v4.2.4) (2019-01-06)


### Bug Fixes

* **stateless-to-stateful:** Closes [#50](https://github.com/wix/vscode-glean/issues/50) ([e555ff0](https://github.com/wix/vscode-glean/commit/e555ff0))

## [4.2.3](https://github.com/wix/vscode-glean/compare/v4.2.2...v4.2.3) (2018-11-08)


### Bug Fixes

* **stateless-to-stateful:** fixed crash when converting component with JSX behind logical opetator ([9427e5e](https://github.com/wix/vscode-glean/commit/9427e5e))

## [4.2.2](https://github.com/wix/vscode-glean/compare/v4.2.1...v4.2.2) (2018-11-06)


### Bug Fixes

* **export-component:** Windows 10 support ([96f875c](https://github.com/wix/vscode-glean/commit/96f875c))

## [4.2.1](https://github.com/wix/vscode-glean/compare/v4.2.0...v4.2.1) (2018-11-05)


### Bug Fixes

* **extract-component:** Fixed feature on Windows 10. Changed URI resolution API used to resolve path while using the refactoring ([29b808a](https://github.com/wix/vscode-glean/commit/29b808a))

# [4.2.0](https://github.com/wix/vscode-glean/compare/v4.1.0...v4.2.0) (2018-11-02)


### Features

* **stateless-to-stateful:** Type annotation can now be extracted from variable declaration annontation (SFC<T>) in addition to prop argument annotation ([8f572c3](https://github.com/wix/vscode-glean/commit/8f572c3))

# [4.1.0](https://github.com/wix/vscode-glean/compare/v4.0.7...v4.1.0) (2018-11-01)


### Features

* **stateful-to-stateless:** The type annotation of generated component will now use official React typings (SFC<T>) ([f7c27f8](https://github.com/wix/vscode-glean/commit/f7c27f8))

## [4.0.7](https://github.com/wix/vscode-glean/compare/v4.0.6...v4.0.7) (2018-10-31)


### Bug Fixes

* **extract-component:** the snippet will be wrapped with fragment only if it contains multiple lines ([24ff2b0](https://github.com/wix/vscode-glean/commit/24ff2b0))

## [4.0.6](https://github.com/wix/vscode-glean/compare/v4.0.5...v4.0.6) (2018-10-30)


### Bug Fixes

* **statless-to-stateful:** typescript annotation of props will be maintained when refactoring ([a6ac8a9](https://github.com/wix/vscode-glean/commit/a6ac8a9))

## [4.0.5](https://github.com/wix/vscode-glean/compare/v4.0.4...v4.0.5) (2018-10-30)


### Bug Fixes

* **stateless-to-stateful:** fixed crash when retun statement wasnt the first statement in function body ([e3bafd9](https://github.com/wix/vscode-glean/commit/e3bafd9))

## [4.0.4](https://github.com/wix/vscode-glean/compare/v4.0.3...v4.0.4) (2018-10-28)


### Bug Fixes

* **stateless-to-stateful:** faced component name becoming lowercase after applying the refactoring ([ac551b6](https://github.com/wix/vscode-glean/commit/ac551b6))

## [4.0.3](https://github.com/wix/vscode-glean/compare/v4.0.2...v4.0.3) (2018-10-25)


### Bug Fixes

* **stateless-to-stateful:** added support for rest operator in props ([b268951](https://github.com/wix/vscode-glean/commit/b268951))

## [4.0.2](https://github.com/wix/vscode-glean/compare/v4.0.1...v4.0.2) (2018-10-25)


### Bug Fixes

* **docs:** documentation fixes ([4cfe362](https://github.com/wix/vscode-glean/commit/4cfe362))

## [4.0.1](https://github.com/wix/vscode-glean/compare/v4.0.0...v4.0.1) (2018-10-24)


### Bug Fixes

* **configuration:** jsFilesExtensions type fix ([de7e878](https://github.com/wix/vscode-glean/commit/de7e878))
* **configuration:** jsFilesExtensions type fix ([602efce](https://github.com/wix/vscode-glean/commit/602efce))

# [4.0.0](https://github.com/wix/vscode-glean/compare/v3.3.4...v4.0.0) (2018-10-24)


### Bug Fixes

* **configuration:** fixed typo in configuration that caused a crash ([6aa25bc](https://github.com/wix/vscode-glean/commit/6aa25bc))


### BREAKING CHANGES

* **configuration:** changed configuration name for JS file extensions

## [3.3.4](https://github.com/wix/vscode-glean/compare/v3.3.3...v3.3.4) (2018-10-23)


### Bug Fixes

* **docs:** fixed docs ([5ff1737](https://github.com/wix/vscode-glean/commit/5ff1737))

## [3.3.3](https://github.com/wix/vscode-glean/compare/v3.3.2...v3.3.3) (2018-10-23)


### Bug Fixes

* **Stateless-to-Stateful:** Fix refactoring components declared through variable declaration. ([c936135](https://github.com/wix/vscode-glean/commit/c936135))

## [3.3.2](https://github.com/wix/vscode-glean/compare/v3.3.1...v3.3.2) (2018-10-08)


### Bug Fixes

* **deps:** updated vulnerable deps ([0393e45](https://github.com/wix/vscode-glean/commit/0393e45))

## [3.3.1](https://github.com/wix/vscode-glean/compare/v3.3.0...v3.3.1) (2018-08-14)


### Bug Fixes

* documentation ([879d314](https://github.com/wix/vscode-glean/commit/879d314))

# [3.3.0](https://github.com/wix/vscode-glean/compare/v3.2.9...v3.3.0) (2018-08-05)


### Features

* "Render Conditionally" command for JSX ([#16](https://github.com/wix/vscode-glean/issues/16)) ([ab8a7cf](https://github.com/wix/vscode-glean/commit/ab8a7cf))

## [3.2.9](https://github.com/wix/vscode-glean/compare/v3.2.8...v3.2.9) (2018-08-04)


### Bug Fixes

* **extract-component:** fixed component generation that includes instance references ([d6b240b](https://github.com/wix/vscode-glean/commit/d6b240b))

## [3.2.8](https://github.com/wix/vscode-glean/compare/v3.2.7...v3.2.8) (2018-07-26)


### Bug Fixes

* Avoid throwing exceptions to extension container on empty selection ([cc94be7](https://github.com/wix/vscode-glean/commit/cc94be7))

## [3.2.7](https://github.com/wix/vscode-glean/compare/v3.2.6...v3.2.7) (2018-07-25)


### Bug Fixes

* dummy commit to check if publishing was fixed ([ac18d6e](https://github.com/wix/vscode-glean/commit/ac18d6e))

## [3.2.6](https://github.com/wix-incubator/vscode-glean/compare/v3.2.5...v3.2.6) (2018-07-25)


### Bug Fixes

* Avoid throwing exceptions to extension container when selection is not parseable ([e4706b9](https://github.com/wix-incubator/vscode-glean/commit/e4706b9))

## [3.2.5](https://github.com/wix-incubator/vscode-glean/compare/v3.2.4...v3.2.5) (2018-07-24)


### Bug Fixes

* "Extract" operations in no-workspace scenario ([8f4c933](https://github.com/wix-incubator/vscode-glean/commit/8f4c933))
* Simpler and more resilient generation of component name from file name ([ee6c4d6](https://github.com/wix-incubator/vscode-glean/commit/ee6c4d6))

## [3.2.5](https://github.com/wix-incubator/vscode-glean/compare/v3.2.4...v3.2.5) (2018-07-24)


### Bug Fixes

* "Extract" operations in no-workspace scenario ([8f4c933](https://github.com/wix-incubator/vscode-glean/commit/8f4c933))
* Simpler and more resilient generation of component name from file name ([ee6c4d6](https://github.com/wix-incubator/vscode-glean/commit/ee6c4d6))

## [3.2.5](https://github.com/wix-incubator/vscode-glean/compare/v3.2.4...v3.2.5) (2018-07-24)


### Bug Fixes

* "Extract" operations in no-workspace scenario ([8f4c933](https://github.com/wix-incubator/vscode-glean/commit/8f4c933))

## [3.2.4](https://github.com/wix-incubator/vscode-glean/compare/v3.2.3...v3.2.4) (2018-07-05)


### Bug Fixes

* **statless-to-stateful:** Fixed [#14](https://github.com/wix-incubator/vscode-glean/issues/14) ([13431d3](https://github.com/wix-incubator/vscode-glean/commit/13431d3))

## [3.2.3](https://github.com/wix-incubator/vscode-glean/compare/v3.2.2...v3.2.3) (2018-07-02)


### Bug Fixes

* docs ([884d49f](https://github.com/wix-incubator/vscode-glean/commit/884d49f))

## [3.2.2](https://github.com/wix-incubator/vscode-glean/compare/v3.2.1...v3.2.2) (2018-07-02)


### Bug Fixes

* **docs:** added logo ([61ef292](https://github.com/wix-incubator/vscode-glean/commit/61ef292))

## [3.2.2](https://github.com/wix-incubator/vscode-glean/compare/v3.2.1...v3.2.2) (2018-07-02)


### Bug Fixes

* **docs:** added logo ([61ef292](https://github.com/wix-incubator/vscode-glean/commit/61ef292))

## [3.2.1](https://github.com/wix-incubator/vscode-glean/compare/v3.2.0...v3.2.1) (2018-07-02)


### Bug Fixes

* **docs:** added icon ([78a1470](https://github.com/wix-incubator/vscode-glean/commit/78a1470))

# [3.2.0](https://github.com/wix-incubator/vscode-glean/compare/v3.1.0...v3.2.0) (2018-07-01)


### Features

* trigger release ([afc516e](https://github.com/wix-incubator/vscode-glean/commit/afc516e))

# [3.1.0](https://github.com/wix-incubator/vscode-glean/compare/v3.0.5...v3.1.0) (2018-07-01)


### Features

* implementation for refactoring stateful to stateless component ([90a33a6](https://github.com/wix-incubator/vscode-glean/commit/90a33a6))

# [3.1.0](https://github.com/wix-incubator/vscode-glean/compare/v3.0.5...v3.1.0) (2018-07-01)


### Features

* implementation for refactoring stateful to stateless component ([90a33a6](https://github.com/wix-incubator/vscode-glean/commit/90a33a6))

## [3.0.5](https://github.com/wix-incubator/vscode-glean/compare/v3.0.4...v3.0.5) (2018-06-28)


### Bug Fixes

* **jsx:** Fixed [#13](https://github.com/wix-incubator/vscode-glean/issues/13) ([eaa9618](https://github.com/wix-incubator/vscode-glean/commit/eaa9618))

## [3.0.4](https://github.com/wix-incubator/vscode-glean/compare/v3.0.3...v3.0.4) (2018-06-28)


### Bug Fixes

* fixed code actions menu ([854494d](https://github.com/wix-incubator/vscode-glean/commit/854494d))

## [3.0.3](https://github.com/wix-incubator/vscode-glean/compare/v3.0.2...v3.0.3) (2018-06-27)


### Bug Fixes

* **docs:** generated CHANGELOG ([26daff1](https://github.com/wix-incubator/vscode-glean/commit/26daff1))
