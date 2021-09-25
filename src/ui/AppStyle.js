import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

const useStyles = makeStyles(theme => ({
  '@global': {
    body: {
      overflow: 'hidden',
    },
  },
}));

const AppStyle = () => {
  useStyles();
  return <CssBaseline />;
};

export default AppStyle;
