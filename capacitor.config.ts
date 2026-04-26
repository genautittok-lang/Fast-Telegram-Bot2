import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.darkshare.osint",
  appName: "DARKSHARE",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
    allowNavigation: ["*.darkshare.app", "*.replit.app", "darkshare.app"],
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    backgroundColor: "#0a0a0a",
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0a0a0a",
    scheme: "DARKSHARE",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: "#0a0a0a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "small",
      iosSpinnerStyle: "small",
      spinnerColor: "#22d3ee",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0a0a0a",
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
