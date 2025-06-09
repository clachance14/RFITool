const React = require('react');

// Create context for Select state and handlers
const SelectContext = React.createContext({
  value: '',
  onValueChange: () => {},
});

const Dummy = ({ children, ...props }) => <div {...props}>{children}</div>;

// Helper to flatten children to plain text
const getTextContent = (children) => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return children.toString();
  if (Array.isArray(children)) return children.map(getTextContent).join('');
  if (React.isValidElement(children)) return getTextContent(children.props.children);
  return '';
};

const Root = ({ children, onValueChange, value, defaultValue, ...props }) => {
  const [currentValue, setCurrentValue] = React.useState(value || defaultValue || '');

  const handleValueChange = (newValue) => {
    setCurrentValue(newValue);
    onValueChange?.(newValue);
  };

  const contextValue = {
    value: currentValue,
    onValueChange: handleValueChange,
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div data-testid="select-root" role="combobox" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const Item = ({ children, value, ...props }) => {
  const { onValueChange } = React.useContext(SelectContext);

  const handleClick = () => {
    onValueChange(value);
  };

  return (
    <div 
      role="option"
      data-testid={`select-item-${value}`}
      data-value={value}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      {...props}
    >
      {children}
    </div>
  );
};

const Trigger = ({ children, ...props }) => (
  <div role="button" data-testid="select-trigger" {...props}>
    {children}
  </div>
);

const Value = ({ children, placeholder, ...props }) => (
  <span data-testid="select-value" data-placeholder={placeholder} {...props}>
    {children || placeholder}
  </span>
);

const Content = ({ children, position = 'popper', ...props }) => (
  <div 
    data-testid="select-content"
    data-position={position}
    role="listbox"
    {...props}
  >
    {children}
  </div>
);

const Viewport = ({ children, ...props }) => (
  <div data-testid="select-viewport" {...props}>
    {children}
  </div>
);

const Portal = ({ children }) => <>{children}</>;
const Group = ({ children, ...props }) => (
  <div data-testid="select-group" role="group" {...props}>{children}</div>
);
const Label = ({ children, ...props }) => (
  <div data-testid="select-label" {...props}>{children}</div>
);
const Separator = ({ ...props }) => (
  <div data-testid="select-separator" role="separator" {...props} />
);
const ItemText = ({ children }) => <>{children}</>;
const ItemIndicator = ({ children }) => <>{children}</>;

module.exports = {
  Root,
  Trigger,
  Value,
  Content,
  Item,
  Viewport,
  Portal,
  Group,
  Label,
  Separator,
  ItemText,
  ItemIndicator,
  SelectPrimitive: {
    Root,
    Trigger,
    Value,
    Content,
    Item,
    Viewport,
    Portal,
    Group,
    Label,
    Separator,
    ItemText,
    ItemIndicator,
  },
}; 