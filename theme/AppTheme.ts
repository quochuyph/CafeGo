import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';
import { Colors } from './Colors';
import { fonts } from './fonts';

export const AppLightTheme: Theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: Colors.light.primary,
        background: Colors.light.background,
        card: Colors.light.card,
        text: Colors.light.text,
        border: Colors.light.border,
        notification: Colors.light.error,
    },
    fonts: fonts,
};

export const AppDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        primary: Colors.dark.primary,
        background: Colors.dark.background,
        card: Colors.dark.card,
        text: Colors.dark.text,
        border: Colors.dark.border,
        notification: Colors.dark.error,
    },
    fonts: fonts,
};
