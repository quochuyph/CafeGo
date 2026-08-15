import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useThemeColor } from '@/hooks/useThemeColor';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { addDoc, collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { firestore } from '../firebaseConfig.js';
const numeral = require('numeral');

type NhomMon = { MaLoai: number, TenLoai: string, userId: string };

const ThemMon = () => {
    const { MaMon } = useLocalSearchParams()
    const { colors } = useTheme()

    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');
    const textColor = useThemeColor({}, 'text');

    const [nhomMonData, setNhomMonData] = useState<NhomMon[]>([])
    const [editMode, setEditMode] = useState(false)

    const [tenMon, setTenMon] = useState('')
    const [maLoai, setMaLoai] = useState('')
    const [giaBan, setGiaBan] = useState('')
    const [DVT, setDVT] = useState('')
    const [selectedValue, setSelectedValue] = useState('');

    const [isModalVisible, setModalVisible] = useState(false);
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
            }
        };
        loadUid();
    }, []);

    const loadData = async () => {
        const result = await database.getAllAsync<NhomMon>("SELECT * FROM nhommon;")
        setNhomMonData(result)
    }

    const loadDataUpdate = async () => {
        const result = await database.getFirstAsync<{
            TenMon: string;
            MaLoai: number;
            DonGia: number;
            DVT: string;
        }>("SELECT TenMon, MaLoai, DonGia, DVT FROM menu WHERE MaMon = ?;", [parseInt(MaMon as string)]);
        if (result) {
            setTenMon(result.TenMon);
            setMaLoai(result.MaLoai.toString());
            setGiaBan(result.DonGia.toString());
            setDVT(result.DVT);

            const tenLoaiSelected = await database.getFirstAsync<{
                TenLoai: string;
            }>("SELECT TenLoai FROM nhommon WHERE MaLoai =?;", [result.MaLoai.toString()])
            if (tenLoaiSelected) {
                setSelectedValue(tenLoaiSelected.TenLoai)
            }
        }
    }

    const handleSave = async () => {
        if (!tenMon.trim() || !maLoai || !giaBan.trim() || !DVT.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các trường thông tin');
            return;
        }
        setLoading(true)
        try {
            const result = await database.runAsync("INSERT INTO menu (TenMon, MaLoai, DonGia, DVT, userId) VALUES (?, ?, ?, ?, ?);", [
                tenMon.trim(),
                maLoai,
                Number(giaBan),
                DVT.trim(),
                uid
            ])

            const newMaMon = result.lastInsertRowId;

            await addDoc(collection(firestore, "menu"), {
                MaMon: newMaMon,
                TenMon: tenMon.trim(),
                MaLoai: Number(maLoai),
                DonGia: Number(giaBan),
                DVT: DVT.trim(),
                userId: uid,
            });

            Alert.alert('Thành công', 'Đã thêm món mới vào thực đơn!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (MaMon) {
            setEditMode(true)
            loadDataUpdate()
        }
    }, [MaMon])

    const handleUpdate = async () => {
        if (!tenMon.trim() || !maLoai || !giaBan.trim() || !DVT.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các trường thông tin');
            return;
        }
        setLoading(true)
        try {
            const q = query(
                collection(firestore, "menu"),
                where("MaMon", "==", parseInt(MaMon as string)),
                where("userId", "==", uid)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, {
                    TenMon: tenMon.trim(),
                    MaLoai: Number(maLoai),
                    DonGia: Number(giaBan),
                    DVT: DVT.trim(),
                });
            }

            await database.runAsync(
                `UPDATE menu SET TenMon = ?, MaLoai = ?, DonGia = ?, DVT = ? WHERE MaMon = ? AND userId = ?`,
                [tenMon.trim(), Number(maLoai), Number(giaBan), DVT.trim(), parseInt(MaMon as string), uid]
            )

            Alert.alert('Thành công', 'Đã cập nhật món thành công!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error("Error updating item:", error)
        } finally {
            setLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadData()
        }, [])
    )

    const toggleModal = () => setModalVisible(!isModalVisible);

    const handleSelect = (item: NhomMon) => {
        setSelectedValue(item.TenLoai)
        setMaLoai(item.MaLoai.toString())
        toggleModal();
    };

    if (loading || uid === null) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={{ padding: 24, textAlign: 'center' }}>Đang tải...</ThemedText>
            </ThemedView>
        )
    }

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Card style={[styles.card, { backgroundColor: cardColor, borderColor }]} variant="elevated">
                    <View style={styles.iconCircle}>
                        <ThemedText style={{ fontSize: 28 }}>☕</ThemedText>
                    </View>

                    <ThemedText type="title" style={styles.formTitle}>
                        {editMode ? "Chỉnh Sửa Món" : "Thêm Món Mới"}
                    </ThemedText>

                    {/* Tên Món */}
                    <View style={styles.inputGroup}>
                        <ThemedText type="defaultSemiBold" style={styles.label}>
                            Tên Món <ThemedText style={{ color: '#E74C3C' }}>*</ThemedText>
                        </ThemedText>
                        <TextInput
                            style={[styles.input, { color: textColor, borderColor }]}
                            value={tenMon}
                            onChangeText={setTenMon}
                            placeholder='Ví dụ: Cà phê sữa đá, Bạc xỉu...'
                            placeholderTextColor={mutedColor}
                        />
                    </View>

                    {/* Chọn Nhóm Món */}
                    <View style={styles.inputGroup}>
                        <ThemedText type="defaultSemiBold" style={styles.label}>
                            Nhóm Món <ThemedText style={{ color: '#E74C3C' }}>*</ThemedText>
                        </ThemedText>
                        <TouchableOpacity
                            style={[styles.pickerButton, { borderColor }]}
                            onPress={toggleModal}
                        >
                            <ThemedText style={[styles.pickerText, !selectedValue && { color: mutedColor }]}>
                                {selectedValue || "Chọn nhóm món..."}
                            </ThemedText>
                            <AntDesign name="down" size={16} color={mutedColor} />
                        </TouchableOpacity>

                        <Modal visible={isModalVisible} transparent animationType="fade">
                            <View style={styles.modalOverlay}>
                                <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                                    <View style={styles.modalHeaderRow}>
                                        <ThemedText type="title" style={{ fontSize: 18 }}>Chọn Nhóm Món</ThemedText>
                                        <TouchableOpacity onPress={toggleModal}>
                                            <AntDesign name="close" size={20} color={mutedColor} />
                                        </TouchableOpacity>
                                    </View>

                                    <FlatList
                                        data={nhomMonData}
                                        keyExtractor={(item) => item.MaLoai.toString()}
                                        style={{ maxHeight: 300 }}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={[styles.optionRow, { borderBottomColor: borderColor }]}
                                                onPress={() => handleSelect(item)}
                                            >
                                                <ThemedText style={styles.optionText}>{item.TenLoai}</ThemedText>
                                                {selectedValue === item.TenLoai && (
                                                    <MaterialIcons name="check" size={20} color={primaryColor} />
                                                )}
                                            </TouchableOpacity>
                                        )}
                                        ListEmptyComponent={
                                            <ThemedText style={{ padding: 16, textAlign: 'center', color: mutedColor }}>
                                                Chưa có nhóm món nào. Vui lòng tạo nhóm món trước.
                                            </ThemedText>
                                        }
                                    />
                                </View>
                            </View>
                        </Modal>
                    </View>

                    {/* Giá Bán */}
                    <View style={styles.inputGroup}>
                        <ThemedText type="defaultSemiBold" style={styles.label}>
                            Đơn Giá (VNĐ) <ThemedText style={{ color: '#E74C3C' }}>*</ThemedText>
                        </ThemedText>
                        <TextInput
                            style={[styles.input, { color: textColor, borderColor }]}
                            keyboardType='numeric'
                            value={giaBan}
                            onChangeText={setGiaBan}
                            placeholder='Ví dụ: 25000'
                            placeholderTextColor={mutedColor}
                        />
                        {giaBan ? (
                            <ThemedText style={{ fontSize: 12, color: primaryColor, marginTop: 4, fontFamily: 'PoppinsBold' }}>
                                = {numeral(giaBan).format('0,0')} đ
                            </ThemedText>
                        ) : null}
                    </View>

                    {/* Đơn Vị Tính */}
                    <View style={styles.inputGroup}>
                        <ThemedText type="defaultSemiBold" style={styles.label}>
                            Đơn Vị Tính <ThemedText style={{ color: '#E74C3C' }}>*</ThemedText>
                        </ThemedText>
                        <TextInput
                            style={[styles.input, { color: textColor, borderColor }]}
                            value={DVT}
                            onChangeText={setDVT}
                            placeholder='Ví dụ: Ly, Chai, Phần, Đĩa...'
                            placeholderTextColor={mutedColor}
                        />
                    </View>

                    <Button
                        title={editMode ? "Cập Nhật Món" : "Lưu Món Mới"}
                        onPress={editMode ? handleUpdate : handleSave}
                        loading={loading}
                        style={styles.submitBtn}
                    />
                </Card>
            </ScrollView>
        </ThemedView>
    )
}

export default ThemMon

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 36,
    },
    card: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEF9E7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    formTitle: {
        fontSize: 20,
        marginBottom: 20,
        textAlign: 'center',
    },
    inputGroup: {
        width: '100%',
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        fontSize: 14,
    },
    input: {
        width: '100%',
        borderWidth: 1.5,
        borderRadius: 12,
        fontSize: 15,
        height: 50,
        paddingHorizontal: 16,
        fontFamily: 'Poppins',
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 12,
        height: 50,
        paddingHorizontal: 16,
    },
    pickerText: {
        fontSize: 15,
        fontFamily: 'Poppins',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    modalContent: {
        width: "100%",
        borderRadius: 20,
        padding: 20,
        elevation: 10,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E8DDD5',
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    optionText: {
        fontSize: 15,
        fontFamily: 'Poppins',
    },
    submitBtn: {
        width: '100%',
        height: 50,
        borderRadius: 12,
        marginTop: 8,
    },
})