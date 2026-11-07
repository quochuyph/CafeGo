import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

type CardProps = {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    variant?: 'elevated' | 'outlined' | 'flat';
};

export function Card({ children, style, variant = 'elevated' }: CardProps) {
    const backgroundColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const theme = useColorScheme() ?? 'light';

    const getVariantStyle = () => {
        switch (variant) {
            case 'elevated':
                return theme === 'light' ? styles.shadow : styles.borderSubtle;
            case 'outlined':
                return { borderWidth: 1, borderColor };
            case 'flat':
                return {};
            default:
                return {};
        }
    };

    return (
        <View style={[styles.card, { backgroundColor }, getVariantStyle(), style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    shadow: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    borderSubtle: {
        borderWidth: 1,
        borderColor: '#3E4145', // Dark mode subtle border
    }
});
