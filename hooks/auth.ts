import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveUserData = async (userId: string, username: string, displayName: string, password: string, email: string, emailVerified: string) => {
    try {
        await AsyncStorage.setItem('userId', userId);
        await AsyncStorage.setItem('username', username);
        await AsyncStorage.setItem('displayName', displayName);
        await AsyncStorage.setItem('userPassword', password);
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('userEmailVerified', emailVerified);
    } catch (error) {
        console.log(error)
    }
}
