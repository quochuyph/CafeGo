# Changelog

Tất cả thay đổi đáng chú ý của dự án được ghi lại tại đây.
Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/) và tuân theo [Semantic Versioning](https://semver.org/lang/vi/).

## [Unreleased]

### Changed
- Nâng cấp dự án lên **Expo SDK 58** (`expo ~58.0.23`), **React Native 0.88.1**, **React 19.3.0**, **Expo Router 58** và **TypeScript 6.0**.
- Cập nhật `app.json` theo schema SDK 58 (gỡ bỏ `newArchEnabled`, `android.edgeToEdgeEnabled`, và cấu hình cứng `compileSdkVersion: 36` để dùng mặc định Android SDK 37 của SDK 58).
- Cập nhật Node.js trong GitHub Actions CI lên phiên bản 22 LTS.
- Tái cấu trúc dự án theo chuẩn `src/`: `src/app`, `src/components`, `src/config`, `src/constants`, `src/database`, `src/hooks`, `src/theme`.
- Nhóm màn hình theo Expo Router route groups: `(auth)`, `(account)`, `(orders)`, `(management)` — URL không đổi.
- Cấu hình Firebase và URL dịch vụ OTP chuyển sang biến môi trường (`.env`, xem `.env.example`).
- Tách schema SQLite ra `src/database/schema.ts`.
- Đọc phiên bản ứng dụng qua `expo-constants` thay vì import `app.json`.
- Service account Google Play chuyển vào thư mục `credentials/` (đã gitignore).

### Added
- Tùy chọn giao diện hiển thị **Sáng / Tối / Hệ thống** (`ThemePreferenceContext` lưu trữ qua `AsyncStorage`), kèm nút chuyển nhanh Sáng/Tối tại màn hình chào, đăng nhập, trang chủ và bộ chọn 3 chế độ trong phần Tài khoản.
- `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`, `.editorconfig`, `.env.example`.
- GitHub Actions CI (lint + typecheck), issue & pull request templates.
- Scripts `typecheck`, `lint:fix`, `build:preview`, `build:prod`, `submit:android`, `update`.

### Fixed
- Khắc phục lỗi mất dấu tiếng Việt, cắt chữ trong `ThemedText` và `TextInput` trên Android bằng cơ chế tự động tính `lineHeight` theo `fontSize` và căn chỉnh `minHeight`/`textAlignVertical`.
- Khắc phục lỗi chữ chồng chéo, tràn khung trên các thẻ bàn, hóa đơn, thanh toán, thực đơn, nhóm món và tiêu đề trang chủ.
- Chuẩn hóa hệ màu tương phản cao cho cả Light Mode và Dark Mode (khắc phục lỗi chữ trắng trên nền pastel sáng ở thống kê bàn, huy hiệu số lượng món, ô nhập mật khẩu).
- Chuẩn hóa nút quay lại trên thanh điều hướng (`headerBackButtonDisplayMode: 'minimal'`), loại bỏ nhãn lộ tên route `dashboard`.

### Removed
- Các file mẫu không dùng từ Expo template (`HelloWave`, `ParallaxScrollView`, `Collapsible`, `ExternalLink`, `HapticTab`, `IconSymbol`, `TabBarBackground`, `constants/Colors.ts`, `scripts/reset-project.js`, ảnh react-logo).
- `firebaseConfig.demo.js` (thay bằng `.env.example`).

## [8.0.0]

- Phiên bản phát hành hiện tại trên Google Play (internal track).

