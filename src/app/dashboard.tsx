import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/ui/Card';
import { APP_VERSION } from '@/constants/app';
import { getActiveOwnerId, getUserRole, UserRole } from '@/hooks/auth';
import { useShopRealtimeSync } from '@/hooks/useShopRealtimeSync';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemePreference } from '@/theme/ThemePreferenceContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Dashboard = () => {
    const database = useSQLiteContext();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { isDark, toggleTheme } = useThemePreference();

    const primaryColor = useThemeColor({}, 'primary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const mutedColor = useThemeColor({}, 'muted');
    const infoBg = useThemeColor({}, 'infoBg');
    const warningBg = useThemeColor({}, 'warningBg');
    const successBg = useThemeColor({}, 'successBg');
    const purpleBg = useThemeColor({}, 'purpleBg');

    const [uid, setUid] = useState<string | null>(null);
    const [role, setRole] = useState<UserRole>('owner');
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem('displayName').then(name => setDisplayName(name));
    }, []);

    useEffect(() => {
        const loadUid = async () => {
            const storedUserId = await AsyncStorage.getItem('userId');
            // Dữ liệu quán được truy vấn theo activeOwnerId (nhân viên dùng ID chủ quán)
            const storedUid = storedUserId ? await getActiveOwnerId() : null;
            const currentRole = await getUserRole();
            setUid(storedUid);
            setRole(currentRole);
            const emailStatusStored = await AsyncStorage.getItem('userEmailVerified');
            const emailStatus = emailStatusStored ? JSON.parse(emailStatusStored) : false;
            setLoading(false);
            if (storedUid === null) {
                router.replace('/');
                return;
            }
            // Không nhắc thêm Email đối với nhân viên
            if (emailStatus === false && currentRole === 'owner') {
                Alert.alert('Thông báo!', 'Trước khi tiếp tục, vui lòng thêm Email để bảo mật và khôi phục mật khẩu!', [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Thêm Email',
                        onPress: () => {
                            router.push({ pathname: '/EmailVerificationScreen', params: { uid: storedUserId } });
                        },
                    },
                ]);
            }
        };
        loadUid();
    }, []);

    // Lắng nghe realtime (onSnapshot) toàn bộ dữ liệu quán theo activeOwnerId
    useShopRealtimeSync(database, loading ? null : uid);

    if (loading) {
        return (
            <ThemedView style={styles.centerContainer}>
                <ThemedText style={{ color: primaryColor, fontSize: 20, fontFamily: 'PoppinsBold' }}>CaféGo</ThemedText>
                <ThemedText style={{ marginTop: 8, color: mutedColor }}>Đang tải...</ThemedText>
            </ThemedView>
        );
    }

    const isOwner = role === 'owner';
    const allMenuItems = [
        { title: 'Sơ Đồ Bàn', icon: require('@assets/dashboard/table.png'), route: '/table' as const, bg: infoBg, ownerOnly: false },
        { title: 'Quản Lý Menu', icon: require('@assets/dashboard/menu.png'), route: '/menu' as const, bg: warningBg, ownerOnly: true },
        { title: 'Quản Lý Hóa Đơn', icon: require('@assets/dashboard/bill.png'), route: '/quanlyhoadon' as const, bg: successBg, ownerOnly: true },
        { title: 'Quản Lý Nhân Viên', icon: require('@assets/dashboard/avt.png'), route: '/quanlynhanvien' as const, bg: infoBg, ownerOnly: true },
        { title: 'Tài Khoản', icon: require('@assets/dashboard/account.png'), route: '/account' as const, bg: purpleBg, ownerOnly: false },
    ];
    // Nhân viên chỉ thấy chức năng Bán hàng (Sơ đồ bàn) và Tài khoản cá nhân
    const menuItems = allMenuItems.filter(item => isOwner || !item.ownerOnly);

    const cardWidth = (width - 48 - 16) / 2;
    const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : 'C';

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            <View
                style={[
                    styles.header,
                    {
                        backgroundColor: primaryColor,
                        paddingTop: insets.top + 18,
                    },
                ]}
            >
                <View style={styles.headerContent}>
                    <View style={styles.greetingBox}>
                        <ThemedText style={styles.welcomeLabel}>Xin chào,</ThemedText>
                        <ThemedText style={styles.welcomeName} numberOfLines={2}>
                            {displayName || (isOwner ? 'Chủ quán' : 'Nhân viên')} 👋
                        </ThemedText>
                        <ThemedText style={styles.welcomeSub} numberOfLines={1}>
                            {isOwner ? 'Quản lý quán của bạn hôm nay' : 'Ca làm việc của bạn hôm nay'}
                        </ThemedText>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={toggleTheme}
                            style={styles.themeToggleBtn}
                            activeOpacity={0.8}
                            accessibilityLabel="Chuyển đổi giao diện sáng tối"
                        >
                            <MaterialCommunityIcons
                                name={isDark ? 'weather-sunny' : 'moon-waning-crescent'}
                                size={20}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push('/account')} activeOpacity={0.85}>
                            <View style={styles.avatarCircle}>
                                <ThemedText style={styles.avatarLetter}>{firstLetter}</ThemedText>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Body */}
            <View style={[styles.bodyContainer, { backgroundColor }]}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <ThemedText style={[styles.sectionTitle, { color: mutedColor }]}>CHỨC NĂNG CHÍNH</ThemedText>
                    <View style={styles.gridContainer}>
                        {menuItems.map((item) => (
                            <TouchableOpacity
                                key={item.route}
                                onPress={() => router.push(item.route)}
                                style={{ width: cardWidth }}
                                activeOpacity={0.85}
                            >
                                <Card variant="elevated" style={[styles.menuItemCard, { backgroundColor: cardColor }]}>
                                    <View style={[styles.iconBg, { backgroundColor: item.bg }]}>
                                        <Image source={item.icon} style={styles.menuIcon} contentFit="contain" />
                                    </View>
                                    <ThemedText type="defaultSemiBold" style={styles.menuText} numberOfLines={2}>
                                        {item.title}
                                    </ThemedText>
                                </Card>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <ThemedText style={[styles.footerText, { color: mutedColor }]}>
                        CaféGo v{APP_VERSION} • Coded By Quoc Huy
                    </ThemedText>
                </View>
            </View>
        </ThemedView>
    );
};

export default Dashboard;

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 46,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greetingBox: {
        flex: 1,
        marginRight: 12,
    },
    welcomeLabel: {
        color: 'rgba(255,255,255,0.82)',
        fontSize: 14,
        fontFamily: 'Poppins',
    },
    welcomeName: {
        color: '#FFFFFF',
        fontSize: 22,
        fontFamily: 'PoppinsBold',
        marginTop: 2,
    },
    welcomeSub: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 13,
        fontFamily: 'Poppins',
        marginTop: 4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    themeToggleBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    avatarCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.55)',
    },
    avatarLetter: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'PoppinsBold',
    },
    bodyContainer: {
        flex: 1,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -24,
        overflow: 'hidden',
    },
    scrollContent: {
        padding: 24,
        paddingTop: 26,
        paddingBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: 'PoppinsBold',
        letterSpacing: 1.1,
        marginBottom: 16,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    menuItemCard: {
        minHeight: 160,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginBottom: 0,
    },
    iconBg: {
        width: 66,
        height: 66,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    menuIcon: {
        width: 40,
        height: 40,
    },
    menuText: {
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'PoppinsBold',
    },
    footer: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    footerText: {
        textAlign: 'center',
        fontSize: 11,
        fontFamily: 'Poppins',
    },
});
