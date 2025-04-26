# Android

https://v2.tauri.org.cn/distribute/sign/android/

Release Path
`.\src-tauri\gen\android\app\build\outputs\apk\universal`

Generate Keystore
`keytool -genkey -v -keystore $env:USERPROFILE\upload-keystore.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias upload`

