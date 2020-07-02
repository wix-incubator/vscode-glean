import * as vscode from 'vscode';
import * as path from 'path';
import { config } from './editor';

const ReactVersion = require('child_process').execSync('npm view react version').toString().trim().split('.').map(Number);

export const shouldBeConsideredJsFiles = (...files) => {
    const extentionsToBeConsideredJS = config().jsFilesExtensions;
    return files.every(file => extentionsToBeConsideredJS.includes(path.extname(file).replace('.', '')));
}

export const commonJSModuleSystemUsed = () => config().jsModuleSystem === 'commonjs'

const isExperimentOn = (experiment) => (config().experiments || []).includes(experiment);

export const hooksSupported = () => ReactVersion[0] >= 16 && ReactVersion[1] >= 8;

export const esmModuleSystemUsed = () => config().jsModuleSystem === 'esm';

export const shouldSwitchToTarget = () => config().switchToTarget;

export const shouldShowConversionWarning = () => config().showConversionWarning;

export const shouldUseExportDefault = () => config().useExportDefault;
