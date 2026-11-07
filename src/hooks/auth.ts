import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'owner' | 'staff';

/** Tất cả các key phiên đăng nhập — dùng khi đăng xuất. */
export const SESSION_KEYS = [
    'userId', 'username', 'displayName', 'userPassword',
    'userEmail', 'userEmailVerified', 'userRole', 'activeOwnerId',
    'step', 'stepExpireAt',
];

export const saveUserData = async (
    userId: string,
    username: string,
    displayName: string | null | undefined,
    password: string,
    email: string | null | undefined,
    emailVerified: string,
    role: UserRole = 'owner',
    activeOwnerId: string = userId,
) => {
    try {
        // Lưu thông tin phân quyền trước để luôn có sẵn kể cả khi các trường sau lỗi
        await AsyncStorage.setItem('userRole', role);
        await AsyncStorage.setItem('activeOwnerId', activeOwnerId);
        await AsyncStorage.setItem('userId', userId);
        await AsyncStorage.setItem('username', username ?? '');
        await AsyncStorage.setItem('displayName', displayName ?? '');
        await AsyncStorage.setItem('userPassword', password ?? '');
        if (email) {
            await AsyncStorage.setItem('userEmail', email);
        } else {
            await AsyncStorage.removeItem('userEmail');
        }
        await AsyncStorage.setItem('userEmailVerified', emailVerified ?? 'false');
    } catch (error) {
        console.log(error)
    }
}

/**
 * ID của chủ quán dùng để truy vấn dữ liệu (menu, nhommon, ban, hoadon, chitiethd).
 * Fallback về userId cho phiên đăng nhập từ phiên bản cũ (chưa có key activeOwnerId).
 */
export const getActiveOwnerId = async (): Promise<string | null> => {
    const ownerId = await AsyncStorage.getItem('activeOwnerId');
    if (ownerId) return ownerId;
    return AsyncStorage.getItem('userId');
};

/** Vai trò người dùng hiện tại. Phiên cũ không có role → mặc định "owner". */
export const getUserRole = async (): Promise<UserRole> => {
    const role = await AsyncStorage.getItem('userRole');
    return role === 'staff' ? 'staff' : 'owner';
};
