// theme/VSDarkTheme.ts
import type { Theme } from '@react-navigation/native';
import { fonts } from './fonts';
import { Colors } from './Colors';

export const VSDarkTheme: Theme = {
    dark: true,
    colors: {
        primary: Colors.dark.primary,
        background: Colors.dark.background,
        card: Colors.dark.card,
        text: Colors.dark.text,
        border: Colors.dark.border,
        notification: Colors.dark.error,
    },
    fonts,
};
