import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "com.commitd.app",
  appName: "CommitD",
  webDir: "www",
  server: {
    url: "https://app.commitd.site",
    cleartext: false,
    allowNavigation: [
      "app.commitd.site",
      "*.commitd.site",
      "commitd.site",
      "*.commitd.site",
    ],
  },
  plugins: {
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
      logLevel: 1,
    },
  },
};

export default config;
