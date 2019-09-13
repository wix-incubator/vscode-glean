import * as vscode from 'vscode';
import * as path from 'path';
import { config } from './editor';

export const shouldBeConsideredJsFiles = (...files) => {
    const extentionsToBeConsideredJS = config().jsFilesExtensions;
    return files.every(file => extentionsToBeConsideredJS.includes(path.extname(file).replace('.', '')));
}

export const commonJSModuleSystemUsed = () => config().jsModuleSystem === 'commonjs'

const isExperimentOn = (experiment) => (config().experiments || []).includes(experiment);

export const isHooksForFunctionalComponentsExperimentOn = () => isExperimentOn('hooksForFunctionalComponents');

export const esmModuleSystemUsed = () => config().jsModuleSystem === 'esm';

export const shouldSwitchToTarget = () => config().switchToTarget;

export const shouldShowConversionWarning = () => config().showConversionWarning;