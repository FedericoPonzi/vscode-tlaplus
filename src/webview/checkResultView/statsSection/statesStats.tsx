/// <reference path="../../vscode-elements.d.ts" />
import * as React from 'react';
import { InitialStateStatItem } from '../../../model/check';
import { DataGridCellDefault, DataGridCellHeader } from '../common';

interface StatesStatsI {stats: InitialStateStatItem[]}
export const StatesStats = React.memo(({stats}: StatesStatsI) => (
    <>
        <vscode-panel-tab id="stats-tab-1">States</vscode-panel-tab>
        <vscode-panel-view id="stats-view-1" className="max-width-fit-content">
            <vscode-data-grid aria-label="States statistics">
                <vscode-data-grid-row row-type="sticky-header">
                    {headerColumns.map((v, id) =>
                        <DataGridCellHeader
                            key={id}
                            id={id+1}
                            value={v.value}
                            alignRight={v.alignRight}
                            tooltip={v.tooltip}/>)}
                </vscode-data-grid-row>

                {stats.map((stat, index) =>
                    <vscode-data-grid-row key={index}>
                        <DataGridCellDefault id={1} value={stat.timeStamp} alignRight={false}/>
                        <DataGridCellDefault id={2} value={stat.diameter} alignRight={true}/>
                        <DataGridCellDefault id={3} value={stat.total} alignRight={true}/>
                        <DataGridCellDefault id={4} value={stat.distinct} alignRight={true}/>
                        <DataGridCellDefault id={5} value={stat.queueSize} alignRight={true}/>
                    </vscode-data-grid-row>)}
            </vscode-data-grid>
        </vscode-panel-view>
    </>
));

const headerColumns =
    [{
        value: 'Time', alignRight: false,
        tooltip: ''
    },
    {
        value: 'Diameter', alignRight: true,
        tooltip: 'The diameter of the reachable state graph'
    },
    {
        value: 'Found', alignRight: true,
        tooltip: 'The total number of states found so far'
    },
    {
        value: 'Distinct', alignRight: true,
        tooltip: 'The number of distinct states amoung all the states found'
    },
    {
        value: 'Queue', alignRight: true,
        tooltip: 'The number of states whose successor states have not been found yet'
    }];
