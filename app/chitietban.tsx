import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { addDoc, collection, deleteDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { firestore } from '../firebaseConfig.js';

const numeral = require('numeral');

type chitiethdDataType = { MaChiTietHD: number, MaHoaDon: number, MaMon: number, SoLuong: number, Gia: number }

const ChiTietBan = () => {
    const { MaBan } = useLocalSearchParams();
    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');

    const [chitietHDData, setChiTietHDData] = useState<chitiethdDataType[]>([]);
    const [itemDetailsMap, setItemDetailsMap] = useState<{ [key: number]: { TenMon: string, DVT: string } }>({});
    const [checkInTime, setCheckInTime] = useState('');
    const [tenBan, setTenBan] = useState('');
    const [trangThai, setTrangThai] = useState('');
    const [maHoaDonBan, setMaHoaDonBanData] = useState('');
    const [isBooking, setIsBooking] = useState(false);
    const [isServing, setIsServing] = useState(false);
    const [gioDen, setGioDen] = useState(new Date().toString());
    const [totalAmount, setTotalAmount] = useState(0);
    const database = useSQLiteContext();
    const [uid, setUid] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUid = async () => {
            const storedUid = await AsyncStorage.getItem("userId");
            setUid(storedUid);
            setLoading(false);
            if (storedUid === null) router.replace('/');
        };
        loadUid();
    }, []);

    const loadData = async () => {
        const result = await database.getFirstAsync<{ TenBan: string; TrangThai: string }>(
            "SELECT TenBan, TrangThai FROM ban WHERE MaBan = ?;", [parseInt(MaBan as string)]
        );
        if (result) {
            setTenBan(result.TenBan);
            setTrangThai(result.TrangThai);
            if (result.TrangThai === 'Đã Đặt Trước') {
                setIsBooking(true); setCheckInTime('...');
            } else if (result.TrangThai === 'Đang Phục Vụ') {
                const ci = await database.getFirstAsync<{ GioDen: string }>("SELECT GioDen FROM hoadon WHERE MaBan = ? AND TrangThai = 0 ORDER BY MaHoaDon DESC LIMIT 1;", [parseInt(MaBan as string)]);
                if (ci) setCheckInTime(ci.GioDen);
                setIsServing(true); setIsBooking(false);
                await loadChiTietHDData();
            } else {
                setIsServing(false); setCheckInTime('...');
            }
        }
    };

    const loadChiTietHDData = async () => {
        const maHD = await database.getFirstAsync<{ MaHoaDon: string }>("SELECT MaHoaDon FROM hoadon WHERE MaBan = ? AND TrangThai = 0 ORDER BY MaHoaDon DESC LIMIT 1;", [parseInt(MaBan as string)]);
        if (maHD) {
            const data = await database.getAllAsync<chitiethdDataType>("SELECT * FROM chitiethd WHERE MaHoaDon = ?", [maHD.MaHoaDon]);
            setChiTietHDData(data);
            setMaHoaDonBanData(maHD.MaHoaDon);

            // Preload details for items
            const detailsMap: { [key: number]: { TenMon: string, DVT: string } } = {};
            for (const item of data) {
                const info = await database.getFirstAsync<{ TenMon: string, DVT: string }>("SELECT TenMon, DVT FROM menu WHERE MaMon = ?;", [item.MaMon]);
                if (info) detailsMap[item.MaMon] = info;
            }
            setItemDetailsMap(detailsMap);
        } else {
            setChiTietHDData([]);
            setMaHoaDonBanData('');
            setItemDetailsMap({});
        }
    };

    const handleGoiMon = async () => {
        try {
            const activeHD = await database.getFirstAsync<{ MaHoaDon: number }>(
                "SELECT MaHoaDon FROM hoadon WHERE MaBan = ? AND TrangThai = 0 ORDER BY MaHoaDon DESC LIMIT 1;", [parseInt(MaBan as string)]
            );
            if (!activeHD) {
                const r = await database.runAsync("INSERT INTO hoadon (MaBan, GioDen, TongTien, TrangThai, userId) VALUES (?, ?, ?, ?, ?);", [parseInt(MaBan as string), gioDen, 0, 0, uid]);
                await addDoc(collection(firestore, 'hoadon'), { MaHoaDon: r.lastInsertRowId, MaBan: parseInt(MaBan as string), GioDen: gioDen, TongTien: 0, TrangThai: 0, userId: uid });
            }
            router.push(`/hoadonban?MaBan=${MaBan}`);
        } catch (e) {
            console.log(e);
            router.push(`/hoadonban?MaBan=${MaBan}`);
        }
    };

    const handleBooking = async () => {
        try {
            await database.runAsync(`UPDATE ban SET TrangThai = ? WHERE MaBan = ? AND userId = ?`, ['Đã Đặt Trước', parseInt(MaBan as string), uid]);
            const q = query(collection(firestore, "ban"), where("MaBan", "==", parseInt(MaBan as string)), where("userId", "==", uid));
            const qs = await getDocs(q);
            if (!qs.empty) await updateDoc(qs.docs[0].ref, { TrangThai: 'Đã Đặt Trước' });
            setIsBooking(!isBooking); await loadData();
        } catch (e) { console.error(e); }
    };

    const handleCancelBooking = async () => {
        try {
            await database.runAsync(`UPDATE ban SET TrangThai = ? WHERE MaBan = ? AND userId = ?`, ['Trống', parseInt(MaBan as string), uid]);
            const q = query(collection(firestore, "ban"), where("MaBan", "==", parseInt(MaBan as string)), where("userId", "==", uid));
            const qs = await getDocs(q);
            if (!qs.empty) await updateDoc(qs.docs[0].ref, { TrangThai: 'Trống' });
            setIsBooking(!isBooking); await loadData();
        } catch (e) { console.error(e); }
    };

    const handleDeleteMon = async (MaHoaDon: string, MaMon: string) => {
        Alert.alert('Xóa món?', 'Bạn chắc chắn muốn xóa món này khỏi hóa đơn?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa', style: 'destructive', onPress: async () => {
                    if (!uid) return;
                    const q = query(collection(firestore, "chitiethd"), where("userId", "==", uid), where("MaHoaDon", "==", Number(MaHoaDon)), where("MaMon", "==", Number(MaMon)));
                    const snap = await getDocs(q);
                    snap.forEach(async d => await deleteDoc(d.ref));
                    await database.runAsync("DELETE FROM chitiethd WHERE MaHoaDon = ? AND MaMon = ?;", [MaHoaDon, MaMon]);
                    await loadChiTietHDData();
                    await loadData();
                }
            }
        ]);
    };

    const handlePlusAjustQuantity = async (MaHoaDon: string, MaMon: string) => {
        try {
            const r = await database.getFirstAsync<{ SoLuong: number }>("SELECT SoLuong FROM chitiethd WHERE MaHoaDon = ? AND MaMon = ?;", [MaHoaDon, MaMon]);
            if (r) {
                await handleUpdateQuantity(r.SoLuong + 1, MaMon, MaHoaDon);
                const q = query(collection(firestore, "chitiethd"), where("MaMon", "==", Number(MaMon)), where("MaHoaDon", "==", Number(MaHoaDon)), where("userId", "==", uid));
                const qs = await getDocs(q);
                if (!qs.empty) await updateDoc(qs.docs[0].ref, { SoLuong: r.SoLuong + 1 });
            }
        } catch (e) { console.log(e); }
    };

    const handleMinusAjustQuantity = async (MaHoaDon: string, MaMon: string) => {
        try {
            const r = await database.getFirstAsync<{ SoLuong: number }>("SELECT SoLuong FROM chitiethd WHERE MaHoaDon = ? AND MaMon = ?;", [MaHoaDon, MaMon]);
            if (r) {
                const newSl = r.SoLuong > 1 ? r.SoLuong - 1 : 1;
                await handleUpdateQuantity(newSl, MaMon, MaHoaDon);
                const q = query(collection(firestore, "chitiethd"), where("MaMon", "==", Number(MaMon)), where("MaHoaDon", "==", Number(MaHoaDon)), where("userId", "==", uid));
                const qs = await getDocs(q);
                if (!qs.empty) await updateDoc(qs.docs[0].ref, { SoLuong: newSl });
            }
        } catch (e) { console.log(e); }
    };

    const handleUpdateQuantity = async (sl: number, MaMon: string, MaHoaDon: string) => {
        try {
            await database.runAsync(`UPDATE chitiethd SET SoLuong = ? WHERE MaHoaDon = ? AND MaMon = ?`, [sl, MaHoaDon, MaMon]);
            loadChiTietHDData();
        } catch (e) { console.error(e); }
    };

    const handlePayment = async (TongTien: string, MaMon: string, MaHoaDon: string, SoLuong: string, Gia: string) => {
        Alert.alert('Tính tiền riêng?', 'Bạn muốn tính tiền riêng cho món này?', [
            { text: 'Hủy' },
            {
                text: 'Tính Tiền', onPress: async () => {
                    const r = await database.runAsync("INSERT INTO hoadon (MaBan, GioDen, TongTien, TrangThai, userId) VALUES (?, ?, ?, ?, ?);", [parseInt(MaBan as string), checkInTime, TongTien, 1, uid]);
                    const newHD = r.lastInsertRowId;
                    await addDoc(collection(firestore, 'hoadon'), { MaHoaDon: newHD, MaBan: Number(MaBan), GioDen: checkInTime, TongTien: Number(TongTien), TrangThai: 1, userId: uid });
                    const r2 = await database.runAsync("INSERT INTO chitiethd (MaHoaDon, MaMon, SoLuong, Gia, userId) VALUES (?, ?, ?, ?, ?)", [newHD, Number(MaMon), Number(SoLuong), Number(Gia), uid]);
                    await addDoc(collection(firestore, 'chitiethd'), { MaChiTietHD: r2.lastInsertRowId, MaHoaDon: newHD, MaMon: Number(MaMon), SoLuong: Number(SoLuong), Gia: Number(Gia), userId: uid });
                    const q = query(collection(firestore, "chitiethd"), where("userId", "==", uid), where("MaHoaDon", "==", Number(MaHoaDon)), where("MaMon", "==", Number(MaMon)));
                    const snap = await getDocs(q);
                    snap.forEach(async d => await deleteDoc(d.ref));
                    await database.runAsync("DELETE FROM chitiethd WHERE MaHoaDon = ? AND MaMon = ?;", [MaHoaDon, MaMon]);
                    await loadData();
                }
            }
        ]);
    };

    useEffect(() => { if (MaBan) loadData(); }, [MaBan]);
    useEffect(() => {
        const sum = chitietHDData.reduce((acc, item) => acc + (item.SoLuong * item.Gia), 0);
        setTotalAmount(sum);
    }, [chitietHDData]);
    useFocusEffect(useCallback(() => { loadData(); }, []));

    if (loading || uid === null) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={{ padding: 20, textAlign: 'center' }}>Đang tải...</ThemedText>
            </ThemedView>
        );
    }

    const getStatusStyle = () => {
        if (trangThai === 'Đang Phục Vụ') return { bg: '#FDEDEC', text: '#C0392B', dot: '#E74C3C' };
        if (trangThai === 'Đã Đặt Trước') return { bg: '#F5EEF8', text: '#7D3C98', dot: '#9B59B6' };
        return { bg: '#EBF5FB', text: '#1A5276', dot: '#3498DB' };
    };
    const ss = getStatusStyle();

    return (
        <ThemedView style={styles.container}>
            {/* Table Info Header Card */}
            <View style={[styles.headerCard, { backgroundColor: primaryColor }]}>
                <ThemedText style={styles.headerTableName}>{tenBan}</ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                    <View style={[styles.statusDot, { backgroundColor: ss.dot }]} />
                    <ThemedText style={styles.statusText}>{trangThai}</ThemedText>
                </View>
                {checkInTime !== '...' && checkInTime ? (
                    <ThemedText style={styles.checkInText}>
                        ⏰ Vào lúc: {checkInTime.slice(0, 24)}
                    </ThemedText>
                ) : null}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                {isBooking ? (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FDEDEC', borderColor: '#E74C3C' }]} onPress={handleCancelBooking}>
                        <MaterialIcons name="cancel" size={20} color="#E74C3C" />
                        <ThemedText style={[styles.actionBtnText, { color: '#E74C3C' }]}>Hủy Đặt Bàn</ThemedText>
                    </TouchableOpacity>
                ) : isServing ? (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EAFAF1', borderColor: '#27AE60' }]} onPress={() => router.push(`/payment?MaBan=${MaBan}`)}>
                        <MaterialIcons name="payments" size={20} color="#27AE60" />
                        <ThemedText style={[styles.actionBtnText, { color: '#27AE60' }]}>Thanh Toán</ThemedText>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F5EEF8', borderColor: '#9B59B6' }]} onPress={handleBooking}>
                        <MaterialIcons name="event-seat" size={20} color="#9B59B6" />
                        <ThemedText style={[styles.actionBtnText, { color: '#9B59B6' }]}>Đặt Bàn</ThemedText>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEF9E7', borderColor: '#F39C12' }]} onPress={handleGoiMon}>
                    <MaterialIcons name="restaurant-menu" size={20} color="#F39C12" />
                    <ThemedText style={[styles.actionBtnText, { color: '#D68910' }]}>Gọi Món</ThemedText>
                </TouchableOpacity>
            </View>

            {/* Order List */}
            {isServing && (
                <FlatList
                    data={chitietHDData}
                    keyExtractor={(item) => item.MaChiTietHD.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const details = itemDetailsMap[item.MaMon] || { TenMon: `Món #${item.MaMon}`, DVT: '' };
                        return (
                            <View style={[styles.orderCard, { backgroundColor: cardColor, borderColor }]}>
                                <View style={styles.orderCardTop}>
                                    <ThemedText style={styles.orderItemName} type="defaultSemiBold">{details.TenMon}</ThemedText>
                                    <View style={styles.orderActions}>
                                        <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteMon(`${item.MaHoaDon}`, `${item.MaMon}`)}>
                                            <MaterialIcons name="remove-circle-outline" size={22} color="#E74C3C" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.iconBtn} onPress={() => handlePayment(`${item.SoLuong * item.Gia}`, `${item.MaMon}`, `${item.MaHoaDon}`, `${item.SoLuong}`, `${item.Gia}`)}>
                                            <MaterialIcons name="payments" size={22} color="#27AE60" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.orderCardBottom}>
                                    <ThemedText style={[styles.orderPrice, { color: mutedColor }]}>
                                        {numeral(item.Gia).format('0,0')} đ / {details.DVT}
                                    </ThemedText>
                                    <View style={styles.qtyControl}>
                                        <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: '#F5EEF8' }]} onPress={() => handleMinusAjustQuantity(`${item.MaHoaDon}`, `${item.MaMon}`)}>
                                            <AntDesign name="minus" size={14} color="#9B59B6" />
                                        </TouchableOpacity>
                                        <ThemedText style={styles.qtyNum}>{item.SoLuong}</ThemedText>
                                        <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: '#EAFAF1' }]} onPress={() => handlePlusAjustQuantity(`${item.MaHoaDon}`, `${item.MaMon}`)}>
                                            <AntDesign name="plus" size={14} color="#27AE60" />
                                        </TouchableOpacity>
                                    </View>
                                    <ThemedText style={styles.orderSubtotal} type="defaultSemiBold">
                                        {numeral(item.SoLuong * item.Gia).format('0,0')} đ
                                    </ThemedText>
                                </View>
                            </View>
                        );
                    }}
                    ListFooterComponent={() => chitietHDData.length > 0 ? (
                        <View style={[styles.totalBar, { backgroundColor: primaryColor }]}>
                            <ThemedText style={styles.totalLabel}>Tổng cộng</ThemedText>
                            <ThemedText style={styles.totalAmount}>{numeral(totalAmount).format('0,0')} VND</ThemedText>
                        </View>
                    ) : null}
                />
            )}
        </ThemedView>
    );
};

export default ChiTietBan;

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerCard: {
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    headerTableName: {
        color: '#fff',
        fontSize: 26,
        fontFamily: 'PoppinsBold',
        marginBottom: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 8,
        marginBottom: 6,
    },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusText: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 14 },
    checkInText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Poppins', marginTop: 4 },
    actionsContainer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginVertical: 16 },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    actionBtnText: { fontFamily: 'PoppinsBold', fontSize: 14 },
    listContent: { paddingHorizontal: 20, paddingBottom: 20 },
    orderCard: {
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        overflow: 'hidden',
    },
    orderCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        paddingBottom: 8,
    },
    orderItemName: { flex: 1, fontSize: 15, fontFamily: 'PoppinsBold' },
    orderActions: { flexDirection: 'row', gap: 8 },
    iconBtn: { padding: 4 },
    orderCardBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingBottom: 12,
    },
    orderPrice: { fontSize: 12, fontFamily: 'Poppins', flex: 1 },
    qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qtyBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    qtyNum: { fontSize: 16, fontFamily: 'PoppinsBold', minWidth: 24, textAlign: 'center' },
    orderSubtotal: { fontSize: 14, fontFamily: 'PoppinsBold' },
    totalBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 4,
    },
    totalLabel: { color: '#fff', fontSize: 16, fontFamily: 'PoppinsBold' },
    totalAmount: { color: '#fff', fontSize: 20, fontFamily: 'PoppinsBold' },
});