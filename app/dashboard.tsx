import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/ui/Card';
import { useThemeColor } from '@/hooks/useThemeColor';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSQLiteContext } from 'expo-sqlite';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import appConfig from '../app.json';
import { firestore } from '../firebaseConfig.js';

const { width } = Dimensions.get('window');

const Dashboard = () => {
    const database = useSQLiteContext()
    const primaryColor = useThemeColor({}, 'primary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const accentColor = useThemeColor({}, 'accent');
    const mutedColor = useThemeColor({}, 'muted');

    const [uid, setUid] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem('displayName').then(name => setDisplayName(name));
    }, []);

    useEffect(() => {
        if (!loading) syncFromFirestore();
    }, [loading]);

    useEffect(() => {
        const loadUid = async () => {
            const storedUid = await AsyncStorage.getItem("userId");
            setUid(storedUid);
            const emailStatusStored = await AsyncStorage.getItem("userEmailVerified");
            const emailStatus = emailStatusStored ? JSON.parse(emailStatusStored) : false;
            setLoading(false);
            if (storedUid === null) {
                router.replace('/');
            }
            if (emailStatus === false) {
                Alert.alert('Thông báo!', 'Trước khi tiếp tục, vui lòng thêm Email để bảo mật và khôi phục mật khẩu!', [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Thêm Email', onPress: () => {
                            router.push({ pathname: '/EmailVerificationScreen', params: { uid: storedUid } });
                        }
                    }
                ]);
            }
        };
        loadUid();
    }, []);

    const syncFromFirestore = async () => {
        try {
            if (uid === null) { router.replace('/'); return; }
            const [snapshotBan, snapshotChiTietHD, snapshotHoaDon, snapshotNhomMon, snapshotMenu] = await Promise.all([
                getDocs(query(collection(firestore, "ban"), where("userId", "==", uid))),
                getDocs(query(collection(firestore, "chitiethd"), where("userId", "==", uid))),
                getDocs(query(collection(firestore, "hoadon"), where("userId", "==", uid))),
                getDocs(query(collection(firestore, "nhommon"), where("userId", "==", uid))),
                getDocs(query(collection(firestore, "menu"), where("userId", "==", uid))),
            ]);
            await saveBanToSQLite(snapshotBan.docs.map(d => d.data()));
            await saveChiTietHDToSQLite(snapshotChiTietHD.docs.map(d => d.data()));
            await saveHoaDonToSQLite(snapshotHoaDon.docs.map(d => d.data()));
            await saveNhomMonHDToSQLite(snapshotNhomMon.docs.map(d => d.data()));
            await saveMenuHDToSQLite(snapshotMenu.docs.map(d => d.data()));
        } catch (error) {
            console.error("❌ Lỗi khi sync từ Firestore:", error);
        }
    };

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
            console.log("✅ Ghi dữ liệu Bàn vào SQLite thành công");
        } catch (error: any) { console.error("❌ Lỗi khi ghi Bàn vào SQLite:", error?.message || error); }
    };

    const saveChiTietHDToSQLite = async (data: any[]) => {
        try {
            const db = database; const targetUid = String(uid || '');
            for (const item of data) {
                const uId = String(item.userId || targetUid);
                if (item.MaChiTietHD != null) {
                    await db.runAsync(`INSERT OR REPLACE INTO chitiethd (MaChiTietHD, MaHoaDon, MaMon, SoLuong, Gia, userId) VALUES (?,?,?,?,?,?);`, [Number(item.MaChiTietHD), Number(item.MaHoaDon || 0), Number(item.MaMon || 0), Number(item.SoLuong || 0), Number(item.Gia || 0), uId]);
                } else {
                    await db.runAsync(`INSERT INTO chitiethd (MaHoaDon, MaMon, SoLuong, Gia, userId) VALUES (?,?,?,?,?);`, [Number(item.MaHoaDon || 0), Number(item.MaMon || 0), Number(item.SoLuong || 0), Number(item.Gia || 0), uId]);
                }
            }
            console.log("✅ Ghi dữ liệu Chi Tiết Hóa Đơn vào SQLite thành công");
        } catch (error: any) { console.error("❌ Lỗi khi ghi Chi Tiết HD vào SQLite:", error?.message || error); }
    };

    const saveHoaDonToSQLite = async (data: any[]) => {
        try {
            const db = database; const targetUid = String(uid || '');
            for (const item of data) {
                const uId = String(item.userId || targetUid);
                if (item.MaHoaDon != null) {
                    await db.runAsync(`INSERT OR REPLACE INTO hoadon (MaHoaDon, GiamGia, MaBan, GioDen, TongTien, TrangThai, userId) VALUES (?,?,?,?,?,?,?);`, [Number(item.MaHoaDon), Number(item.GiamGia || 0), Number(item.MaBan || 0), String(item.GioDen || new Date().toISOString()), Number(item.TongTien || 0), Number(item.TrangThai || 0), uId]);
                } else {
                    await db.runAsync(`INSERT INTO hoadon (GiamGia, MaBan, GioDen, TongTien, TrangThai, userId) VALUES (?,?,?,?,?,?);`, [Number(item.GiamGia || 0), Number(item.MaBan || 0), String(item.GioDen || new Date().toISOString()), Number(item.TongTien || 0), Number(item.TrangThai || 0), uId]);
                }
            }
            console.log("✅ Ghi dữ liệu Hóa Đơn vào SQLite thành công");
        } catch (error: any) { console.error("❌ Lỗi khi ghi Hóa Đơn vào SQLite:", error?.message || error); }
    };

    const saveNhomMonHDToSQLite = async (data: any[]) => {
        try {
            const db = database; const targetUid = String(uid || '');
            for (const item of data) {
                const uId = String(item.userId || targetUid);
                if (item.MaLoai != null) {
                    await db.runAsync(`INSERT OR REPLACE INTO nhommon (MaLoai, TenLoai, userId) VALUES (?, ?, ?);`, [Number(item.MaLoai), String(item.TenLoai || ''), uId]);
                } else {
                    await db.runAsync(`INSERT INTO nhommon (TenLoai, userId) VALUES (?, ?);`, [String(item.TenLoai || ''), uId]);
                }
            }
            console.log("✅ Ghi dữ liệu Nhóm Món vào SQLite thành công");
        } catch (error: any) { console.error("❌ Lỗi khi ghi Nhóm Món vào SQLite:", error?.message || error); }
    };

    const saveMenuHDToSQLite = async (data: any[]) => {
        try {
            const db = database; const targetUid = String(uid || '');
            for (const item of data) {
                const uId = String(item.userId || targetUid);
                if (item.MaMon != null) {
                    await db.runAsync(`INSERT OR REPLACE INTO menu (MaMon, TenMon, MaLoai, DonGia, DVT, userId) VALUES (?, ?, ?, ?, ?, ?);`, [Number(item.MaMon), String(item.TenMon || ''), Number(item.MaLoai || 0), Number(item.DonGia || 0), String(item.DVT || ''), uId]);
                } else {
                    await db.runAsync(`INSERT INTO menu (TenMon, MaLoai, DonGia, DVT, userId) VALUES (?, ?, ?, ?, ?);`, [String(item.TenMon || ''), Number(item.MaLoai || 0), Number(item.DonGia || 0), String(item.DVT || ''), uId]);
                }
            }
            console.log("✅ Ghi dữ liệu Menu vào SQLite thành công");
        } catch (error: any) { console.error("❌ Lỗi khi ghi Menu vào SQLite:", error?.message || error); }
    };

    if (loading) {
        return (
            <ThemedView style={styles.centerContainer}>
                <ThemedText style={{ color: '#B5451B', fontSize: 18, fontFamily: 'PoppinsBold' }}>CaféGo</ThemedText>
                <ThemedText style={{ marginTop: 8, opacity: 0.6 }}>Đang tải...</ThemedText>
            </ThemedView>
        );
    }

    const menuItems = [
        { title: 'Chọn Bàn', icon: require('../assets/dashboard/table.png'), route: '/table', color: '#E8F4FD', iconBg: '#3498DB' },
        { title: 'Quản Lý Menu', icon: require('../assets/dashboard/menu.png'), route: '/menu', color: '#FEF9E7', iconBg: '#F39C12' },
        { title: 'Quản Lý\nHóa Đơn', icon: require('../assets/dashboard/bill.png'), route: '/quanlyhoadon', color: '#EAFAF1', iconBg: '#27AE60' },
        { title: 'Tài Khoản', icon: require('../assets/dashboard/account.png'), route: '/account', color: '#FDF2F8', iconBg: '#9B59B6' },
    ];

    const MenuItem = ({ title, icon, route, color, iconBg }: any) => (
        <TouchableOpacity
            onPress={() => router.push(route)}
            style={styles.menuItemWrapper}
            activeOpacity={0.85}
        >
            <Card variant="elevated" style={[styles.menuItemCard, { backgroundColor: cardColor }]}>
                <View style={[styles.iconBg, { backgroundColor: color }]}>
                    <Image source={icon} style={styles.menuIcon} contentFit="contain" />
                </View>
                <ThemedText type="defaultSemiBold" style={styles.menuText}>{title}</ThemedText>
            </Card>
        </TouchableOpacity>
    );

    const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : 'C';

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: primaryColor }]}>
                <View style={styles.headerContent}>
                    <View>
                        <ThemedText style={styles.welcomeLabel}>Xin chào,</ThemedText>
                        <ThemedText style={styles.welcomeName}>{displayName || 'User'} 👋</ThemedText>
                        <ThemedText style={styles.welcomeSub}>Quản lý quán của bạn hôm nay</ThemedText>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/account')} style={styles.avatarContainer}>
                        <View style={styles.avatarCircle}>
                            <ThemedText style={styles.avatarLetter}>{firstLetter}</ThemedText>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Body */}
            <View style={[styles.bodyContainer, { backgroundColor: backgroundColor, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -28 }]}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <ThemedText style={[styles.sectionTitle, { color: mutedColor }]}>CHỨC NĂNG CHÍNH</ThemedText>
                    <View style={styles.gridContainer}>
                        {menuItems.map((item) => (
                            <MenuItem key={item.route} {...item} />
                        ))}
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <ThemedText style={{ textAlign: 'center', opacity: 0.4, fontSize: 11, fontFamily: 'Poppins' }}>
                        CaféGo v{appConfig?.expo?.version || '8.0.0'} • Coded By Quoc Huy
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
        height: 210,
        paddingTop: Platform.OS === 'ios' ? 60 : 44,
        paddingHorizontal: 24,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    welcomeLabel: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 15,
        fontFamily: 'Poppins',
    },
    welcomeName: {
        color: '#fff',
        fontSize: 24,
        fontFamily: 'PoppinsBold',
        marginTop: 2,
    },
    welcomeSub: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 13,
        fontFamily: 'Poppins',
        marginTop: 4,
    },
    avatarContainer: {},
    avatarCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarLetter: {
        color: '#fff',
        fontSize: 22,
        fontFamily: 'PoppinsBold',
    },
    bodyContainer: { flex: 1, overflow: 'hidden' },
    scrollContent: { padding: 24, paddingTop: 28, paddingBottom: 16 },
    sectionTitle: {
        fontSize: 11,
        fontFamily: 'PoppinsBold',
        letterSpacing: 1.2,
        marginBottom: 16,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    menuItemWrapper: {
        width: (width - 48 - 16) / 2,
    },
    menuItemCard: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderRadius: 20,
    },
    iconBg: {
        width: 68,
        height: 68,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    menuIcon: { width: 44, height: 44 },
    menuText: { textAlign: 'center', fontSize: 13, fontFamily: 'PoppinsBold' },
    footer: {
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    },
});
