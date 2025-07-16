import * as React from 'react';
import { Position, Range } from 'vscode';
import { vscode } from './vscode';

export const EmptyLine = () => <div style={{marginTop: '1em'}}/>;

interface CodeRangeLinkI {line: string, filepath: string | undefined, range: Range}
export const CodeRangeLink = React.memo(({line, filepath, range}: CodeRangeLinkI) => (
    (!filepath || !range)
        ? <>{line}</>
        : <CodePositionLink line={line} filepath={filepath} position={range[0]}/>
));

interface CodePositionLinkI {line: string, filepath: string | undefined, position: Position | undefined}
export const CodePositionLink = React.memo(({line, filepath, position}: CodePositionLinkI) => {
    if (!filepath || !position) {
        return (<>{line}</>);
    }

    const location = {'line': position.line, 'character': position.character};
    const openFileAtLocation = () => vscode.openFile(filepath, location);
    return (<vscode-link onClick={openFileAtLocation}>{line}</vscode-link>);
});

interface DataGridCellI {
    id: number,
    value: React.JSX.Element | string | number,
    alignRight: boolean,
    tooltip?: string
}

export const DataGridCellHeader = React.memo(({id, value, alignRight, tooltip}: DataGridCellI) => (
    <vscode-data-grid-cell title={tooltip}
        cell-type="columnheader"
        grid-column={id.toString()}
        className={`${alignRight ? 'text-align-right' : ''} hidden-overflow-ellipsis`}>
        {value}
    </vscode-data-grid-cell>
));

export const DataGridCellDefault = React.memo(({id, value, alignRight, tooltip}: DataGridCellI) => (
    <vscode-data-grid-cell
        title={tooltip}
        cell-type="default"
        grid-column={id.toString()}
        className={`${alignRight ? 'text-align-right' : ''} hidden-overflow-ellipsis`}>
        {typeof value === 'number' ? num(value) : value}
    </vscode-data-grid-cell>
));

const num = (n: number) => Number(n).toLocaleString().split(',').join(' ');
