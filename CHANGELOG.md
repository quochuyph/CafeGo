# Changelog

Tất cả thay đổi đáng chú ý của dự án được ghi lại tại đây.
Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/) và tuân theo [Semantic Versioning](https://semver.org/lang/vi/).

## [Unreleased]

### Changed
- Tái cấu trúc dự án theo chuẩn `src/`: `src/app`, `src/components`, `src/config`, `src/constants`, `src/database`, `src/hooks`, `src/theme`.
- Nhóm màn hình theo Expo Router route groups: `(auth)`, `(account)`, `(orders)`, `(management)` — URL không đổi.
- Cấu hình Firebase và URL dịch vụ OTP chuyển sang biến môi trường (`.env`, xem `.env.example`).
- Tách schema SQLite ra `src/database/schema.ts`.
- Đọc phiên bản ứng dụng qua `expo-constants` thay vì import `app.json`.
- Service account Google Play chuyển vào thư mục `credentials/` (đã gitignore).

### Added
- `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`, `.editorconfig`, `.env.example`.
- GitHub Actions CI (lint + typecheck), issue & pull request templates.
- Scripts `typecheck`, `lint:fix`, `build:preview`, `build:prod`, `submit:android`, `update`.

### Removed
- Các file mẫu không dùng từ Expo template (`HelloWave`, `ParallaxScrollView`, `Collapsible`, `ExternalLink`, `HapticTab`, `IconSymbol`, `TabBarBackground`, `constants/Colors.ts`, `scripts/reset-project.js`, ảnh react-logo).
- `firebaseConfig.demo.js` (thay bằng `.env.example`).

## [8.0.0]

- Phiên bản phát hành hiện tại trên Google Play (internal track).

