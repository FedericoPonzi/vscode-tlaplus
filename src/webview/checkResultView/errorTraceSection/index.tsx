/// <reference path="../vscode-elements.d.ts" />

import * as React from 'react';
import { ModelCheckResult } from '../../../model/check';
import { ErrorTrace } from './errorTrace';

import './index.css';

interface ErrorTraceSectionI {checkResult: ModelCheckResult}
export const ErrorTraceSection = React.memo(({checkResult}: ErrorTraceSectionI) => {
    if (!checkResult.errors || checkResult.errors.length === 0) {
        return (null);
    }

    return (
        <section>
            <vscode-panels id="error-trace-panels">
                {checkResult.errors.map((error, index) => <ErrorTrace key={index} errorInfo={error} traceId={index}/>)}
            </vscode-panels>
        </section>
    );
});
