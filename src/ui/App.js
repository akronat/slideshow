import React from 'react';

import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { teal } from '@material-ui/core/colors';

import AppStyle from './AppStyle';
import SlideshowMain from './SlideShowMain';

const createTheme = ({ themeType }) => createMuiTheme({
  palette: {
    primary: { main: teal[500] },
    type: themeType,
  },
});

function App({ themeType = 'dark' }) {
  const theme = createTheme({ themeType });
  return (
    <MuiThemeProvider theme={theme}>
      <AppStyle />
      <SlideshowMain />
    </MuiThemeProvider>
  );
}

export default App;
