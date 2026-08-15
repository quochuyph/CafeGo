import { Platform } from 'react-native';
import type { Theme } from './types';

export const fonts = Platform.select({
    default: {
        regular: {
            fontFamily: 'Poppins',
            fontWeight: '400',
        },
        medium: {
            fontFamily: 'Poppins', // tailored to available font files
            fontWeight: '500',
        },
        bold: {
            fontFamily: 'PoppinsBold',
            fontWeight: 'normal',
        },
        heavy: {
            fontFamily: 'PoppinsExtraBold',
            fontWeight: 'normal',
        },
    },
} as const satisfies Record<string, Theme['fonts']>);
