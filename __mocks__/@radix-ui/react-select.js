import React from 'react';

// Core mock components
export const SelectItem = ({ children, value, ...props }) => (
  <option value={value} data-testid="select-item" {...props}>{children}</option>
);
SelectItem.displayName = 'SelectItem';
SelectItem.__RADIX_MOCK_SELECT_ITEM__ = true;

// Helper to recursively extract SelectItem children by displayName or name
function extractSelectItems(children) {
  return React.Children.toArray(children).flatMap(child => {
    if (!child) return [];
    const type = child.type;
    if (
      (typeof type === 'function' || typeof type === 'object') &&
      (type.displayName?.includes('Item') || type.name?.includes('Item'))
    ) {
      // Render as <option>
      return [
        <option key={child.key} value={child.props.value} data-testid="select-item" {...child.props}>
          {child.props.children}
        </option>
      ];
    }
    if (child.props && child.props.children) return extractSelectItems(child.props.children);
    return [];
  });
}

// Core mock components
export const Select = ({ children, value, defaultValue, onValueChange, ...props }) => {
  const [currentValue, setCurrentValue] = React.useState(value || defaultValue || '');
  const handleChange = (e) => {
    const newValue = e.target.value;
    setCurrentValue(newValue);
    onValueChange?.(newValue);
  };
  // Only pass value/onChange to SelectContent
  return (
    <div data-testid="select-root" {...props}>
      {React.Children.map(children, child => {
        if (child?.type === SelectContent) {
          return React.cloneElement(child, {
            value: currentValue,
            onChange: onValueChange,
            onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
};
export const SelectTrigger = ({ children, ...props }) => (
  <div data-testid="select-trigger" role="button" tabIndex={0} {...props}>{children}</div>
);
export const SelectValue = ({ placeholder }) => (
  <span data-testid="select-value">{placeholder}</span>
);
export const SelectContent = ({ children, value, onChange, onValueChange }) => {
  const handleChange = (e) => {
    onChange?.(e);
    onValueChange?.(e.target.value);
  };
  return (
    <select data-testid="select-content" value={value} onChange={handleChange} style={{ display: 'block' }}>
      {extractSelectItems(children)}
    </select>
  );
};

// Passthroughs for other Radix subcomponents
export const Portal = ({ children }) => <>{children}</>;
export const Viewport = ({ children }) => <>{children}</>;
export const Group = ({ children }) => <>{children}</>;
export const Label = ({ children }) => <>{children}</>;
export const Separator = () => <hr data-testid="select-separator" />;
export const ItemText = ({ children }) => <>{children}</>;
export const ItemIndicator = ({ children }) => <>{children}</>;

// Export as default and for namespace import
const all = {
  Root: Select,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Content: SelectContent,
  Item: SelectItem,
  Portal,
  Viewport,
  Group,
  Label,
  Separator,
  ItemText,
  ItemIndicator,
  // Also named exports for direct import
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
};
export default all;
module.exports = all; 