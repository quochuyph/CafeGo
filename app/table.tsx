import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@react-navigation/native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useState } from 'react';
import { Dimensions, FlatList, Image, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

type BanType = { MaBan: number, TenBan: string, TrangThai: string }

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_WIDTH = (width - 48 - (16 * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

const Table = () => {
    const { colors } = useTheme();
    const primaryColor = useThemeColor({}, 'primary');
    const textColor = useThemeColor({}, 'text');
    const iconColor = useThemeColor({}, 'icon');
    const cardColor = useThemeColor({}, 'card');
    const bgColor = useThemeColor({}, 'background');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');

    const [showActionSheet, setShowActionSheet] = useState(false);
    const [banData, setBanData] = useState<BanType[]>([]);
    const [filterData, setFilterData] = useState<BanType[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [banTrongAmount, setbanTrongAmount] = useState(0);
    const [banDatTruocAmount, setbanDatTruocAmount] = useState(0);
    const [banDangPhucVuAmount, setbanDangPhucVuAmount] = useState(0);

    const database = useSQLiteContext();

    const loadData = async () => {
        const result = await database.getAllAsync<BanType>("SELECT * FROM ban;");
        setBanData(result);
        setFilterData(result);
        setbanTrongAmount(result.filter(b => b.TrangThai === 'Trống').length);
        setbanDatTruocAmount(result.filter(b => b.TrangThai === 'Đã Đặt Trước').length);
        setbanDangPhucVuAmount(result.filter(b => b.TrangThai === 'Đang Phục Vụ').length);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query) {
            setFilterData(banData.filter(item =>
                (item.TenBan || '').toUpperCase().includes(query.toUpperCase())
            ));
        } else {
            setFilterData(banData);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const getTableColor = (trangThai: string) => {
        if (trangThai === 'Đang Phục Vụ') return { bg: '#FFACAC', border: '#E74C3C', label: '#C0392B' };
        if (trangThai === 'Đã Đặt Trước') return { bg: '#D39FE9', border: '#9B59B6', label: '#7D3C98' };
        return { bg: '#ABD3F9', border: '#3498DB', label: '#1A5276' };
    };

    const renderItem = ({ item }: { item: BanType }) => {
        const tc = getTableColor(item.TrangThai);
        return (
            <TouchableOpacity
                style={styles.tableItemWrapper}
                onPress={() => router.push({ pathname: '/chitietban', params: { MaBan: item.MaBan } })}
                activeOpacity={0.8}
            >
                <View style={[styles.tableCard, { backgroundColor: tc.bg, borderColor: tc.border }]}>
                    <Image style={styles.tableImg} source={require('../assets/table/table.png')} resizeMode="contain" />
                    <ThemedText style={[styles.tableName, { color: tc.label }]} type="defaultSemiBold">
                        {item.TenBan}
                    </ThemedText>
                    <View style={[styles.statusDot, { backgroundColor: tc.border }]} />
                </View>
            </TouchableOpacity>
        );
    };

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
                        <ThemedText style={styles.actionSheetTitle}>Tùy chọn</ThemedText>
                        <TouchableOpacity style={styles.actionItem} onPress={() => { setShowActionSheet(false); router.push('/themban'); }}>
                            <AntDesign name="plus" size={20} color={primaryColor} />
                            <ThemedText style={[styles.actionText, { color: primaryColor }]}>Thêm Bàn</ThemedText>
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
            <View style={[styles.searchContainer, { backgroundColor: cardColor, borderColor }]}>
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
                <View style={[styles.statPill, { backgroundColor: '#EBF5FB' }]}>
                    <View style={[styles.statDot, { backgroundColor: '#3498DB' }]} />
                    <ThemedText style={styles.statText}>Trống: <ThemedText style={[styles.statNum, { color: '#1A5276' }]}>{banTrongAmount}</ThemedText></ThemedText>
                </View>
                <View style={[styles.statPill, { backgroundColor: '#F5EEF8' }]}>
                    <View style={[styles.statDot, { backgroundColor: '#9B59B6' }]} />
                    <ThemedText style={styles.statText}>Đặt trước: <ThemedText style={[styles.statNum, { color: '#7D3C98' }]}>{banDatTruocAmount}</ThemedText></ThemedText>
                </View>
                <View style={[styles.statPill, { backgroundColor: '#FDEDEC' }]}>
                    <View style={[styles.statDot, { backgroundColor: '#E74C3C' }]} />
                    <ThemedText style={styles.statText}>Phục vụ: <ThemedText style={[styles.statNum, { color: '#C0392B' }]}>{banDangPhucVuAmount}</ThemedText></ThemedText>
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
                        <TouchableOpacity style={[styles.addBanBtn, { backgroundColor: primaryColor }]} onPress={() => router.push('/themban')}>
                            <ThemedText style={styles.addBanBtnText}>+ Thêm Bàn</ThemedText>
                        </TouchableOpacity>
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
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        marginTop: 16,
        marginBottom: 12,
    },
    searchInput: { flex: 1, fontSize: 15, fontFamily: 'Poppins' },
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
    statNum: { fontFamily: 'PoppinsBold' },
    listContent: { paddingHorizontal: 20, paddingBottom: 24 },
    columnWrapper: { gap: 16 },
    tableItemWrapper: { width: ITEM_WIDTH, marginBottom: 16 },
    tableCard: {
        height: ITEM_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 16,
        borderWidth: 2,
        position: 'relative',
    },
    tableImg: { width: '55%', height: '50%', marginBottom: 6 },
    tableName: { fontSize: 12, textAlign: 'center' },
    statusDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#fff',
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
