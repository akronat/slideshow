import React from 'react';
import IconButton, { IconButtonProps } from '@material-ui/core/IconButton';
import Menu, { MenuProps } from '@material-ui/core/Menu';

interface Props {
  buttonContent: React.ReactNode;
  buttonProps?: Partial<IconButtonProps>;
  children: React.ReactNode;
  collapse?: boolean;
  menuProps?: Partial<MenuProps>;
}
const MenuCollapser: React.FC<Props> = ({
  buttonContent,
  buttonProps = {},
  collapse = false,
  children,
  menuProps = {},
}) => {
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
  if (!collapse) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  return (
    <div>
      <IconButton
        onClick={e => setAnchor(anchor ? null : e.currentTarget)}
        {...buttonProps}
      >
        {buttonContent}
      </IconButton>
      <Menu
        anchorEl={anchor}
        keepMounted
        open={!!anchor}
        onClose={() => setAnchor(null)}
        {...menuProps}
      >
        {React.Children.map(children, child => <li>{child}</li>)}
      </Menu>
    </div>
  );
};

export default MenuCollapser;
