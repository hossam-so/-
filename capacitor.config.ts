import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nobles.cards',
  appName: 'سكن النبلاء',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
