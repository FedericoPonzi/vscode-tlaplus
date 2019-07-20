import * as vscode from 'vscode';

/**
 * Thrown when there's some problem with parsing.
 */
export class ParsingError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export function pathToUri(path: string): vscode.Uri {
    return vscode.Uri.parse('file://' + path);
}
