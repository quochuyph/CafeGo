import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { firestore } from '../firebaseConfig.js';
const numeral = require('numeral');

type chitiethdDataType = { MaChiTietHD: number, MaHoaDon: number, MaMon: number, SoLuong: number, Gia: number }

const Payment = () => {
    const { MaBan } = useLocalSearchParams();
    const { dark } = useTheme();

    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');
    const textColor = useThemeColor({}, 'text');

    const [chitietHDData, setChiTietHDData] = useState<chitiethdDataType[]>([])
    const [itemDetailsMap, setItemDetailsMap] = useState<{ [key: number]: { TenMon: string, DVT: string } }>({})
    const [checkInTime, setCheckInTime] = useState('')

    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [isPaymentLoading, setIsPaymentLoading] = useState(false)
    const [tienKhachDua, setTienKhachDua] = useState('')
    const [tongTien, setTongTien] = useState(0)

    const [tenBan, setTenBan] = useState('')
    const [maHoaDonBan, setMaHoaDonBanData] = useState('')

    const database = useSQLiteContext()
    const [uid, setUid] = useState<string | null>(null);

    useEffect(() => {
        const loadUid = async () => {
            const storedUid = await AsyncStorage.getItem("userId");
            setUid(storedUid);
            setIsInitialLoading(false);
            if (storedUid === null) {
                router.replace('/');
            }
        };
        loadUid();
    }, []);

    const tienThoi = useMemo(() => {
        const cleanStr = String(tienKhachDua || '0').replace(/[^0-9]/g, '');
        const khach = parseInt(cleanStr || '0', 10);
        return khach >= tongTien ? khach - tongTien : 0;
    }, [tienKhachDua, tongTien]);

    const loadData = async () => {
        const result = await database.getFirstAsync<{
            TenBan: string;
        }>("SELECT TenBan FROM ban WHERE MaBan = ?;", [parseInt(MaBan as string)]);
        if (result) setTenBan(result.TenBan);

        const checkInTimeresult = await database.getFirstAsync<{
            GioDen: string;
        }>("SELECT GioDen FROM hoadon WHERE MaBan = ? AND TrangThai = 0 ORDER BY MaHoaDon DESC LIMIT 1;", [parseInt(MaBan as string)])
        if (checkInTimeresult) setCheckInTime(checkInTimeresult.GioDen)

        loadChiTietHDData()
    }

    const loadChiTietHDData = async () => {
        const maHoaDonresult = await database.getFirstAsync<{
            MaHoaDon: string;
        }>("SELECT MaHoaDon FROM hoadon WHERE MaBan = ? AND TrangThai = 0 ORDER BY MaHoaDon DESC LIMIT 1;", [parseInt(MaBan as string)])
        if (!maHoaDonresult) return;

        const chitietHDDataResult = await database.getAllAsync<chitiethdDataType>("SELECT * FROM chitiethd WHERE MaHoaDon = ?", [maHoaDonresult.MaHoaDon])
        setChiTietHDData(chitietHDDataResult)
        setMaHoaDonBanData(maHoaDonresult.MaHoaDon)

        // Load details for all items
        const detailsMap: { [key: number]: { TenMon: string, DVT: string } } = {}
        for (const item of chitietHDDataResult) {
            const menuInfo = await database.getFirstAsync<{ TenMon: string, DVT: string }>("SELECT TenMon, DVT FROM menu WHERE MaMon = ?;", [item.MaMon])
            if (menuInfo) {
                detailsMap[item.MaMon] = menuInfo
            }
        }
        setItemDetailsMap(detailsMap)
    }

    useEffect(() => {
        if (MaBan) {
            loadData()
        }
    }, [MaBan])

    useEffect(() => {
        if (chitietHDData.length > 0) {
            const sum = chitietHDData.reduce((acc, item) => acc + (item.SoLuong * item.Gia), 0);
            setTongTien(sum);
        } else {
            setTongTien(0);
        }
    }, [chitietHDData]);

    const handlePrintInvoice = async () => {
        try {
            let htmlContent = `
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: 'Arial', sans-serif; margin: 20px; color: #333; }
                        h1 { font-family: 'Times New Roman', serif; text-align: center; margin-bottom: 4px; color: #B5451B; }
                        h2 { text-align: center; font-size: 16px; margin-top: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th, td { border-bottom: 1px solid #ddd; padding: 8px 4px; font-size: 14px; }
                        th { background-color: #F5EDE6; text-align: left; }
                        .text-right { text-align: right; }
                        .total-row { font-weight: bold; font-size: 15px; }
                        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <h1>CaféGo</h1>
                    <h2>HÓA ĐƠN THANH TOÁN</h2>
                    <p><strong>Bàn:</strong> ${tenBan}</p>
                    <p><strong>Giờ đến:</strong> ${checkInTime ? checkInTime.slice(0, 24) : '...'}</p>
                    <p><strong>Ngày in:</strong> ${new Date().toLocaleString('vi-VN')}</p>

                    <table>
                        <thead>
                            <tr>
                                <th>Món</th>
                                <th>SL</th>
                                <th class="text-right">Đơn giá</th>
                                <th class="text-right">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            chitietHDData.forEach((item) => {
                const details = itemDetailsMap[item.MaMon] || { TenMon: 'Món', DVT: '' };
                htmlContent += `
                    <tr>
                        <td>${details.TenMon}</td>
                        <td>${item.SoLuong}</td>
                        <td class="text-right">${numeral(item.Gia).format('0,0')} đ</td>
                        <td class="text-right">${numeral(item.SoLuong * item.Gia).format('0,0')} đ</td>
                    </tr>
                `;
            });

            htmlContent += `
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td colspan="3" class="text-right" style="padding-top: 12px;">Tổng cộng:</td>
                                <td class="text-right" style="padding-top: 12px; color: #B5451B;">${numeral(tongTien).format('0,0')} đ</td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="3" class="text-right">Khách đưa:</td>
                                <td class="text-right">${numeral(tienKhachDua || tongTien).format('0,0')} đ</td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="3" class="text-right">Tiền trả lại:</td>
                                <td class="text-right" style="color: #27AE60;">${numeral(tienThoi).format('0,0')} đ</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div class="footer">
                        <p>Cảm ơn quý khách và hẹn gặp lại! ☕</p>
                        <p>CaféGo - Hệ thống quản lý quán thông minh</p>
                    </div>
                </body>
                </html>
            `;

            await Print.printAsync({
                html: htmlContent,
            });
        } catch (error) {
            console.error("Lỗi khi in hóa đơn:", error);
        }
    };

    const handlePayment = async (shouldPrint: boolean = false) => {
        const cleanStr = String(tienKhachDua || '0').replace(/[^0-9]/g, '');
        const parsedCash = parseInt(cleanStr || '0', 10);
        if (!tienKhachDua || String(tienKhachDua).trim() === '' || isNaN(parsedCash) || parsedCash <= 0 || (tongTien > 0 && parsedCash < tongTien)) {
            Alert.alert('Chưa đủ tiền', 'Vui lòng nhập số tiền khách đưa tối thiểu bằng tổng tiền cần thanh toán!');
            return;
        }

        setIsPaymentLoading(true)
        try {
            await database.runAsync(
                `UPDATE hoadon SET TrangThai = ?, TongTien = ? WHERE MaHoaDon = ?;`,
                [1, tongTien, maHoaDonBan]
            )

            const q = query(
                collection(firestore, "hoadon"),
                where("MaHoaDon", "==", Number(maHoaDonBan)),
                where("userId", "==", uid)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, {
                    TrangThai: 1,
                    TongTien: tongTien,
                });
            }

            await database.runAsync(
                `UPDATE ban SET TrangThai = ? WHERE MaBan = ?`,
                ['Trống', parseInt(MaBan as string)]
            )

            const q1 = query(
                collection(firestore, "ban"),
                where("MaBan", "==", parseInt(MaBan as string)),
                where("userId", "==", uid)
            );

            const query1Snapshot = await getDocs(q1);
            if (!query1Snapshot.empty) {
                const docRef = query1Snapshot.docs[0].ref;
                await updateDoc(docRef, {
                    TrangThai: 'Trống',
                });
            }

            if (shouldPrint) {
                await handlePrintInvoice();
            }

            Alert.alert('Thành công', 'Thanh toán hoàn tất!', [
                {
                    text: 'OK', onPress: () => {
                        router.back()
                        router.back()
                    }
                }
            ]);
        } catch (error) {
            console.error("Error updating payment:", error)
        } finally {
            setIsPaymentLoading(false);
        }
    }

    if (isInitialLoading || uid === null) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={{ padding: 24, textAlign: 'center' }}>Đang tải...</ThemedText>
            </ThemedView>
        );
    }

    const quickCashOptions = [
        { label: 'Đủ tiền', value: tongTien },
        { label: '50.000', value: 50000 },
        { label: '100.000', value: 100000 },
        { label: '200.000', value: 200000 },
        { label: '500.000', value: 500000 },
    ];

    const cleanCashStr = String(tienKhachDua || '').replace(/[^0-9]/g, '');
    const parsedCash = parseInt(cleanCashStr || '0', 10);
    const isCashValid = Boolean(
        tienKhachDua &&
        String(tienKhachDua).trim().length > 0 &&
        !isNaN(parsedCash) &&
        parsedCash > 0 &&
        (tongTien > 0 ? parsedCash >= tongTien : true)
    );
    const isPrintDisabled = isPaymentLoading || !isCashValid;
    const isSubmitDisabled = isPaymentLoading || !isCashValid;

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Bill Info */}
                <View style={[styles.billCard, { backgroundColor: cardColor, borderColor }]}>
                    <View style={styles.billHeader}>
                        <View>
                            <ThemedText style={styles.billTableTitle} type="title">{tenBan}</ThemedText>
                            <ThemedText style={[styles.billSubText, { color: mutedColor }]}>
                                Giờ đến: {checkInTime ? checkInTime.slice(0, 24) : '...'}
                            </ThemedText>
                        </View>
                        <View style={[styles.billBadge, { backgroundColor: '#EAFAF1' }]}>
                            <ThemedText style={{ color: '#27AE60', fontFamily: 'PoppinsBold', fontSize: 12 }}>Chờ thanh toán</ThemedText>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: borderColor }]} />

                    {/* Order items list */}
                    <View style={styles.itemsList}>
                        {chitietHDData.map((item, idx) => {
                            const details = itemDetailsMap[item.MaMon] || { TenMon: `Món #${item.MaMon}`, DVT: '' };
                            return (
                                <View key={idx} style={styles.itemRow}>
                                    <ThemedText style={styles.itemName}>
                                        {details.TenMon} <ThemedText style={{ color: mutedColor, fontSize: 13 }}>x{item.SoLuong}</ThemedText>
                                    </ThemedText>
                                    <ThemedText style={styles.itemPrice} type="defaultSemiBold">
                                        {numeral(item.SoLuong * item.Gia).format('0,0')} đ
                                    </ThemedText>
                                </View>
                            );
                        })}
                    </View>

                    <View style={[styles.divider, { backgroundColor: borderColor }]} />

                    {/* Total Row */}
                    <View style={styles.totalRow}>
                        <ThemedText style={styles.totalLabel}>Tổng cần thanh toán:</ThemedText>
                        <ThemedText style={[styles.totalAmount, { color: primaryColor }]}>
                            {numeral(tongTien).format('0,0')} VND
                        </ThemedText>
                    </View>
                </View>

                {/* Customer Payment Section */}
                <Card style={[styles.paymentSection, { backgroundColor: cardColor, borderColor }]} variant="elevated">
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 15, marginBottom: 12 }}>
                        Tiền khách đưa:
                    </ThemedText>

                    <View style={[styles.inputRow, { borderColor }]}>
                        <TextInput
                            style={[styles.input, { color: textColor }]}
                            placeholder="Nhập số tiền..."
                            placeholderTextColor={mutedColor}
                            keyboardType="numeric"
                            value={tienKhachDua}
                            onChangeText={setTienKhachDua}
                        />
                        <ThemedText style={[styles.currencyLabel, { color: mutedColor }]}>VND</ThemedText>
                    </View>

                    {/* Quick Cash Buttons */}
                    <View style={styles.quickCashContainer}>
                        {quickCashOptions.map((opt, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    styles.quickCashBtn,
                                    { borderColor },
                                    tienKhachDua === String(opt.value) && { backgroundColor: primaryColor, borderColor: primaryColor }
                                ]}
                                onPress={() => setTienKhachDua(String(opt.value))}
                            >
                                <ThemedText
                                    style={[
                                        styles.quickCashText,
                                        tienKhachDua === String(opt.value) && { color: '#fff', fontFamily: 'PoppinsBold' }
                                    ]}
                                >
                                    {opt.label}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Change Refund Row */}
                    <View style={[styles.changeRefundCard, { backgroundColor: '#EAFAF1', borderColor: '#A9DFBF' }]}>
                        <ThemedText style={{ color: '#1E8449', fontFamily: 'Poppins', fontSize: 14 }}>Tiền thối lại:</ThemedText>
                        <ThemedText style={{ color: '#1E8449', fontFamily: 'PoppinsBold', fontSize: 18 }}>
                            {numeral(tienThoi).format('0,0')} VND
                        </ThemedText>
                    </View>
                </Card>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <Button
                        title="In & Hoàn Tất"
                        type="outline"
                        icon={
                            <MaterialIcons
                                name="print"
                                size={20}
                                color={isCashValid ? primaryColor : mutedColor}
                            />
                        }
                        onPress={() => handlePayment(true)}
                        loading={isPaymentLoading}
                        disabled={isPrintDisabled}
                        style={{ height: 52, borderRadius: 14 }}
                    />

                    <Button
                        title="Xác nhận Thanh toán"
                        onPress={() => handlePayment(false)}
                        loading={isPaymentLoading}
                        disabled={isSubmitDisabled}
                        style={{ height: 52, borderRadius: 14 }}
                    />
                </View>
            </ScrollView>
        </ThemedView>
    )
}

export default Payment

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 32,
    },
    billCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 18,
        marginBottom: 16,
    },
    billHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    billTableTitle: {
        fontSize: 22,
        fontFamily: 'PoppinsBold',
    },
    billSubText: {
        fontSize: 12,
        fontFamily: 'Poppins',
        marginTop: 2,
    },
    billBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    divider: {
        height: 1,
        marginVertical: 14,
        opacity: 0.5,
    },
    itemsList: {
        gap: 8,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemName: {
        fontSize: 14,
        fontFamily: 'Poppins',
        flex: 1,
    },
    itemPrice: {
        fontSize: 14,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 15,
        fontFamily: 'PoppinsBold',
    },
    totalAmount: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
    },
    paymentSection: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 18,
        marginBottom: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 52,
        marginBottom: 12,
    },
    input: {
        flex: 1,
        fontSize: 18,
        fontFamily: 'PoppinsBold',
    },
    currencyLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsBold',
    },
    quickCashContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    quickCashBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    quickCashText: {
        fontSize: 12,
        fontFamily: 'Poppins',
    },
    changeRefundCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    buttonContainer: {
        gap: 10,
    },
    payAndPrintBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        height: 50,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    payAndPrintText: {
        fontSize: 15,
        fontFamily: 'PoppinsBold',
    },
})