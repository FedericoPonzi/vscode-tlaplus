// TypeScript declarations for @vscode-elements/elements web components

declare namespace JSX {
  interface IntrinsicElements {
    'vscode-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      appearance?: 'primary' | 'secondary' | 'icon';
      disabled?: boolean;
      onClick?: (event: Event) => void;
    };
    
    'vscode-link': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      href?: string;
      onClick?: (event: Event) => void;
    };
    
    'vscode-divider': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    
    'vscode-data-grid': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      'grid-template-columns'?: string;
      'generate-header'?: string;
    };
    
    'vscode-data-grid-row': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    
    'vscode-data-grid-cell': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      'grid-column'?: string;
    };
    
    'vscode-panels': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    
    'vscode-panel-tab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      id?: string;
    };
    
    'vscode-panel-view': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      id?: string;
    };
    
    'vscode-text-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      value?: string;
      placeholder?: string;
      onChange?: (event: Event) => void;
    };
    
    'vscode-tree-view': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    
    'vscode-tree-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      expanded?: boolean;
    };
  }
}