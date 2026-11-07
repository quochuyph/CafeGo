import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { auth } from '@/config/firebase';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemePreference, useThemePreference } from '@/theme/ThemePreferenceContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { signOut } from 'firebase/auth';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: 'weather-sunny' | 'moon-waning-crescent' | 'cellphone-cog' }[] = [
    { key: 'light', label: 'Sáng', icon: 'weather-sunny' },
    { key: 'dark', label: 'Tối', icon: 'moon-waning-crescent' },
    { key: 'system', label: 'Hệ thống', icon: 'cellphone-cog' },
];

const Account = () => {
    const database = useSQLiteContext();
    const { themePreference, setThemePreference } = useThemePreference();

    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'card');
    const secondaryColor = useThemeColor({}, 'secondary');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');
    const iconColor = useThemeColor({}, 'icon');
    const successColor = useThemeColor({}, 'success');

    const [isShowingPassword, setIsShowingPassword] = useState(false);

    const [uid, setUid] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [emailVerified, setEmailVerified] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    const [username, setUsername] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [password, setPassword] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const storedUid = await AsyncStorage.getItem('userId');
            const storedEmail = await AsyncStorage.getItem('userEmail');
            const storedVerified = await AsyncStorage.getItem('userEmailVerified');
            const storedUsername = await AsyncStorage.getItem('username');
            const storedDisplayName = await AsyncStorage.getItem('displayName');
            const storedPassword = await AsyncStorage.getItem('userPassword');

            setUid(storedUid);
            setEmail(storedEmail);
            setEmailVerified(storedVerified ? JSON.parse(storedVerified) : false);
            setUsername(storedUsername);
            setDisplayName(storedDisplayName);
            setPassword(storedPassword);

            if (storedUid === null) {
                router.replace('/');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, []),
    );

    const handleLogout = async () => {
        try {
            Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản?', [
                {
                    text: 'Hủy',
                    style: 'cancel',
                },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut(auth);

                        if (uid) {
                            try {
                                await database.runAsync('DELETE FROM ban WHERE userId = ?;', [String(uid)]);
                                await database.runAsync('DELETE FROM chitiethd WHERE userId = ?;', [String(uid)]);
                                await database.runAsync('DELETE FROM hoadon WHERE userId = ?;', [String(uid)]);
                                await database.runAsync('DELETE FROM nhommon WHERE userId = ?;', [String(uid)]);
                                await database.runAsync('DELETE FROM menu WHERE userId = ?;', [String(uid)]);
                            } catch (error) {
                                console.log('Error clearing DB:', error);
                            }
                        }

                        await AsyncStorage.multiRemove([
                            'userId', 'username', 'displayName', 'userPassword',
                            'userEmail', 'userEmailVerified', 'step', 'stepExpireAt',
                        ]);

                        router.replace('/');
                    },
                },
            ]);
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
        }
    };

    if (loading) {
        return (
            <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ThemedText>Đang tải...</ThemedText>
            </ThemedView>
        );
    }

    const firstLetter = displayName
        ? displayName.charAt(0).toUpperCase()
        : username
            ? username.charAt(0).toUpperCase()
            : 'U';

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.headerSection}>
                    <View style={[styles.avatarCircle, { backgroundColor: primaryColor }]}>
                        <ThemedText style={styles.avatarText}>{firstLetter}</ThemedText>
                    </View>
                    <ThemedText type="title" style={styles.displayName}>
                        {displayName || 'Người dùng'}
                    </ThemedText>
                    <ThemedText style={[styles.username, { color: mutedColor }]}>@{username}</ThemedText>
                </View>

                {/* Theme Preference Card */}
                <Card variant="elevated" style={[styles.themeCard, { backgroundColor: cardColor, borderColor }]}>
                    <View style={styles.themeHeader}>
                        <MaterialCommunityIcons name="theme-light-dark" size={22} color={primaryColor} />
                        <View style={{ flex: 1 }}>
                            <ThemedText type="defaultSemiBold" style={{ fontSize: 15 }}>
                                Giao diện hiển thị
                            </ThemedText>
                            <ThemedText style={{ fontSize: 12, color: mutedColor }}>
                                Chọn chế độ sáng, tối hoặc tự động theo thiết bị
                            </ThemedText>
                        </View>
                    </View>

                    <View style={[styles.themeSegmentContainer, { backgroundColor: secondaryColor }]}>
                        {THEME_OPTIONS.map((opt) => {
                            const active = themePreference === opt.key;
                            return (
                                <TouchableOpacity
                                    key={opt.key}
                                    onPress={() => setThemePreference(opt.key)}
                                    activeOpacity={0.85}
                                    style={[
                                        styles.themeSegmentBtn,
                                        active && { backgroundColor: primaryColor },
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={opt.icon}
                                        size={16}
                                        color={active ? '#FFFFFF' : mutedColor}
                                    />
                                    <ThemedText
                                        style={[
                                            styles.themeSegmentText,
                                            { color: active ? '#FFFFFF' : mutedColor },
                                            active && { fontFamily: 'PoppinsBold' },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {opt.label}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Card>

                {/* Account Info Card */}
                <Card variant="elevated" style={[styles.infoCard, { backgroundColor: cardColor, borderColor }]}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                            <MaterialCommunityIcons name="account-outline" size={22} color={primaryColor} />
                            <ThemedText style={styles.label}>Tên hiển thị</ThemedText>
                        </View>
                        <ThemedText type="defaultSemiBold" style={styles.value} numberOfLines={2}>
                            {displayName || '—'}
                        </ThemedText>
                    </View>

                    <View style={[styles.divider, { backgroundColor: borderColor }]} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                            <MaterialCommunityIcons name="identifier" size={22} color={primaryColor} />
                            <ThemedText style={styles.label}>Username</ThemedText>
                        </View>
                        <ThemedText type="defaultSemiBold" style={styles.value} numberOfLines={1}>
                            {username || '—'}
                        </ThemedText>
                    </View>

                    <View style={[styles.divider, { backgroundColor: borderColor }]} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                            <MaterialCommunityIcons name="email-outline" size={22} color={primaryColor} />
                            <ThemedText style={styles.label}>Email</ThemedText>
                        </View>
                        <View style={styles.infoRowRight}>
                            {email ? (
                                <View style={styles.emailValueRow}>
                                    <ThemedText style={[styles.value, { fontSize: 13 }]} numberOfLines={1}>
                                        {email}
                                    </ThemedText>
                                    {emailVerified ? (
                                        <MaterialIcons name="verified" size={16} color={successColor} />
                                    ) : null}
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => router.push({ pathname: '/EmailVerificationScreen', params: { uid: uid ?? '' } })}
                                >
                                    <ThemedText style={{ color: primaryColor, fontFamily: 'PoppinsBold', fontSize: 13 }}>
                                        + Thêm Email
                                    </ThemedText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: borderColor }]} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                            <MaterialCommunityIcons name="lock-outline" size={22} color={primaryColor} />
                            <ThemedText style={styles.label}>Mật khẩu</ThemedText>
                        </View>
                        <View style={styles.passwordValueRow}>
                            <ThemedText style={styles.value} numberOfLines={1}>
                                {isShowingPassword ? password : '••••••••'}
                            </ThemedText>
                            <TouchableOpacity
                                onPress={() => setIsShowingPassword(!isShowingPassword)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <MaterialCommunityIcons
                                    name={isShowingPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={iconColor}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Card>

                {/* Actions */}
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={[styles.editBtn, { borderColor: primaryColor }]}
                        onPress={() =>
                            router.push({
                                pathname: '/chinhsuaaccount',
                                params: {
                                    username: username || '',
                                    password: password || '',
                                    displayName: displayName || '',
                                    email: email || '',
                                },
                            })
                        }
                    >
                        <MaterialCommunityIcons name="account-edit-outline" size={20} color={primaryColor} />
                        <ThemedText style={[styles.editBtnText, { color: primaryColor }]}>
                            Chỉnh sửa thông tin
                        </ThemedText>
                    </TouchableOpacity>

                    <Button
                        title="Đăng Xuất"
                        onPress={handleLogout}
                        type="danger"
                        style={{ minHeight: 50, borderRadius: 14 }}
                    />
                </View>
            </ScrollView>
        </ThemedView>
    );
};

export default Account;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    headerSection: {
        alignItems: 'center',
        marginVertical: 16,
    },
    avatarCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#B5451B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    avatarText: {
        fontSize: 32,
        color: '#FFFFFF',
        fontFamily: 'PoppinsBold',
    },
    displayName: {
        marginBottom: 2,
        textAlign: 'center',
        fontSize: 22,
    },
    username: {
        fontSize: 14,
        fontFamily: 'Poppins',
    },
    themeCard: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    themeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    themeSegmentContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    themeSegmentBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 9,
    },
    themeSegmentText: {
        fontSize: 13,
        fontFamily: 'Poppins',
    },
    infoCard: {
        marginBottom: 24,
        padding: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        gap: 12,
    },
    infoRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
    },
    infoRowRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
    emailValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        maxWidth: '100%',
    },
    passwordValueRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 8,
    },
    divider: {
        height: 1,
        marginHorizontal: 12,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Poppins',
    },
    value: {
        flexShrink: 1,
        fontSize: 14,
        textAlign: 'right',
    },
    actionSection: {
        gap: 12,
    },
    editBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        minHeight: 50,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    editBtnText: {
        fontSize: 15,
        fontFamily: 'PoppinsBold',
    },
});
