import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/ui/Card';
import { useThemeColor } from '@/hooks/useThemeColor';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { collection, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { firestore } from '../firebaseConfig.js';

type NhomMon = { MaLoai: number, TenLoai: string, userId: string }

const QuanLyNhomMon = () => {
    const { colors } = useTheme()
    const primaryColor = useThemeColor({}, 'primary');
    const textColor = useThemeColor({}, 'text');
    const iconColor = useThemeColor({}, 'icon');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');

    const [nhomMonData, setNhomMonData] = useState<NhomMon[]>([])
    const [filterData, setFilterData] = useState<NhomMon[]>([])
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

    const loadData = async (storedUid: string) => {
        const result = await database.getAllAsync<NhomMon>("SELECT * FROM nhommon WHERE userId = ?;", [storedUid])
        setNhomMonData(result)
        if (searchQuery) {
            const newData = result.filter((item) => {
                const itemData = item.TenLoai ? item.TenLoai.toUpperCase() : ''
                const textData = searchQuery.toUpperCase()
                return itemData.indexOf(textData) > -1
            })
            setFilterData(newData)
        } else {
            setFilterData(result)
        }
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        if (query) {
            const newData = nhomMonData.filter((item) => {
                const itemData = item.TenLoai ? item.TenLoai.toUpperCase() : ''
                const textData = query.toUpperCase()
                return itemData.indexOf(textData) > -1
            })
            setFilterData(newData)
        } else {
            setFilterData(nhomMonData)
        }
    }

    const handleDelete = async (MaLoai: string) => {
        try {
            Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa nhóm món này không?', [
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
                            collection(firestore, "nhommon"),
                            where("userId", "==", uid),
                            where("MaLoai", "==", Number(MaLoai))
                        );

                        const snapshot = await getDocs(q);
                        snapshot.forEach(async (docSnap) => {
                            await deleteDoc(docSnap.ref);
                        });

                        await database.runAsync("DELETE FROM nhommon WHERE MaLoai = ?;", [MaLoai])
                        await loadData(uid)
                    }
                }
            ])
        } catch (error) {
            console.error(error)
        }
    }

    if (loading || uid === null) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={{ padding: 24, textAlign: 'center' }}>Đang tải...</ThemedText>
            </ThemedView>
        )
    }

    return (
        <ThemedView style={styles.container}>
            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: cardColor, borderColor }]}>
                <AntDesign name="search" size={18} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                    style={[styles.searchInput, { color: textColor }]}
                    placeholder='Tìm kiếm nhóm món...'
                    placeholderTextColor={mutedColor}
                    clearButtonMode='always'
                    autoCapitalize='none'
                    autoCorrect={false}
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>

            <FlatList
                data={filterData}
                contentContainerStyle={styles.listContent}
                keyExtractor={(item) => item.MaLoai.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    return (
                        <Card style={[styles.card, { backgroundColor: cardColor, borderColor }]} variant="elevated">
                            <View style={styles.cardLeft}>
                                <View style={[styles.iconCircle, { backgroundColor: '#F5EDE6' }]}>
                                    <MaterialIcons name="category" size={22} color={primaryColor} />
                                </View>
                                <ThemedText type='defaultSemiBold' style={styles.groupName}>{item.TenLoai}</ThemedText>
                            </View>
                            <View style={styles.cardFeatures}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#EBF5FB' }]}
                                    onPress={() => { router.push({ pathname: '/themnhommon', params: { MaLoai: item.MaLoai, userId: item.userId } }) }}
                                >
                                    <Entypo name="edit" size={16} color="#3498DB" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#FDEDEC' }]}
                                    onPress={() => handleDelete(`${item.MaLoai}`)}
                                >
                                    <Entypo name="trash" size={16} color="#E74C3C" />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    )
                }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <ThemedText style={{ fontSize: 40 }}>📁</ThemedText>
                        <ThemedText style={[styles.emptyText, { color: mutedColor }]}>Chưa có nhóm món nào</ThemedText>
                    </View>
                }
            />

            {/* Floating Action Button */}
            <TouchableOpacity style={[styles.fab, { backgroundColor: primaryColor }]} onPress={() => router.push('/themnhommon')}>
                <AntDesign name="plus" size={24} color="#fff" />
            </TouchableOpacity>
        </ThemedView>
    )
}

export default QuanLyNhomMon

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
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 80,
        gap: 10,
    },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupName: {
        fontSize: 15,
        fontFamily: 'PoppinsBold',
    },
    cardFeatures: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtn: {
        width: 36,
        height: 36,
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
})
