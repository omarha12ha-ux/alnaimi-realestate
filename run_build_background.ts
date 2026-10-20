import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

try {
  const androidHome = '/root/android-sdk';
  console.log(`Setting up ANDROID_HOME at ${androidHome}...`);
  
  // Create directories
  fs.mkdirSync(path.join(androidHome, 'licenses'), { recursive: true });

  // Write licenses to bypass prompts
  const licenses = {
    'android-sdk-license': [
      '8933bad161af91782a7de402502c241551529c18',
      '24333f8a63b6825ea9c5514f83c2829b004d1fee',
      'd32f52b5912454b50e7a561c71a48576247e6531' // Google APIs license sometimes needed
    ].join('\n'),
    'android-sdk-preview-license': '84831b9409646a913e61a2538a2437492f22dedb',
    'intel-android-extra-license': 'd975f751698a77b662f1254ddbeed3901e025f6a',
    'google-gdk-license': 'ecbb513bc78927d8530e20ee43a9b6c00f6c2f42',
    'mips-android-sysimage-license': 'e5b31447db1c3caaa5ee33f4a1b01e3287a41074'
  };

  for (const [name, content] of Object.entries(licenses)) {
    fs.writeFileSync(path.join(androidHome, 'licenses', name), content);
  }

  console.log("Licenses pre-loaded!");

  // Clean log
  const logFile = 'build.log';
  if (fs.existsSync(logFile)) {
    fs.unlinkSync(logFile);
  }

  console.log("Starting build process in background...");
  
  // Set accurate environments pointing to Java and Android SDK
  const env = {
    ...process.env,
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: androidHome,
    // Enable auto download of SDK and build tools by Gradle (default is true, but make sure)
    GRADLE_OPTS: '-Dorg.gradle.daemon=false -Dorg.gradle.parallel=true -Dorg.gradle.project.android.builder.sdkDownload=true'
  };

  // Run build
  const child = exec('npx cap build android --androidreleasetype APK > build.log 2>&1', { env }, (error) => {
    if (error) {
      fs.appendFileSync(logFile, `\nBUILD FAILED WITH ERROR: ${error.message}\n`);
    } else {
      fs.appendFileSync(logFile, `\nBUILD COMPLETED SUCCESSFULLY!\n`);
    }
  });

  console.log(`Background build process started with PID: ${child.pid}`);
  console.log("Check the log with view_file on /build.log");
} catch (e: any) {
  console.error("Installation failed:", e);
}
