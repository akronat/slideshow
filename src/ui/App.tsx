import React from 'react';

import { PaletteType } from '@material-ui/core';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { teal } from '@material-ui/core/colors';

import AppStyle from './AppStyle';
import SlideshowMain from './SlideShowMain';

declare module '@material-ui/core/styles/createMuiTheme' {
  interface ThemeOptions {
  }
  interface Theme {
  }
}

declare module '@material-ui/core/styles/createPalette' {
  interface PaletteOptions {
    controlPanel?: PaletteColorOptions;
    controlPanelOverlay?: PaletteColorOptions;
  }
  interface Palette {
    controlPanel: PaletteColor;
    controlPanelOverlay: PaletteColor;
  }
}

const createTheme = (themeType: PaletteType) => createMuiTheme({
  palette: {
    primary: { main: teal[500] },
    background: { default: 'black' },
    controlPanel: { main: 'rgba(25,25,25,1)' },
    controlPanelOverlay: { main: 'rgba(25,25,25,0.7)' },
    type: themeType,
  },
});

function App({ themeType = 'dark' }: { themeType: PaletteType }) {
  const theme = createTheme(themeType);
  return (
    <MuiThemeProvider theme={theme}>
      <AppStyle />
      <SlideshowMain />
    </MuiThemeProvider>
  );
}

export default App;
