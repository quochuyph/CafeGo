import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/ui/Card';
import { useThemeColor } from '@/hooks/useThemeColor';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { collection, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { firestore } from '../firebaseConfig.js';
const numeral = require('numeral');

type menuType = { MaMon: number, TenMon: string, MaLoai: number, DonGia: number, DVT: string, userId: string }
type nhomMonType = { MaLoai: number, TenLoai: string, MauSac: string }

const Menu = () => {
    const { colors } = useTheme()
    const primaryColor = useThemeColor({}, 'primary');
    const textColor = useThemeColor({}, 'text');
    const iconColor = useThemeColor({}, 'icon');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');

    const [showActionSheet, setShowActionSheet] = useState(false)
    const [menuData, setMenuData] = useState<menuType[]>([])
    const [nhomData, setNhomData] = useState<nhomMonType[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    const database = useSQLiteContext()
    const [uid, setUid] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUid = async () => {
            const storedUid = await AsyncStorage.getItem("userId");
            setUid(storedUid);
            setLoading(false);
            if (storedUid === null) {
                router.replace('/');
            } else if (storedUid) {
                loadData(storedUid)
            }
        };
        loadUid();
    }, []);

    const loadData = async (storedUid: string) => {
        const result = await database.getAllAsync<menuType>("SELECT * FROM menu WHERE userId = ?;", [storedUid])
        const nhom = await database.getAllAsync<nhomMonType>("SELECT * FROM nhommon WHERE userId = ?;", [storedUid])
        setMenuData(result)
        setNhomData(nhom)
    }

    // Group menu theo nhóm
    const groupedData = React.useMemo(() => {
        let groups = nhomData
            .sort((a, b) => a.TenLoai.localeCompare(b.TenLoai))
            .map(nhom => ({
                ...nhom,
                items: menuData.filter(item => {
                    const matchTenMon = item.TenMon.toLowerCase().includes(searchQuery.toLowerCase())
                    return item.MaLoai === nhom.MaLoai && (searchQuery === '' || matchTenMon)
                })
            }))
        return groups
    }, [menuData, nhomData, searchQuery])

    const handleDelete = async (MaMon: string) => {
        try {
            Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa món này không?', [
                {
                    text: 'Hủy',
                    style: 'cancel'
                },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        if (!uid) return;

                        const q = query(
                            collection(firestore, "menu"),
                            where("userId", "==", uid),
                            where("MaMon", "==", Number(MaMon))
                        );

                        const snapshot = await getDocs(q);
                        snapshot.forEach(async (docSnap) => {
                            await deleteDoc(docSnap.ref);
                        });

                        await database.runAsync("DELETE FROM menu WHERE MaMon = ?;", [MaMon])
                        await loadData(uid)
                    }
                }
            ])
        } catch (error) {
            console.error(error)
        }
    }

    useFocusEffect(
        useCallback(() => {
            const checkUid = async () => {
                const storedUid = await AsyncStorage.getItem("userId");
                setUid(storedUid);
                setLoading(false);
                if (storedUid === null) {
                    router.replace('/');
                } else if (storedUid) {
                    loadData(storedUid)
                }
            };
            checkUid();
        }, [])
    )

    if (loading || uid === null) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={{ padding: 24, textAlign: 'center' }}>Đang tải...</ThemedText>
            </ThemedView>
        )
    }

    const totalMenuItems = menuData.length;

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen
                options={{
                    headerRight: () => (
                        <TouchableOpacity style={styles.topBarBtn} onPress={() => setShowActionSheet(true)}>
                            <MaterialCommunityIcons name="dots-vertical" size={24} color={iconColor} />
                        </TouchableOpacity>
                    )
                }}
            />

            {/* Action Sheet Modal */}
            <Modal visible={showActionSheet} transparent animationType="fade">
                <TouchableOpacity style={styles.actionSheetOverlay} activeOpacity={1} onPress={() => setShowActionSheet(false)}>
                    <View style={[styles.actionSheet, { backgroundColor: cardColor }]}>
                        <ThemedText style={styles.actionSheetTitle}>Quản lý Menu</ThemedText>
                        <TouchableOpacity style={styles.actionItem} onPress={() => { setShowActionSheet(false); router.push('/themmon'); }}>
                            <AntDesign name="plus" size={20} color={primaryColor} />
                            <ThemedText style={[styles.actionText, { color: primaryColor, fontFamily: 'PoppinsBold' }]}>Thêm Món Mới</ThemedText>
                        </TouchableOpacity>
                        <View style={[styles.divider, { backgroundColor: borderColor }]} />
                        <TouchableOpacity style={styles.actionItem} onPress={() => { setShowActionSheet(false); router.push('/quanlynhommon'); }}>
                            <MaterialIcons name="category" size={20} color={iconColor} />
                            <ThemedText style={styles.actionText}>Quản Lý Nhóm Món</ThemedText>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: cardColor, borderColor }]}>
                <AntDesign name="search" size={18} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                    style={[styles.searchInput, { color: textColor }]}
                    placeholder='Tìm kiếm món...'
                    placeholderTextColor={mutedColor}
                    clearButtonMode='always'
                    autoCapitalize='none'
                    autoCorrect={false}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Menu List by Category */}
            <FlatList
                data={groupedData}
                keyExtractor={(group) => group.MaLoai.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: group }) => {
                    if (group.items.length === 0 && searchQuery !== '') return null;
                    return (
                        <View style={styles.groupSection}>
                            {/* Group Header */}
                            <View style={styles.groupHeader}>
                                <ThemedText type='subtitle' style={styles.groupTitle}>
                                    {group.TenLoai}
                                </ThemedText>
                                <View style={[styles.countBadge, { backgroundColor: '#F5EDE6' }]}>
                                    <ThemedText style={[styles.countText, { color: primaryColor }]}>{group.items.length} món</ThemedText>
                                </View>
                            </View>

                            {/* Items in Group */}
                            {group.items.length === 0 ? (
                                <View style={styles.emptyGroup}>
                                    <ThemedText style={{ color: mutedColor, fontSize: 13, fontFamily: 'Poppins' }}>Chưa có món trong nhóm này</ThemedText>
                                </View>
                            ) : (
                                group.items.map(item => (
                                    <Card key={item.MaMon} style={[styles.card, { backgroundColor: cardColor, borderColor }]} variant="elevated">
                                        <View style={styles.cardLeft}>
                                            <View style={[styles.itemIconCircle, { backgroundColor: '#FEF9E7' }]}>
                                                <ThemedText style={{ fontSize: 20 }}>☕</ThemedText>
                                            </View>
                                            <View style={styles.cardContent}>
                                                <ThemedText type='defaultSemiBold' style={styles.itemTitle}>{item.TenMon}</ThemedText>
                                                <ThemedText style={[styles.itemPrice, { color: primaryColor }]}>
                                                    {numeral(item.DonGia).format('0,0')} đ <ThemedText style={[styles.itemUnit, { color: mutedColor }]}>/ {item.DVT}</ThemedText>
                                                </ThemedText>
                                            </View>
                                        </View>

                                        <View style={styles.cardFeatures}>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: '#EBF5FB' }]}
                                                onPress={() => router.push({ pathname: '/themmon', params: { MaMon: item.MaMon } })}
                                            >
                                                <Entypo name="edit" size={16} color="#3498DB" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: '#FDEDEC' }]}
                                                onPress={() => handleDelete(`${item.MaMon}`)}
                                            >
                                                <Entypo name="trash" size={16} color="#E74C3C" />
                                            </TouchableOpacity>
                                        </View>
                                    </Card>
                                ))
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <ThemedText style={{ fontSize: 40 }}>📋</ThemedText>
                        <ThemedText style={[styles.emptyText, { color: mutedColor }]}>Chưa có thực đơn nào</ThemedText>
                        <TouchableOpacity style={[styles.addFirstBtn, { backgroundColor: primaryColor }]} onPress={() => router.push('/themmon')}>
                            <ThemedText style={{ color: '#fff', fontFamily: 'PoppinsBold' }}>+ Thêm Món Ngay</ThemedText>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Floating Action Button */}
            <TouchableOpacity style={[styles.fab, { backgroundColor: primaryColor }]} onPress={() => router.push('/themmon')}>
                <AntDesign name="plus" size={24} color="#fff" />
            </TouchableOpacity>
        </ThemedView>
    )
}

export default Menu

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBarBtn: {
        marginRight: 8,
        padding: 4,
    },
    actionSheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    actionSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 8,
        paddingBottom: 32,
        paddingHorizontal: 20,
        elevation: 10,
    },
    actionSheetTitle: {
        fontFamily: 'PoppinsBold',
        fontSize: 16,
        textAlign: 'center',
        paddingVertical: 16,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
    },
    actionText: {
        fontSize: 15,
        fontFamily: 'Poppins',
    },
    divider: {
        height: 1,
        opacity: 0.3,
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
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 80,
    },
    groupSection: {
        marginBottom: 20,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    groupTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsBold',
    },
    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    countText: {
        fontSize: 12,
        fontFamily: 'PoppinsBold',
    },
    emptyGroup: {
        padding: 12,
        alignItems: 'center',
    },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    itemIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontFamily: 'PoppinsBold',
    },
    itemPrice: {
        fontSize: 13,
        fontFamily: 'PoppinsBold',
        marginTop: 2,
    },
    itemUnit: {
        fontSize: 12,
        fontFamily: 'Poppins',
    },
    cardFeatures: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        fontFamily: 'Poppins',
    },
    addFirstBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 4,
    },
})
