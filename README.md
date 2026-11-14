# AuraCycle 🌸

> **Privacy-First, Zero-Cloud Menstrual Cycle & Fertility Intelligence**

<div align="center">

[![Download Android APK](https://img.shields.io/badge/Download_APK-Android-f43f5e?style=for-the-badge&logo=android&logoColor=white)](https://github.com/manucmadhu/aura_cycle_public/raw/main/app-debug.apk)
[![GitHub Releases](https://img.shields.io/badge/Releases-v1.0.0-8b5cf6?style=for-the-badge&logo=github)](https://github.com/manucmadhu/aura_cycle_public/releases)
[![100% On-Device](https://img.shields.io/badge/Privacy-100%25_On--Device-0284c7?style=for-the-badge&logo=shieldcheck)](README.md#-privacy--security-philosophy)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)

</div>

AuraCycle is an open-source, air-gapped reproductive health tracker built with a strict **Zero-Server, Zero-Cloud** architecture. All cycle data, symptom logs, Basal Body Temperature (BBT) records, and fertility projections remain 100% on your device—never sent to any external server, analytics service, or third party.

---

## 📲 Download & Install on Android

Get the pre-built, ready-to-run Android package directly from the repository:

👉 **[Direct Download: AuraCycle APK (`app-debug.apk`)](https://github.com/manucmadhu/aura_cycle_public/raw/main/app-debug.apk)**

### Quick Android Install Steps:
1. Tap the download link above on your Android phone (or download on PC and transfer to phone).
2. When prompted by your browser, tap **Download anyway** and then **Open**.
3. If Android displays *"For your security, your phone is not allowed to install unknown apps from this source"*, tap **Settings** and toggle **"Allow from this source"**.
4. Tap **Install** and enjoy a completely private, offline cycle tracking experience.

---

## ✨ Features at a Glance

### 🔒 100% On-Device Privacy
- **Zero Cloud, Zero Accounts**: No email, passwords, logins, or telemetry.
- **Air-Gapped Operation**: Functions completely offline in airplane mode.
- **Local PIN Vault**: Optional 4-digit biometric-style keypad lock to protect sensitive records on shared devices.
- **Full Data Sovereignty**: Export complete backups as formatted JSON or CSV spreadsheets (compatible with Excel, Apple Health, or doctor consultations) anytime.

### 🧠 Smart Predictive Engine
- **Weighted Moving Average (WMA)**: Intelligently adapts cycle length and period duration based on your last 12 logged cycles.
- **Outlier Filtering**: Automatically identifies and ignores abnormal cycles (< 21 days or > 45 days) so temporary stress or illness doesn't skew your baseline forecasts.
- **Manual Mode Override**: Set fixed cycle lengths, luteal phase durations, and period lengths if preferred.
- **Long-Range Projections**: Accurately forecasts your next 6 upcoming cycles, fertile windows, and ovulation peaks with confidence intervals ($\pm X$ days).

### 🩸 Comprehensive Daily Body Logger
- **Menstrual Flow Tracking**: Log Spotting, Light, Medium, or Heavy flow.
- **Basal Body Temperature (BBT)**: High-precision morning temperature logging with automatic Celsius (°C) and Fahrenheit (°F) conversion and biphasic thermal curve analysis with luteal coverline visualization.
- **Cervical Fluid Consistency**: Track fertility markers from dry to peak egg-white.
- **Hydration Tracker**: Interactive daily water intake counter.
- **Symptoms & Moods**: Pre-configured symptom list (Cramps, Lower Backache, Bloating, Breast Tenderness, Migraines, Cravings, Fatigue) plus the ability to create unlimited custom symptom tags (e.g., *Iron Supplement*, *Yoga*, *Acupuncture*).
- **Encrypted Daily Notes**: Private daily journaling stored strictly in browser sandbox storage.

### 🔮 Local Symptom & Phase Forecasting
- **Statistical Phase Pattern Matching**: Predicts symptom and mood probabilities for upcoming days and phases based on your personal cycle history.
- **Hormone Wave Visualizer**: Educational curves illustrating Estrogen, Progesterone, and LH fluctuations across your Menstrual, Follicular, Ovulatory, and Luteal phases.

### 🕰️ Multi-Year & Past Cycle Batch Importer
- **Historical Backfill**: Enter period dates from previous years or months in seconds.
- Multi-year calendar browser with quick-jump controls to view or log any month or year.

### 🍫 Personalized Comfort Care
- **Customizable Care Message**: Welcomes the user by name upon first launch and presents a personalized comfort card during period days with gentle reminders to hydrate, rest, and care for themselves.
- Dynamic name and message editing from the settings vault at any time.

---

## 📱 Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Mobile Runtime**: [Capacitor 8](https://capacitorjs.com/) (Android)
- **Code Quality**: [Oxlint](https://oxc.rs/)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) and `npm` installed.

### Installation

1. Navigate to the project directory:
   ```bash
   cd aura_cycle
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. Build for production:
   ```bash
   npm run build
   ```

5. Run linter:
   ```bash
   npm run lint
   ```

---

## 🤖 Android Native App (Capacitor)

AuraCycle is fully configured to run natively on Android devices using Capacitor.

### Pre-built APK
A pre-compiled debug APK is available in the repository root: [`app-debug.apk`](file:///c:/Users/MANU/Downloads/aura_cycle/aura_cycle/app-debug.apk). You can download and install it directly onto any Android device.

### Building from Source

1. Build the web distribution:
   ```bash
   npm run build
   ```

2. Sync assets with the Android project:
   ```bash
   npx cap sync android
   ```

3. Open the native Android project in Android Studio:
   ```bash
   npx cap open android
   ```

4. Run on a connected Android phone or emulator, or build an APK via:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   The APK will be generated at `android/app/build/outputs/apk/debug/app-debug.apk`.

### PWA / Browser Installation (No Android Studio Required)

You can also run AuraCycle as a standalone app directly through your mobile browser:
1. Open the deployed URL or local server in **Chrome** or **Brave** on your Android device.
2. Tap the browser menu (`⋮`) in the top-right corner.
3. Select **"Add to Home screen"** or **"Install App"**.
4. AuraCycle will launch in full-screen standalone mode with its own app icon and offline storage.

---

## 📂 Project Structure

```text
aura_cycle/
├── android/                   # Native Android Capacitor wrapper project
│   └── app/                   # Android app source, manifests, and icons
├── public/                    # Static icons, favicons, and assets
├── src/
│   ├── assets/                # App illustrations and graphics
│   ├── App.jsx                # Main application, state management & views
│   ├── index.css              # Global styles & Tailwind directives
│   └── main.jsx               # React DOM entry point
├── app-debug.apk              # Ready-to-install Android APK
├── capacitor.config.json      # Capacitor configuration
├── package.json               # Project scripts and dependencies
├── tailwind.config.js         # Tailwind configuration
└── vite.config.js             # Vite bundler configuration
```

---

## 🔐 Privacy & Security Philosophy

Commercial reproductive tracking applications often monetize user data or share sensitive health insights with third-party advertising networks. AuraCycle was designed to eliminate that risk entirely:

| Concern | AuraCycle Architecture |
| :--- | :--- |
| **Server Storage** | ❌ None. There are no remote databases or backend APIs. |
| **Telemetry / Analytics** | ❌ None. No Google Analytics, Mixpanel, Sentry, or tracking pixels. |
| **User Identification** | ❌ Anonymous. No account creation, email verification, or phone numbers. |
| **Data Encryption** | ✅ Protected by your device's sandbox and optional in-app 4-digit PIN lock. |
| **Data Portability** | ✅ 1-click JSON and CSV export/import directly to local device storage. |

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
