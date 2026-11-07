import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/ui/Card';
import { APP_VERSION } from '@/constants/app';
import { firestore } from '@/config/firebase';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemePreference } from '@/theme/ThemePreferenceContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem('displayName').then(name => setDisplayName(name));
    }, []);

    useEffect(() => {
        const loadUid = async () => {
            const storedUid = await AsyncStorage.getItem('userId');
            setUid(storedUid);
            const emailStatusStored = await AsyncStorage.getItem('userEmailVerified');
            const emailStatus = emailStatusStored ? JSON.parse(emailStatusStored) : false;
            setLoading(false);
            if (storedUid === null) {
                router.replace('/');
                return;
            }
            if (emailStatus === false) {
                Alert.alert('Thông báo!', 'Trước khi tiếp tục, vui lòng thêm Email để bảo mật và khôi phục mật khẩu!', [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Thêm Email',
                        onPress: () => {
                            router.push({ pathname: '/EmailVerificationScreen', params: { uid: storedUid } });
                        },
                    },
                ]);
            }
        };
        loadUid();
    }, []);

    const saveBanToSQLite = async (data: any[]) => {
        try {
            const db = database;
            const targetUid = String(uid || '');
            for (const item of data) {
                const uId = String(item.userId || targetUid);
                if (item.MaBan != null) {
                    await db.runAsync(`INSERT OR REPLACE INTO ban (MaBan, TenBan, TrangThai, userId) VALUES (?, ?, ?, ?);`, [Number(item.MaBan), String(item.TenBan || ''), String(item.TrangThai || 'Trống'), uId]);
                } else {
                    await db.runAsync(`INSERT INTO ban (TenBan, TrangThai, userId) VALUES (?, ?, ?);`, [String(item.TenBan || ''), String(item.TrangThai || 'Trống'), uId]);
                }
            }
            console.log('✅ Ghi dữ liệu Bàn vào SQLite thành công');
        } catch (error: any) {
            console.error('❌ Lỗi khi ghi Bàn vào SQLite:', error?.message || error);
        }
    };

    const saveChiTietHDToSQLite = async (data: any[]) => {
        try {
            const db = database;
            const targetUid = String(uid || '');
            for (const item of data) {
                const uId = String(item.userId || targetUid);
                if (item.MaChiTietHD != null) {
                    await db.runAsync(`INSERT OR REPLACE INTO chitiethd (MaChiTietHD, MaHoaDon, MaMon, SoLuong, Gia, userId) VALUES (?,?,?,?,?,?);`, [Number(item.MaChiTietHD), Number(item.MaHoaDon || 0), Number(item.MaMon || 0), Number(item.SoLuong || 0), Number(item.Gia || 0), uId]);
                } else {
                    await db.runAsync(`INSERT INTO chitiethd (MaHoaDon, MaMon, SoLuong, Gia, userId) VALUES (?,?,?,?,?);`, [Number(item.MaHoaDon || 0), Number(item.MaMon || 0), Number(item.SoLuong || 0), Number(item.Gia || 0), uId]);
                }
            }
            console.log('✅ Ghi dữ liệu Chi Tiết Hóa Đơn vào SQLite thành công');
        } catch (error: any) {
            console.error('❌ Lỗi khi ghi Chi Tiết HD vào SQLite:', error?.message || error);
        }
    };

    const saveHoaDonToSQLite = async (data: any[]) => {
        try {
            const db = database;
            const targetUid = String(uid || '');
            for (const item of data) {
                const uId = String(item.userId || targetUid);
                if (item.MaHoaDon != null) {
                    await db.runAsync(`INSERT OR REPLACE INTO hoadon (MaHoaDon, GiamGia, MaBan, GioDen, TongTien, TrangThai, userId) VALUES (?,?,?,?,?,?,?);`, [Number(item.MaHoaDon), Number(item.GiamGia || 0), Number(item.MaBan || 0), String(item.GioDen || new Date().toISOString()), Number(item.TongTien || 0), Number(item.TrangThai || 0), uId]);
                } else {
                    await db.runAsync(`INSERT INTO hoadon (GiamGia, MaBan, GioDen, TongTien, TrangThai, userId) VALUES (?,?,?,?,?,?);`, [Number(item.GiamGia || 0), Number(item.MaBan || 0), String(item.GioDen || new Date().toISOString()), Number(item.TongTien || 0), Number(item.TrangThai || 0), uId]);
                }
            }
            console.log('✅ Ghi dữ liệu Hóa Đơn vào SQLite thành công');
        } catch (error: any) {
            console.error('❌ Lỗi khi ghi Hóa Đơn vào SQLite:', error?.message || error);
        }
    };

    const saveNhomMonHDToSQLite = async (data: any[]) => {
        try {
            const db = database;
            const targetUid = String(uid || '');
            for (const item of data) {
                const uId = String(item.userId || targetUid);
                if (item.MaLoai != null) {
                    await db.runAsync(`INSERT OR REPLACE INTO nhommon (MaLoai, TenLoai, userId) VALUES (?, ?, ?);`, [Number(item.MaLoai), String(item.TenLoai || ''), uId]);
                } else {
                    await db.runAsync(`INSERT INTO nhommon (TenLoai, userId) VALUES (?, ?);`, [String(item.TenLoai || ''), uId]);
                }
            }
            console.log('✅ Ghi dữ liệu Nhóm Món vào SQLite thành công');
        } catch (error: any) {
            console.error('❌ Lỗi khi ghi Nhóm Món vào SQLite:', error?.message || error);
        }
    };

    const saveMenuHDToSQLite = async (data: any[]) => {
        try {
            const db = database;
            const targetUid = String(uid || '');
            for (const item of data) {
                const uId = String(item.userId || targetUid);
                if (item.MaMon != null) {
                    await db.runAsync(`INSERT OR REPLACE INTO menu (MaMon, TenMon, MaLoai, DonGia, DVT, userId) VALUES (?, ?, ?, ?, ?, ?);`, [Number(item.MaMon), String(item.TenMon || ''), Number(item.MaLoai || 0), Number(item.DonGia || 0), String(item.DVT || ''), uId]);
                } else {
                    await db.runAsync(`INSERT INTO menu (TenMon, MaLoai, DonGia, DVT, userId) VALUES (?, ?, ?, ?, ?);`, [String(item.TenMon || ''), Number(item.MaLoai || 0), Number(item.DonGia || 0), String(item.DVT || ''), uId]);
                }
            }
            console.log('✅ Ghi dữ liệu Menu vào SQLite thành công');
        } catch (error: any) {
            console.error('❌ Lỗi khi ghi Menu vào SQLite:', error?.message || error);
        }
    };

    const syncFromFirestore = async () => {
        try {
            if (uid === null) {
                router.replace('/');
                return;
            }
            const [snapshotBan, snapshotChiTietHD, snapshotHoaDon, snapshotNhomMon, snapshotMenu] = await Promise.all([
                getDocs(query(collection(firestore, 'ban'), where('userId', '==', uid))),
                getDocs(query(collection(firestore, 'chitiethd'), where('userId', '==', uid))),
                getDocs(query(collection(firestore, 'hoadon'), where('userId', '==', uid))),
                getDocs(query(collection(firestore, 'nhommon'), where('userId', '==', uid))),
                getDocs(query(collection(firestore, 'menu'), where('userId', '==', uid))),
            ]);
            await saveBanToSQLite(snapshotBan.docs.map(d => d.data()));
            await saveChiTietHDToSQLite(snapshotChiTietHD.docs.map(d => d.data()));
            await saveHoaDonToSQLite(snapshotHoaDon.docs.map(d => d.data()));
            await saveNhomMonHDToSQLite(snapshotNhomMon.docs.map(d => d.data()));
            await saveMenuHDToSQLite(snapshotMenu.docs.map(d => d.data()));
        } catch (error) {
            console.error('❌ Lỗi khi sync từ Firestore:', error);
        }
    };

    useEffect(() => {
        if (!loading) syncFromFirestore();
    }, [loading]);

    if (loading) {
        return (
            <ThemedView style={styles.centerContainer}>
                <ThemedText style={{ color: primaryColor, fontSize: 20, fontFamily: 'PoppinsBold' }}>CaféGo</ThemedText>
                <ThemedText style={{ marginTop: 8, color: mutedColor }}>Đang tải...</ThemedText>
            </ThemedView>
        );
    }

    const menuItems = [
        { title: 'Sơ Đồ Bàn', icon: require('@assets/dashboard/table.png'), route: '/table' as const, bg: infoBg },
        { title: 'Quản Lý Menu', icon: require('@assets/dashboard/menu.png'), route: '/menu' as const, bg: warningBg },
        { title: 'Quản Lý Hóa Đơn', icon: require('@assets/dashboard/bill.png'), route: '/quanlyhoadon' as const, bg: successBg },
        { title: 'Tài Khoản', icon: require('@assets/dashboard/account.png'), route: '/account' as const, bg: purpleBg },
    ];

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
                            {displayName || 'Chủ quán'} 👋
                        </ThemedText>
                        <ThemedText style={styles.welcomeSub} numberOfLines={1}>
                            Quản lý quán của bạn hôm nay
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
