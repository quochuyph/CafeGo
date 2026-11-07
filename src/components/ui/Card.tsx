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
                return theme === 'light'
                    ? styles.shadow
                    : { borderWidth: 1, borderColor };
            case 'outlined':
                return { borderWidth: 1, borderColor };
            case 'flat':
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
        borderRadius: 16,
        marginBottom: 12,
    },
    shadow: {
        shadowColor: '#1C1008',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 3,
    },
});
