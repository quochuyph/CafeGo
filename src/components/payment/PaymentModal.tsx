// components/PaymentModal.tsx
import React, { useMemo } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface PaymentModalProps {
    visible: boolean;
    onClose: () => void;
    tienKhachDua: string;
    setTienKhachDua: (value: string) => void;
    tongTien: number;
    handleThanhToan: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    visible,
    onClose,
    tienKhachDua,
    setTienKhachDua,
    tongTien,
    handleThanhToan,
}) => {
    const tienThoi = useMemo(() => {
        const khach = parseInt(tienKhachDua || '0', 10);
        return khach >= tongTien ? khach - tongTien : 0;
    }, [tienKhachDua, tongTien]);

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Xác nhận thanh toán</Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.modalText}>Tổng tiền: </Text>
                        <Text style={styles.modalText}>{tongTien.toLocaleString()} VND</Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.modalText}>Tiền khách đưa: </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Tiền khách đưa"
                            keyboardType="numeric"
                            value={tienKhachDua}
                            onChangeText={setTienKhachDua}
                        />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.modalText}>Tiền thối lại: </Text>
                        <Text style={styles.modalText}>{tienThoi.toLocaleString()} VND</Text>
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity onPress={onClose} style={[styles.button, styles.cancel]}>
                            <Text style={styles.buttonText}>Huỷ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleThanhToan} style={[styles.button, styles.confirm]}>
                            <Text style={styles.buttonText}>Xác nhận</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default React.memo(PaymentModal);

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        margin: 20,
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 16,
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        width: 150,
        textAlign: 'right'
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    cancel: {
        backgroundColor: '#ccc',
    },
    confirm: {
        backgroundColor: '#28a745',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
