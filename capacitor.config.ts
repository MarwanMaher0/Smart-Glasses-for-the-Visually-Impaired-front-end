import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'vue-camera-app',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
