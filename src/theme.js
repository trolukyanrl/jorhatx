import { DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { MD3LightTheme as PaperDefaultTheme } from 'react-native-paper';

export const paperTheme = {
  ...PaperDefaultTheme,
  dark: false,
  mode: 'exact',
  colors: {
    ...PaperDefaultTheme.colors,
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceVariant: '#f2f2f2',
    onBackground: '#222222',
    onSurface: '#222222',
  },
};

export const navigationTheme = {
  ...NavigationDefaultTheme,
  dark: false,
  colors: {
    ...NavigationDefaultTheme.colors,
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#222222',
    border: '#e6e6e6',
    primary: '#6200ea',
  },
};
