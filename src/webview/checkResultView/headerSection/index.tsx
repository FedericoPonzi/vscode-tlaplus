import * as React from 'react';
import { ModelCheckResult, SpecFiles } from '../../../model/check';
import { EmptyLine } from '../common';
import { vscode } from '../vscode';

import './index.css';

interface HeaderSectionI {checkResult: ModelCheckResult}
export const HeaderSection = React.memo(({checkResult}: HeaderSectionI) => {

    const stillRunning = checkResult.state === 'R';
    const disableShowOutput = !checkResult.showFullOutput;
    const specFiles = checkResult.specFiles as SpecFiles;

    return (
        <section>
            <div className="header-title">
                <h1> Status </h1>
                <div>
                    <vscode-button 
                        onClick={() => vscode.checkAgain()} 
                        appearance="primary" 
                        {...(stillRunning ? { disabled: true } : {})}>
                        Check again
                    </vscode-button>
                    <vscode-button 
                        onClick={() => vscode.showTlcOutput()} 
                        appearance="secondary" 
                        {...(disableShowOutput ? { disabled: true } : {})}>
                        Full output
                    </vscode-button>
                </div>
            </div>

            {specFiles && <div className="spec-line"> Checking {specFiles.tlaFileName} / {specFiles.cfgFileName} </div>}

            <div className="checking-state">
                <span className={`state-${checkResult.state}`}> {checkResult.stateName} </span>
                <span hidden={checkResult.state !== 'R'}>
                    (<vscode-link onClick={() => vscode.stopProcess()} href="#"> stop </vscode-link>)
                </span>
                <span hidden={ checkResult.statusDetails === undefined
                    || checkResult.statusDetails === null}>: {' ' + checkResult.statusDetails} </span>
            </div>

            <div className="timeInfo"> Start: {checkResult.startDateTimeStr}, end: {checkResult.endDateTimeStr} </div>

            <EmptyLine/>
            <vscode-divider/>
        </section>
    );
});
