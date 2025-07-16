import * as React from 'react';

// Tree View - now using vscode-tree-view web component
export const VSCodeTreeView: React.FC<React.PropsWithChildren<Record<string, never>>> = ({ children, ...props }) => {
    return React.createElement('vscode-tree-view', props, children);
};

// Tree Item - now using vscode-tree-item web component
interface VSCodeTreeItemProps {
    expanded?: boolean;
    id?: string;
    onClick?: (event: React.MouseEvent) => void;
    onKeyDown?: (event: React.KeyboardEvent) => void;
    onExpandedChanged?: (event: Event) => void;
    children?: React.ReactNode;
}

export const VSCodeTreeItem: React.FC<VSCodeTreeItemProps> = ({
    expanded,
    id,
    onClick,
    onKeyDown,
    onExpandedChanged,
    children,
    ...props
}) => {
    const handleExpandedChange = React.useCallback((event: Event) => {
        if (onExpandedChanged) {
            onExpandedChanged(event);
        }
    }, [onExpandedChanged]);

    React.useEffect(() => {
        const element = document.getElementById(id || '');
        if (element && onExpandedChanged) {
            element.addEventListener('expanded-change', handleExpandedChange);
            return () => {
                element.removeEventListener('expanded-change', handleExpandedChange);
            };
        }
    }, [id, handleExpandedChange, onExpandedChanged]);

    return React.createElement('vscode-tree-item', {
        expanded,
        id,
        onClick,
        onKeyDown,
        ...props
    }, children);
};

