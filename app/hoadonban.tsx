import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/ui/Card';
import { useThemeColor } from '@/hooks/useThemeColor';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { addDoc, collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { firestore } from '../firebaseConfig.js';
const numeral = require('numeral');

type chitiethdDataType = { MaChiTietHD: number, MaHoaDon: number, MaMon: number, SoLuong: number, Gia: number }
type hoaDonType = { MaHoaDon: number, GiamGia: number, MaBan: number, GioDen: string, TongTien: number, TrangThai: number }
type menuType = { MaMon: number, TenMon: string, MaLoai: number, DonGia: number, DVT: string }
type NhomMon = { MaLoai: number, TenLoai: string }

const HoaDonBan = () => {
    const { MaBan } = useLocalSearchParams()
    const router = useRouter()
    const { colors } = useTheme()

    const primaryColor = useThemeColor({}, 'primary');
    const iconColor = useThemeColor({}, 'icon');
    const cardColor = useThemeColor({}, 'card');
    const bgColor = useThemeColor({}, 'background');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');
    const textColor = useThemeColor({}, 'text');

    const [chiTietHDData, setChiTietHDData] = useState<chitiethdDataType[]>([])
    const [hoaDonData, setHoaDonData] = useState<hoaDonType[]>([])
    const [menuData, setMenuData] = useState<menuType[]>([])
    const [nhomMonData, setNhomMonData] = useState<NhomMon[]>([])
    const [selectedMaLoai, setSelectedMaLoai] = useState<number | 'all'>('all')

    const [filterData, setFilterData] = useState<menuType[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    const [maHoaDonBan, setMaHoaDonBan] = useState('')
    const [selectedItem, setSelectedItem] = useState<menuType | null>(null)
    const [maMon, setMaMon] = useState('')
    const [giaMon, setGiaMon] = useState('')

    const [totalAmount, setTotalAmount] = useState(0);
    const [totalQuantity, setTotalQuantity] = useState(0);

    const [isModalVisible, setModalVisible] = useState(false);
    const [isModalViewMenuVisible, setModalViewMenuVisible] = useState(false);

    const [sl, setSl] = useState(1)

    const handlePlus = () => setSl(sl + 1)
    const handleMinus = () => setSl(sl > 1 ? sl - 1 : 1)
    const handleResetSL = () => setSl(1)

    const database = useSQLiteContext()
    const [uid, setUid] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const toggleModal = () => setModalVisible(!isModalVisible);
    const toggleModalViewMenu = () => setModalViewMenuVisible(!isModalViewMenuVisible);

    useEffect(() => {
        const loadUid = async () => {
            const storedUid = await AsyncStorage.getItem("userId");
            setUid(storedUid);
            setLoading(false);
            if (storedUid === null) {
                router.replace('/');
            }
        };
        loadUid();
    }, []);

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        if (query) {
            const newData = menuData.filter((item) => {
                const itemData = item.TenMon ? item.TenMon.toUpperCase() : ''
                const textData = query.toUpperCase()
                return itemData.indexOf(textData) > -1
            })
            setFilterData(newData)
        } else {
            setFilterData(menuData)
        }
    }

    const handleFilterCategory = async (MaLoai: number | 'all') => {
        setSelectedMaLoai(MaLoai)
        try {
            if (MaLoai === 'all') {
                const allMenu = await database.getAllAsync<menuType>("SELECT * FROM menu;")
                setMenuData(allMenu)
                setFilterData(allMenu)
            } else {
                const menuResult = await database.getAllAsync<menuType>("SELECT * FROM menu WHERE MaLoai = ?;", [MaLoai])
                setMenuData(menuResult)
                setFilterData(menuResult)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleOpenAddModal = (item: menuType) => {
        setSelectedItem(item)
        setMaMon(`${item.MaMon}`)
        setGiaMon(`${item.DonGia}`)
        setSl(1)
        setModalVisible(true)
    }

    const handleSetChiTietHDData = async () => {
        try {
            const orderedResult = await database.getFirstAsync<{
                SoLuong: number,
            }>("SELECT SoLuong FROM chitiethd WHERE MaHoaDon = ? AND MaMon = ?;", [maHoaDonBan, maMon])

            if (orderedResult && orderedResult.SoLuong >= 1) {
                await database.runAsync(
                    `UPDATE chitiethd SET SoLuong = ? WHERE MaMon = ? AND MaHoaDon = ?`,
                    [sl + orderedResult.SoLuong, maMon, maHoaDonBan]
                )

                const q = query(
                    collection(firestore, "chitiethd"),
                    where("MaMon", "==", Number(maMon)),
                    where("MaHoaDon", "==", Number(maHoaDonBan)),
                    where("userId", "==", uid)
                );

                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const docRef = querySnapshot.docs[0].ref;
                    await updateDoc(docRef, {
                        SoLuong: sl + orderedResult.SoLuong
                    });
                }
            } else {
                const result = await database.runAsync("INSERT INTO chitiethd (MaHoaDon, MaMon, SoLuong, Gia, userId) VALUES (?, ?, ?, ?, ?);", [
                    maHoaDonBan,
                    maMon,
                    sl,
                    giaMon,
                    uid
                ])

                const MaChiTietHD = result.lastInsertRowId

                await addDoc(collection(firestore, 'chitiethd'), {
                    MaChiTietHD: MaChiTietHD,
                    MaHoaDon: Number(maHoaDonBan),
                    MaMon: Number(maMon),
                    SoLuong: sl,
                    Gia: Number(giaMon),
                    userId: uid
                })
            }
            handleResetSL()
            await loadData()
            setModalVisible(false)
        } catch (error) {
            const result = await database.runAsync("INSERT INTO chitiethd (MaHoaDon, MaMon, SoLuong, Gia, userId) VALUES (?, ?, ?, ?, ?);", [
                maHoaDonBan,
                maMon,
                sl,
                giaMon,
                uid
            ])

            const MaChiTietHD = result.lastInsertRowId

            await addDoc(collection(firestore, 'chitiethd'), {
                MaChiTietHD: MaChiTietHD,
                MaHoaDon: Number(maHoaDonBan),
                MaMon: Number(maMon),
                SoLuong: sl,
                Gia: Number(giaMon),
                userId: uid
            })

            handleResetSL()
            await loadData()
            setModalVisible(false)
        }
    }

    const loadData = async () => {
        try {
            await database.runAsync(
                `UPDATE ban SET TrangThai = ? WHERE MaBan = ?`,
                ['Đang Phục Vụ', parseInt(MaBan as string)]
            )

            const q = query(
                collection(firestore, "ban"),
                where("MaBan", "==", parseInt(MaBan as string)),
                where("userId", "==", uid)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, {
                    TrangThai: 'Đang Phục Vụ'
                });
            }
        } catch (error) {
            console.error("Error updating item:", error)
        }

        const hoaDonResult = await database.getAllAsync<hoaDonType>("SELECT * FROM hoadon;")
        setHoaDonData(hoaDonResult)

        const nhomMonResult = await database.getAllAsync<NhomMon>("SELECT * FROM nhommon;")
        setNhomMonData(nhomMonResult)

        const result = await database.getFirstAsync<{
            MaHoaDon: string;
        }>("SELECT MaHoaDon FROM hoadon WHERE MaBan = ? AND TrangThai = 0;", [parseInt(MaBan as string)])
        
        if (result) {
            setMaHoaDonBan(result.MaHoaDon)
            const data = await database.getAllAsync<chitiethdDataType>("SELECT * FROM chitiethd WHERE MaHoaDon = ?;", [result.MaHoaDon])
            setChiTietHDData(data)
            setTotalAmount(data.length)
        }

        const allMenu = await database.getAllAsync<menuType>("SELECT * FROM menu;")
        setMenuData(allMenu)
        setFilterData(allMenu)
    }

    useEffect(() => {
        if (MaBan) {
            loadData()
        }
    }, [MaBan])

    useEffect(() => {
        if (chiTietHDData.length > 0) {
            const sum = chiTietHDData.reduce((acc, item) => acc + (item.SoLuong * 1), 0);
            setTotalQuantity(sum);
        } else {
            setTotalQuantity(0);
        }
    }, [chiTietHDData]);

    if (loading || uid === null) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={{ padding: 24, textAlign: 'center' }}>Đang tải...</ThemedText>
            </ThemedView>
        )
    }

    return (
        <ThemedView style={styles.container}>
            {/* Search Input */}
            <View style={[styles.searchContainer, { backgroundColor: cardColor, borderColor }]}>
                <AntDesign name="search" size={18} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                    style={[styles.searchInput, { color: textColor }]}
                    placeholder='Tìm kiếm món theo tên...'
                    placeholderTextColor={mutedColor}
                    clearButtonMode='always'
                    autoCapitalize='none'
                    autoCorrect={false}
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>

            {/* Category Pills (Horizontal Scroll) */}
            <View style={styles.categoryContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[{ MaLoai: 'all', TenLoai: 'Tất cả' }, ...nhomMonData]}
                    keyExtractor={(item) => String(item.MaLoai)}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
                    renderItem={({ item }) => {
                        const isSelected = selectedMaLoai === item.MaLoai;
                        return (
                            <TouchableOpacity
                                style={[
                                    styles.categoryPill,
                                    { borderColor: isSelected ? primaryColor : borderColor },
                                    isSelected && { backgroundColor: primaryColor }
                                ]}
                                onPress={() => handleFilterCategory(item.MaLoai as any)}
                            >
                                <ThemedText
                                    style={[
                                        styles.categoryText,
                                        isSelected && { color: '#fff', fontFamily: 'PoppinsBold' }
                                    ]}
                                >
                                    {item.TenLoai}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Order Summary Bar */}
            <View style={[styles.summaryCard, { backgroundColor: cardColor, borderColor }]}>
                <View style={styles.summaryInfo}>
                    <View style={styles.summaryItem}>
                        <ThemedText style={[styles.summaryLabel, { color: mutedColor }]}>Số món đã chọn:</ThemedText>
                        <ThemedText style={styles.summaryValue}>{totalAmount} món</ThemedText>
                    </View>
                    <View style={styles.summaryItem}>
                        <ThemedText style={[styles.summaryLabel, { color: mutedColor }]}>Tổng số lượng:</ThemedText>
                        <ThemedText style={[styles.summaryValue, { color: primaryColor }]}>{totalQuantity}</ThemedText>
                    </View>
                </View>
                {totalAmount > 0 && (
                    <TouchableOpacity style={[styles.viewOrderBtn, { backgroundColor: '#F5EEF8' }]} onPress={toggleModalViewMenu}>
                        <MaterialIcons name="receipt-long" size={18} color="#9B59B6" />
                        <ThemedText style={{ color: '#9B59B6', fontFamily: 'PoppinsBold', fontSize: 13 }}>Xem Món</ThemedText>
                    </TouchableOpacity>
                )}
            </View>

            {/* Menu List */}
            <FlatList
                data={filterData}
                keyExtractor={(item) => item.MaMon.toString()}
                contentContainerStyle={styles.menuListContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    return (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleOpenAddModal(item)}
                        >
                            <Card style={[styles.menuItemCard, { backgroundColor: cardColor, borderColor }]} variant="elevated">
                                <View style={styles.menuItemLeft}>
                                    <View style={[styles.itemIconCircle, { backgroundColor: '#FEF9E7' }]}>
                                        <ThemedText style={{ fontSize: 22 }}>☕</ThemedText>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={styles.menuItemName} type="defaultSemiBold">{item.TenMon}</ThemedText>
                                        <ThemedText style={[styles.menuItemUnit, { color: mutedColor }]}>Đơn vị: {item.DVT}</ThemedText>
                                    </View>
                                </View>
                                <View style={styles.menuItemRight}>
                                    <ThemedText style={[styles.menuItemPrice, { color: primaryColor }]}>
                                        {numeral(item.DonGia).format('0,0')} đ
                                    </ThemedText>
                                    <View style={[styles.addIconCircle, { backgroundColor: primaryColor }]}>
                                        <AntDesign name="plus" size={16} color="#fff" />
                                    </View>
                                </View>
                            </Card>
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <ThemedText style={{ fontSize: 36 }}>☕</ThemedText>
                        <ThemedText style={[styles.emptyText, { color: mutedColor }]}>Không tìm thấy món nào</ThemedText>
                    </View>
                }
            />

            {/* Modal: Select Quantity */}
            <Modal visible={isModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: cardColor }]}>
                        <ThemedText style={styles.modalTitle} type="title">Chọn Số Lượng</ThemedText>
                        {selectedItem && (
                            <ThemedText style={[styles.modalSubtitle, { color: mutedColor }]}>
                                {selectedItem.TenMon} ({numeral(selectedItem.DonGia).format('0,0')} đ)
                            </ThemedText>
                        )}
                        
                        <View style={styles.counterRow}>
                            <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: '#FDEDEC' }]} onPress={handleMinus}>
                                <AntDesign name="minus" size={20} color="#E74C3C" />
                            </TouchableOpacity>
                            <ThemedText style={styles.counterNumber}>{sl}</ThemedText>
                            <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: '#EAFAF1' }]} onPress={handlePlus}>
                                <AntDesign name="plus" size={20} color="#27AE60" />
                            </TouchableOpacity>
                        </View>

                        {selectedItem && (
                            <View style={styles.modalTotalPreview}>
                                <ThemedText style={{ color: mutedColor }}>Thành tiền: </ThemedText>
                                <ThemedText style={{ fontFamily: 'PoppinsBold', color: primaryColor, fontSize: 16 }}>
                                    {numeral(sl * selectedItem.DonGia).format('0,0')} đ
                                </ThemedText>
                            </View>
                        )}

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity style={[styles.modalCancelBtn, { borderColor }]} onPress={() => { handleResetSL(); setModalVisible(false); }}>
                                <ThemedText style={{ color: mutedColor, fontFamily: 'PoppinsBold' }}>Hủy</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: primaryColor }]} onPress={handleSetChiTietHDData}>
                                <ThemedText style={styles.modalSubmitText}>Thêm Món</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal: View Ordered Items */}
            <Modal visible={isModalViewMenuVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBoxLarge, { backgroundColor: cardColor }]}>
                        <View style={styles.modalHeaderRow}>
                            <ThemedText type="title" style={{ fontSize: 18 }}>Món Đã Gọi</ThemedText>
                            <TouchableOpacity onPress={() => setModalViewMenuVisible(false)}>
                                <AntDesign name="close" size={22} color={iconColor} />
                            </TouchableOpacity>
                        </View>
                        
                        <FlatList
                            data={chiTietHDData}
                            keyExtractor={(item) => item.MaChiTietHD.toString()}
                            style={{ maxHeight: 350, marginVertical: 12 }}
                            renderItem={({ item }) => {
                                const menuItem = menuData.find(m => m.MaMon === item.MaMon);
                                const tenMon = menuItem ? menuItem.TenMon : `Món #${item.MaMon}`;
                                return (
                                    <View style={[styles.orderedItemRow, { borderBottomColor: borderColor }]}>
                                        <ThemedText style={styles.orderedItemName}>{tenMon}</ThemedText>
                                        <View style={styles.orderedItemQtyBadge}>
                                            <ThemedText style={styles.orderedItemQty}>x{item.SoLuong}</ThemedText>
                                        </View>
                                    </View>
                                );
                            }}
                        />

                        <TouchableOpacity
                            style={[styles.modalFullCloseBtn, { backgroundColor: primaryColor }]}
                            onPress={() => setModalViewMenuVisible(false)}
                        >
                            <ThemedText style={{ color: '#fff', fontFamily: 'PoppinsBold', textAlign: 'center' }}>Đóng</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ThemedView>
    )
}

export default HoaDonBan

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        paddingHorizontal: 14,
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        marginTop: 16,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Poppins',
    },
    categoryContainer: {
        marginBottom: 12,
    },
    categoryPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 13,
        fontFamily: 'Poppins',
    },
    summaryCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 20,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 14,
    },
    summaryInfo: {
        gap: 2,
    },
    summaryItem: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        fontFamily: 'Poppins',
    },
    summaryValue: {
        fontSize: 13,
        fontFamily: 'PoppinsBold',
    },
    viewOrderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    menuListContent: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        gap: 10,
    },
    menuItemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    itemIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemName: {
        fontSize: 15,
        fontFamily: 'PoppinsBold',
    },
    menuItemUnit: {
        fontSize: 12,
        fontFamily: 'Poppins',
        marginTop: 2,
    },
    menuItemRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    menuItemPrice: {
        fontSize: 14,
        fontFamily: 'PoppinsBold',
    },
    addIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 48,
        gap: 10,
    },
    emptyText: {
        fontSize: 14,
        fontFamily: 'Poppins',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    modalBox: {
        width: "100%",
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
    },
    modalBoxLarge: {
        width: "100%",
        borderRadius: 20,
        padding: 20,
        elevation: 10,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E8DDD5',
    },
    modalTitle: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 13,
        fontFamily: 'Poppins',
        marginBottom: 20,
    },
    counterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        marginBottom: 16,
    },
    stepperBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterNumber: {
        fontSize: 28,
        fontFamily: 'PoppinsBold',
        minWidth: 40,
        textAlign: 'center',
    },
    modalTotalPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalButtonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    modalSubmitBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalSubmitText: {
        color: '#fff',
        fontFamily: 'PoppinsBold',
        fontSize: 14,
    },
    modalFullCloseBtn: {
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
    },
    orderedItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    orderedItemName: {
        fontSize: 15,
        fontFamily: 'Poppins',
    },
    orderedItemQtyBadge: {
        backgroundColor: '#F5EDE6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    orderedItemQty: {
        fontSize: 13,
        fontFamily: 'PoppinsBold',
    },
})