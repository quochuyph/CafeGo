import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getActiveOwnerId, getUserRole } from '@/hooks/auth';
import { ShopCollection, useOnShopDataSynced } from '@/hooks/useShopRealtimeSync';
import { useThemeColor } from '@/hooks/useThemeColor';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BanType = { MaBan: number, TenBan: string, TrangThai: string }

const COLUMN_COUNT = 3;
const BAN_SYNC_COLLECTIONS: ShopCollection[] = ['ban'];

const Table = () => {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const itemWidth = Math.floor((width - 40 - 12 * (COLUMN_COUNT - 1)) / COLUMN_COUNT);

    const primaryColor = useThemeColor({}, 'primary');
    const textColor = useThemeColor({}, 'text');
    const iconColor = useThemeColor({}, 'icon');
    const cardColor = useThemeColor({}, 'card');
    const inputBg = useThemeColor({}, 'inputBackground');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');

    const infoColor = useThemeColor({}, 'info');
    const infoBg = useThemeColor({}, 'infoBg');
    const purpleColor = useThemeColor({}, 'purple');
    const purpleBg = useThemeColor({}, 'purpleBg');
    const errorColor = useThemeColor({}, 'error');
    const dangerBg = useThemeColor({}, 'dangerBg');

    const tableEmpty = useThemeColor({}, 'tableEmpty');
    const tableEmptyBorder = useThemeColor({}, 'tableEmptyBorder');
    const tableEmptyText = useThemeColor({}, 'tableEmptyText');
    const tableServing = useThemeColor({}, 'tableServing');
    const tableServingBorder = useThemeColor({}, 'tableServingBorder');
    const tableServingText = useThemeColor({}, 'tableServingText');
    const tableBooked = useThemeColor({}, 'tableBooked');
    const tableBookedBorder = useThemeColor({}, 'tableBookedBorder');
    const tableBookedText = useThemeColor({}, 'tableBookedText');

    const [showActionSheet, setShowActionSheet] = useState(false);
    const [banData, setBanData] = useState<BanType[]>([]);
    const [filterData, setFilterData] = useState<BanType[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const searchQueryRef = useRef('');
    const [banTrongAmount, setbanTrongAmount] = useState(0);
    const [banDatTruocAmount, setbanDatTruocAmount] = useState(0);
    const [banDangPhucVuAmount, setbanDangPhucVuAmount] = useState(0);
    const [isOwner, setIsOwner] = useState(false);

    const database = useSQLiteContext();

    useEffect(() => {
        getUserRole().then(role => setIsOwner(role === 'owner'));
    }, []);

    const loadData = useCallback(async () => {
        const ownerId = await getActiveOwnerId();
        if (ownerId === null) {
            router.replace('/');
            return;
        }
        const result = await database.getAllAsync<BanType>("SELECT * FROM ban WHERE userId = ?;", [ownerId]);
        setBanData(result);
        const currentQuery = searchQueryRef.current;
        if (currentQuery) {
            setFilterData(result.filter(item =>
                (item.TenBan || '').toUpperCase().includes(currentQuery.toUpperCase())
            ));
        } else {
            setFilterData(result);
        }
        setbanTrongAmount(result.filter(b => b.TrangThai === 'Trống').length);
        setbanDatTruocAmount(result.filter(b => b.TrangThai === 'Đã Đặt Trước').length);
        setbanDangPhucVuAmount(result.filter(b => b.TrangThai === 'Đang Phục Vụ').length);
    }, [database]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        searchQueryRef.current = query;
        if (query) {
            setFilterData(banData.filter(item =>
                (item.TenBan || '').toUpperCase().includes(query.toUpperCase())
            ));
        } else {
            setFilterData(banData);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
    useOnShopDataSynced(BAN_SYNC_COLLECTIONS, loadData);

    const getTableColor = (trangThai: string) => {
        if (trangThai === 'Đang Phục Vụ') {
            return { bg: tableServing, border: tableServingBorder, label: tableServingText };
        }
        if (trangThai === 'Đã Đặt Trước') {
            return { bg: tableBooked, border: tableBookedBorder, label: tableBookedText };
        }
        return { bg: tableEmpty, border: tableEmptyBorder, label: tableEmptyText };
    };

    const renderItem = ({ item }: { item: BanType }) => {
        const tc = getTableColor(item.TrangThai);
        return (
            <TouchableOpacity
                style={[styles.tableItemWrapper, { width: itemWidth }]}
                onPress={() => router.push({ pathname: '/chitietban', params: { MaBan: item.MaBan } })}
                activeOpacity={0.8}
            >
                <View
                    style={[
                        styles.tableCard,
                        {
                            minHeight: Math.max(itemWidth, 108),
                            backgroundColor: tc.bg,
                            borderColor: tc.border,
                        },
                    ]}
                >
                    <Image style={styles.tableImg} source={require('@assets/table/table.png')} resizeMode="contain" />
                    <ThemedText
                        style={[styles.tableName, { color: tc.label }]}
                        type="defaultSemiBold"
                        numberOfLines={2}
                    >
                        {item.TenBan}
                    </ThemedText>
                    <View style={[styles.statusDot, { backgroundColor: tc.border, borderColor: cardColor }]} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen
                options={{
                    // Nhân viên không có quyền thêm/sửa bàn → ẩn menu tùy chọn
                    headerRight: isOwner ? () => (
                        <TouchableOpacity style={styles.topBarBtn} onPress={() => setShowActionSheet(true)}>
                            <MaterialCommunityIcons name="dots-vertical" size={24} color={iconColor} />
                        </TouchableOpacity>
                    ) : undefined
                }}
            />

            {/* Action Sheet Modal */}
            <Modal visible={isOwner && showActionSheet} transparent animationType="fade">
                <TouchableOpacity style={styles.actionSheetOverlay} activeOpacity={1} onPress={() => setShowActionSheet(false)}>
                    <View style={[styles.actionSheet, { backgroundColor: cardColor, paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
                        <ThemedText style={styles.actionSheetTitle}>Tùy chọn</ThemedText>
                        <TouchableOpacity style={styles.actionItem} onPress={() => { setShowActionSheet(false); router.push('/themban'); }}>
                            <AntDesign name="plus" size={20} color={primaryColor} />
                            <ThemedText style={[styles.actionText, { color: primaryColor, fontFamily: 'PoppinsBold' }]}>Thêm Bàn</ThemedText>
                        </TouchableOpacity>
                        <View style={[styles.divider, { backgroundColor: borderColor }]} />
                        <TouchableOpacity style={styles.actionItem} onPress={() => { setShowActionSheet(false); router.push('/quanlyban'); }}>
                            <AntDesign name="edit" size={20} color={iconColor} />
                            <ThemedText style={styles.actionText}>Quản Lý Bàn</ThemedText>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: inputBg, borderColor }]}>
                <AntDesign name="search" size={18} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                    style={[styles.searchInput, { color: textColor }]}
                    placeholder="Tìm kiếm bàn..."
                    placeholderTextColor={mutedColor}
                    clearButtonMode="always"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>

            {/* Stats Pills */}
            <View style={styles.statsContainer}>
                <View style={[styles.statPill, { backgroundColor: infoBg }]}>
                    <View style={[styles.statDot, { backgroundColor: infoColor }]} />
                    <ThemedText style={styles.statText}>
                        Trống: <ThemedText style={[styles.statNum, { color: infoColor }]}>{banTrongAmount}</ThemedText>
                    </ThemedText>
                </View>
                <View style={[styles.statPill, { backgroundColor: purpleBg }]}>
                    <View style={[styles.statDot, { backgroundColor: purpleColor }]} />
                    <ThemedText style={styles.statText}>
                        Đặt trước: <ThemedText style={[styles.statNum, { color: purpleColor }]}>{banDatTruocAmount}</ThemedText>
                    </ThemedText>
                </View>
                <View style={[styles.statPill, { backgroundColor: dangerBg }]}>
                    <View style={[styles.statDot, { backgroundColor: errorColor }]} />
                    <ThemedText style={styles.statText}>
                        Phục vụ: <ThemedText style={[styles.statNum, { color: errorColor }]}>{banDangPhucVuAmount}</ThemedText>
                    </ThemedText>
                </View>
            </View>

            {/* Table Grid */}
            <FlatList
                data={filterData}
                keyExtractor={(item) => item.MaBan.toString()}
                numColumns={COLUMN_COUNT}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <ThemedText style={{ fontSize: 40 }}>🪑</ThemedText>
                        <ThemedText style={[styles.emptyText, { color: mutedColor }]}>Chưa có bàn nào</ThemedText>
                        {isOwner ? (
                            <TouchableOpacity style={[styles.addBanBtn, { backgroundColor: primaryColor }]} onPress={() => router.push('/themban')}>
                                <ThemedText style={styles.addBanBtnText}>+ Thêm Bàn</ThemedText>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                }
            />
        </ThemedView>
    );
};

export default Table;

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBarBtn: { marginRight: 8, padding: 4 },
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
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
        fontSize: 16,
        fontFamily: 'Poppins',
    },
    divider: { height: 1, opacity: 0.3 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        paddingHorizontal: 14,
        minHeight: 48,
        borderRadius: 14,
        borderWidth: 1,
        marginTop: 16,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        minHeight: 46,
        paddingVertical: 8,
        fontSize: 15,
        fontFamily: 'Poppins',
        textAlignVertical: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 20,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    statPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statDot: { width: 8, height: 8, borderRadius: 4 },
    statText: { fontSize: 13, fontFamily: 'Poppins' },
    statNum: { fontSize: 13, fontFamily: 'PoppinsBold' },
    listContent: { paddingHorizontal: 20, paddingBottom: 24 },
    columnWrapper: { gap: 12 },
    tableItemWrapper: { marginBottom: 12 },
    tableCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 16,
        borderWidth: 1.5,
        position: 'relative',
    },
    tableImg: { width: 46, height: 40, marginBottom: 6 },
    tableName: { fontSize: 12, textAlign: 'center', lineHeight: 16 },
    statusDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
        gap: 12,
    },
    emptyText: { fontSize: 16, fontFamily: 'Poppins' },
    addBanBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    addBanBtnText: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 15 },
});
