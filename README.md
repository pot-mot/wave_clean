# Android

## Init android env

`pnpm tauri android init`

1. linux / mac 
    
    `export ANDROID_HOME=~/Library/Android/sdk`
    `export NDK_HOME=~/Library/Android/sdk/ndk/XX.Y.Z`

2. windows
    
    `ANDROID_HOME=C:\Users\<your-username>\AppData\Local\Android\Sdk`
    `NDK_HOME=C:\Users\<your-username>\AppData\Local\Android\Sdk\ndk\XX.Y.Z`

## Set sign

https://v2.tauri.org.cn/distribute/sign/android/

### Generate Keystore

`keytool -genkey -v -keystore $env:USERPROFILE\upload-keystore.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias upload`


## Release Path
`.\src-tauri\gen\android\app\build\outputs\apk\universal`

