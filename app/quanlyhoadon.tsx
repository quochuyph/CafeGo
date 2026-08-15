import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/ui/Card';
import { useThemeColor } from '@/hooks/useThemeColor';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
const numeral = require('numeral');
const moment = require('moment');

type hoaDonType = { MaHoaDon: number, GiamGia: number, MaBan: number, GioDen: string, TongTien: number, TrangThai: number, TenBan: string }

const QuanLyHoaDon = () => {
    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');
    const textColor = useThemeColor({}, 'text');

    const [hoaDonData, setHoaDonData] = useState<hoaDonType[]>([])
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all')

    const database = useSQLiteContext()

    const loadData = async () => {
        const result = await database.getAllAsync<hoaDonType & { TenBan: string }>(
            `SELECT hoadon.*, ban.TenBan
            FROM hoadon
            JOIN ban ON hoadon.MaBan = ban.MaBan
            ORDER BY hoadon.MaHoaDon DESC;`
        );
        setHoaDonData(result);
    }

    const selectedDate = moment()

    const calculateTotalRevenueForDate = (date: any) => {
        return hoaDonData.reduce((total, item) => {
            const itemDate = moment(item.GioDen);
            if (item.TrangThai === 1 && itemDate.isSame(date, 'day')) {
                return total + (item.TongTien || 0);
            }
            return total;
        }, 0);
    };

    const totalPaidInvoices = hoaDonData.filter(item => item.TrangThai === 1).length;
    const totalUnpaidInvoices = hoaDonData.filter(item => item.TrangThai === 0).length;

    const filteredInvoices = hoaDonData.filter(item => {
        if (filterStatus === 'paid') return item.TrangThai === 1;
        if (filterStatus === 'unpaid') return item.TrangThai === 0;
        return true;
    });

    const handleDeleteHoaDon = async (MaHoaDon: string) => {
        try {
            Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa Hóa đơn này không?', [
                {
                    text: 'Hủy',
                    style: 'cancel'
                },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        await database.runAsync("DELETE FROM hoadon WHERE MaHoaDon = ?;", [MaHoaDon])
                        await loadData()
                    }
                }
            ])
        } catch (error) {
            console.log(error)
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadData()
        }, [])
    )

    return (
        <ThemedView style={styles.container}>
            {/* Revenue Overview Card */}
            <View style={styles.headerSection}>
                <Card style={[styles.revenueCard, { backgroundColor: primaryColor }]} variant="elevated">
                    <View style={styles.revenueTop}>
                        <View>
                            <ThemedText style={styles.dateLabel}>Hôm nay, {selectedDate.format('DD/MM/YYYY')}</ThemedText>
                            <ThemedText style={styles.revenueAmount}>
                                {numeral(calculateTotalRevenueForDate(selectedDate)).format("0,0")} đ
                            </ThemedText>
                            <ThemedText style={styles.revenueSub}>Doanh thu đã thanh toán hôm nay</ThemedText>
                        </View>
                        <View style={styles.revenueIconCircle}>
                            <MaterialIcons name="monetization-on" size={32} color="#fff" />
                        </View>
                    </View>
                </Card>

                {/* Filter Tabs */}
                <View style={styles.tabFilterRow}>
                    <TouchableOpacity
                        style={[
                            styles.tabPill,
                            { borderColor },
                            filterStatus === 'all' && { backgroundColor: primaryColor, borderColor: primaryColor }
                        ]}
                        onPress={() => setFilterStatus('all')}
                    >
                        <ThemedText style={[styles.tabText, filterStatus === 'all' && { color: '#fff', fontFamily: 'PoppinsBold' }]}>
                            Tất cả ({hoaDonData.length})
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tabPill,
                            { borderColor },
                            filterStatus === 'paid' && { backgroundColor: '#27AE60', borderColor: '#27AE60' }
                        ]}
                        onPress={() => setFilterStatus('paid')}
                    >
                        <ThemedText style={[styles.tabText, filterStatus === 'paid' && { color: '#fff', fontFamily: 'PoppinsBold' }]}>
                            Đã thanh toán ({totalPaidInvoices})
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tabPill,
                            { borderColor },
                            filterStatus === 'unpaid' && { backgroundColor: '#F39C12', borderColor: '#F39C12' }
                        ]}
                        onPress={() => setFilterStatus('unpaid')}
                    >
                        <ThemedText style={[styles.tabText, filterStatus === 'unpaid' && { color: '#fff', fontFamily: 'PoppinsBold' }]}>
                            Chưa thanh toán ({totalUnpaidInvoices})
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Invoices List */}
            <FlatList
                data={filteredInvoices}
                keyExtractor={(item) => item.MaHoaDon.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const isPaid = item.TrangThai === 1;
                    return (
                        <Card style={[styles.invoiceCard, { backgroundColor: cardColor, borderColor }]} variant="elevated">
                            <View style={styles.invoiceHeader}>
                                <View style={styles.invoiceLeft}>
                                    <ThemedText style={styles.invoiceCode} type="defaultSemiBold">
                                        HD #{item.MaHoaDon} • <ThemedText style={{ color: primaryColor }}>{item.TenBan}</ThemedText>
                                    </ThemedText>
                                    <ThemedText style={[styles.invoiceTime, { color: mutedColor }]}>
                                        {item.GioDen ? item.GioDen.slice(0, 24) : '...'}
                                    </ThemedText>
                                </View>

                                <View style={styles.invoiceRight}>
                                    <View style={[styles.statusBadge, { backgroundColor: isPaid ? '#EAFAF1' : '#FEF9E7' }]}>
                                        <ThemedText style={[styles.statusBadgeText, { color: isPaid ? '#27AE60' : '#D68910' }]}>
                                            {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                        </ThemedText>
                                    </View>
                                </View>
                            </View>

                            <View style={[styles.divider, { backgroundColor: borderColor }]} />

                            <View style={styles.invoiceFooter}>
                                <View>
                                    <ThemedText style={[styles.amountLabel, { color: mutedColor }]}>Tổng tiền:</ThemedText>
                                    <ThemedText style={[styles.amountValue, { color: primaryColor }]}>
                                        {numeral(item.TongTien || 0).format("0,0")} đ
                                    </ThemedText>
                                </View>

                                <TouchableOpacity
                                    style={[styles.deleteBtn, { backgroundColor: '#FDEDEC' }]}
                                    onPress={() => handleDeleteHoaDon(item.MaHoaDon.toString())}
                                >
                                    <FontAwesome6 name="trash" size={14} color="#E74C3C" />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <ThemedText style={{ fontSize: 40 }}>🧾</ThemedText>
                        <ThemedText style={[styles.emptyText, { color: mutedColor }]}>Không có hóa đơn nào</ThemedText>
                    </View>
                }
            />
        </ThemedView>
    )
}

export default QuanLyHoaDon

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSection: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    revenueCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
    },
    revenueTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontFamily: 'Poppins',
    },
    revenueAmount: {
        color: '#fff',
        fontSize: 28,
        fontFamily: 'PoppinsBold',
        marginVertical: 4,
    },
    revenueSub: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontFamily: 'Poppins',
    },
    revenueIconCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabFilterRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
        flexWrap: 'wrap',
    },
    tabPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    tabText: {
        fontSize: 12,
        fontFamily: 'Poppins',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        gap: 12,
    },
    invoiceCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    invoiceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    invoiceLeft: {
        flex: 1,
    },
    invoiceCode: {
        fontSize: 15,
        fontFamily: 'PoppinsBold',
    },
    invoiceTime: {
        fontSize: 12,
        fontFamily: 'Poppins',
        marginTop: 2,
    },
    invoiceRight: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 11,
        fontFamily: 'PoppinsBold',
    },
    divider: {
        height: 1,
        marginVertical: 12,
        opacity: 0.5,
    },
    invoiceFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amountLabel: {
        fontSize: 11,
        fontFamily: 'Poppins',
    },
    amountValue: {
        fontSize: 16,
        fontFamily: 'PoppinsBold',
    },
    deleteBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 48,
        gap: 10,
    },
    emptyText: {
        fontSize: 15,
        fontFamily: 'Poppins',
    },
})