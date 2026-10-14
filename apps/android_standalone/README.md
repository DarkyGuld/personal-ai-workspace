# Android Trusted Web Activity (TWA) Wrapper Configuration

This directory contains the specifications and packaging instructions to wrap the **Personal AI Workspace** responsive PWA into an Android APK / AAB package using Google Chrome Labs' **Bubblewrap** (`@bubblewrap/cli@1.27.0`).

---

## 1. Prerequisites

- **Java Development Kit (JDK)**: JDK 17 or newer (`java -version` confirmed on host).
- **Android SDK Command-line Tools**: Android SDK API 34+ build-tools.
- **Node.js & Bubblewrap**:
  ```bash
  npm install -g @bubblewrap/cli
  ```

---

## 2. PWA & Digital Asset Links Verification

A Trusted Web Activity (TWA) opens full-screen without the browser URL bar if and only if **Digital Asset Links** are verified against a secure HTTPS domain.

1. **Host Verification**:
   Personal AI Workspace automatically serves `/.well-known/assetlinks.json` through the BFF (`apps/api/main.py`).
2. **Environment Variables**:
   Configure in `.env`:
   ```bash
   PAW_ANDROID_PACKAGE=com.personalai.workspace
   PAW_ANDROID_CERT_SHA256=YOUR_RELEASE_KEYSTORE_SHA256_FINGERPRINT
   ```
3. **Alternative for LAN / Tailscale**:
   If deploying on a private LAN or Tailscale IP without a public HTTPS domain, the responsive PWA can be installed directly from Google Chrome / Brave via the **Install App** button with identical functionality.

---

## 3. Automated APK Build Instructions

```bash
# 1. Initialize Bubblewrap TWA manifest from the live domain or local PWA build:
bubblewrap init --manifest=https://your-paw-domain.com/manifest.webmanifest

# 2. Build Debug APK:
bubblewrap build

# 3. Build Signed Release APK / AAB (Key never committed to Git):
bubblewrap build --keyPath=android.keystore --keyAlias=paw
```
