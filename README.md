<div align="center">

# ☕ CaféGo - Ứng Dụng Quản Lý Quán Café Thông Minh

**Giải pháp quản lý bàn, order món, in bill và kiểm soát doanh thu chuyên nghiệp dành cho quán cà phê, trà sữa & nhà hàng.**

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-54.0.36-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Offline_First-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-4E9A06?style=for-the-badge)](https://expo.dev/)

</div>

---

## 📌 Giới Thiệu (Overview)

**CaféGo** là ứng dụng di động đa nền tảng được phát triển trên nền tảng **React Native & Expo**, hướng tới việc tối ưu hóa quy trình vận hành và phục vụ tại các quán cà phê, quán trà sữa và nhà hàng vừa và nhỏ. 

Với kiến trúc dữ liệu lai (**Hybrid Architecture**) kết hợp giữa cơ sở dữ liệu cục bộ **SQLite** (Offline-First, tốc độ phản hồi tức thì) và **Cloud Firestore** (Đồng bộ đa thiết bị, an toàn dữ liệu), CaféGo mang đến trải nghiệm mượt mà, ổn định ngay cả trong điều kiện mạng yếu hoặc gián đoạn.

---

## ✨ Tính Năng Nổi Bật (Key Features)

### 🪑 1. Quản Lý Sơ Đồ Bàn (Table Management)
- **Trực quan hóa trạng thái bàn**: Phân biệt rõ ràng theo mã màu (Bàn Trống, Đang phục vụ, Đã đặt trước).
- **Thao tác nhanh**: Thêm bàn mới, chỉnh sửa thông tin bàn, xóa bàn dễ dàng.
- **Xem chi tiết bàn**: Tra cứu nhanh danh sách món khách đang gọi, thời gian khách vào và tổng tiền tạm tính.

### 📋 2. Quản Lý Thực Đơn & Nhóm Món (Menu & Categories)
- **Phân loại nhóm món**: Phân chia thực đơn theo từng danh mục (Cà phê, Trà hoa quả, Sinh tố, Đồ ăn vặt,...).
- **Thêm/Sửa món linh hoạt**: Cập nhật tên món, đơn vị tính (Ly, Chai, Đĩa...), đơn giá và nhóm tương ứng.
- **Tìm kiếm thông minh**: Tìm kiếm món ăn/đồ uống theo tên hoặc danh mục nhanh chóng.

### ⚡ 3. Order & Gọi Món Tại Bàn (Smart Ordering)
- Chọn món và thêm trực tiếp vào hóa đơn của từng bàn.
- Tùy chỉnh tăng/giảm số lượng món, ghi chú yêu cầu của khách (ít đá, ít đường,...).
- Tự động tính toán tổng số tiền theo thời gian thực.

### 💳 4. Thanh Toán & In Hóa Đơn (Billing & Thermal Printing)
- **Thanh toán chính xác**: Hỗ trợ nhập tiền khách đưa, tự động tính tiền thối thừa.
- **In hóa đơn chuyên nghiệp**: Tích hợp module in bill (`expo-print`) xuất hóa đơn chuẩn máy in bill nhiệt khổ K57/K80 hoặc lưu/chia sẻ dưới định dạng PDF.
- **Hoàn tất hóa đơn**: Tự động giải phóng bàn về trạng thái "Trống" sau khi thanh toán.

### 📊 5. Quản Lý Hóa Đơn & Doanh Thu (Invoices & History)
- Xem lại lịch sử tất cả các hóa đơn đã thanh toán theo ngày, giờ.
- Tra cứu chi tiết từng hóa đơn cũ kèm danh sách các món đã phục vụ.

### 🔄 6. Đồng Bộ Dữ Liệu Lai (Hybrid Sync: SQLite + Firestore)
- **Offline-First**: Mọi thao tác ghi/đọc dữ liệu bán hàng diễn ra siêu tốc trên SQLite nội bộ máy.
- **Cloud Backup & Sync**: Tự động đồng bộ hai chiều lên Firebase Firestore theo User ID, đảm bảo không bao giờ bị mất dữ liệu khi đổi thiết bị.

### 🔐 7. Xác Thực & Bảo Mật (Authentication & Security)
- Đăng ký / Đăng nhập tài khoản quản lý.
- Mã hóa bảo mật mật khẩu với `bcryptjs`.
- **Khôi phục mật khẩu qua Email**: Tích hợp gửi mã OTP xác thực qua Email an toàn, tiện lợi.

### 🎨 8. Giao Diện Hiện Đại & Chuẩn UX/UI (Modern Theme)
- Bảng màu lấy cảm hứng từ cà phê ấm cúng (**Espresso Brown** `#B5451B` & **Caramel Gold** `#F5A623`).
- Hỗ trợ đầy đủ chế độ **Light Mode** & **Dark Mode** (`VSDarkTheme`).
- Hiệu ứng chuyển động mượt mà với `react-native-reanimated` và phản hồi xúc giác `expo-haptics`.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Hạng mục | Công nghệ / Thư viện |
|---|---|
| **Core Framework** | React Native `0.81.5`, React `19.1.0` |
| **App Platform** | Expo SDK `54.0.36` (New Architecture Enabled) |
| **Navigation & Routing** | Expo Router `~6.0.24` (File-based Routing) |
| **Ngôn ngữ** | TypeScript `~5.9.2` |
| **Local Database** | `expo-sqlite` (SQLite engine) & AsyncStorage |
| **Cloud Database / Auth** | Firebase Firestore & Firebase Auth `^12.0.0` |
| **UI & Icons** | `@expo/vector-icons`, `react-native-reanimated`, `expo-image`, `expo-blur` |
| **Hóa đơn & In ấn** | `expo-print`, `expo-sharing` |
| **Bảo mật** | `bcryptjs`, `expo-crypto` |
| **Build & Deploy** | EAS Build (Expo Application Services) |

---

## 📁 Cấu Trúc Thư Mục (Project Structure)

```text
QLCafe-main/
├── app/                          # File-based routing (Màn hình ứng dụng)
│   ├── _layout.tsx               # Root Layout, Theme Provider & SQLite Provider
│   ├── index.tsx                 # Màn hình Onboarding / Welcome
│   ├── authscreen.tsx            # Màn hình Đăng nhập / Đăng ký
│   ├── EmailVerificationScreen.tsx # Xác thực Email OTP
│   ├── RequestResetScreen.tsx    # Gửi yêu cầu quên mật khẩu
│   ├── ConfirmResetScreen.tsx    # Đặt lại mật khẩu mới
│   ├── dashboard.tsx             # Trang chủ Quản lý chính
│   ├── table.tsx                 # Sơ đồ và danh sách bàn
│   ├── themban.tsx               # Thêm bàn mới
│   ├── quanlyban.tsx             # Quản trị danh sách bàn
│   ├── chitietban.tsx            # Chi tiết bàn & gọi món
│   ├── menu.tsx                  # Danh sách thực đơn
│   ├── themmon.tsx               # Thêm món mới
│   ├── quanlynhommon.tsx         # Quản trị danh mục nhóm món
│   ├── themnhommon.tsx           # Thêm danh mục món
│   ├── payment.tsx               # Thanh toán & In hóa đơn
│   ├── quanlyhoadon.tsx          # Danh sách lịch sử hóa đơn
│   ├── hoadonban.tsx             # Chi tiết từng hóa đơn
│   ├── account.tsx               # Quản lý tài khoản cá nhân
│   └── chinhsuaaccount.tsx       # Chỉnh sửa thông tin tài khoản
├── assets/                       # Tài nguyên hình ảnh, icons, fonts
│   ├── dashboard/                # Icons chức năng Dashboard
│   ├── home/                     # Ảnh màn hình chào mừng
│   ├── fonts/                    # Bộ font Poppins tùy chỉnh
│   └── images/                   # App icon, adaptive icon, splash screen
├── components/                   # Components tái sử dụng
│   ├── ui/                       # Button, Card, Input, TabBar...
│   ├── Payment/                  # PaymentModal
│   ├── ThemedText.tsx            # Text theo Theme tự động
│   └── ThemedView.tsx            # View theo Theme tự động
├── theme/                        # Hệ thống màu sắc & Dark/Light Theme
│   ├── Colors.ts                 # Bảng mã màu chủ đạo
│   └── VSDarkTheme.ts            # Cấu hình Dark Theme
├── firebaseConfig.demo.js        # Mẫu cấu hình kết nối Firebase
├── eas.json                      # Cấu hình EAS Build (Android/iOS)
├── app.json                      # Cấu hình Expo App Metadata
├── package.json                  # Dependencies và scripts
└── README.md                     # Tài liệu hướng dẫn dự án
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng (Getting Started)

### 1. Yêu cầu môi trường
- **Node.js**: Phiên bản `>= 18.x` (khuyến nghị `20.x` LTS)
- **npm** hoặc **yarn**
- Ứng dụng **Expo Go** trên điện thoại (Android/iOS) hoặc Android Studio / Xcode Emulator

### 2. Cài đặt các gói phụ thuộc
Clone repository về máy và cài đặt dependencies:

```bash
# Clone repository
git clone https://github.com/quochuyph207/QLCafe.git
cd QLCafe-main

# Cài đặt thư viện
npm install
```

### 3. Cấu hình Firebase
Tạo file `firebaseConfig.js` tại thư mục gốc dựa trên file mẫu `firebaseConfig.demo.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore };
```

### 4. Khởi chạy ứng dụng (Development)

```bash
# Khởi động Metro Bundler
npx expo start

# Hoặc mở trực tiếp trên thiết bị Android
npx expo start --android

# Hoặc mở trực tiếp trên thiết bị iOS Simulator
npx expo start --ios
```

Quét mã QR hiển thị trên terminal bằng ứng dụng **Expo Go** trên điện thoại để trải nghiệm.

---

## 📦 Hướng Dẫn Đóng Gói / Build Ứng Dụng (EAS Build)

Dự án đã được cấu hình sẵn sàng với **Expo Application Services (EAS Build)**:

```bash
# 1. Cài đặt EAS CLI toàn cục nếu chưa có
npm install -g eas-cli

# 2. Đăng nhập tài khoản Expo
eas login

# 3. Build file APK dùng thử cho Android
eas build -p android --profile preview

# 4. Build bản Production phát hành lên Google Play Store
eas build -p android --profile production
```

---

## 👨‍💻 Tác Giả (Author)

- **Developer**: Quốc Huy ([@quochuyph207](https://quochuyph.id.vn))
- **Email**: `quochuyphbrvt@gmail.com`
- **Project**: CaféGo Mobile App (v8.0.0)

---

<div align="center">
  <sub>Được phát triển với niềm đam mê công nghệ và cà phê ☕❤️</sub>
</div>
