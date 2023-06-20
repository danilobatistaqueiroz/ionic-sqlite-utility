ionic start whatsclone blank --type=angular --capacitor --project-id=whatsclone --package-id=br.labs.whatsclone

### encrypting the database ###

the mode **"encryption"** is to be used when you have an already existing database non encrypted and you want to encrypt it.  
the mode **"secret"** is to be used when you want to open an encrypted database.  
the mode **"newsecret"** is to be used when you want to change the secret of an encrypted database with the newsecret.  


ionic config set -g npmClient pnpm

ionic cap add android
ionic build
ionic cap copy android


pnpm install --save @capacitor-community/sqlite
pnpm install --save jeep-sqlite
pnpm install --save sql.js
npx cap sync

### installing the app in an Android device ###
export JAVA_HOME=~/android-studio/jbr
sudo update-alternatives --config java
cd android
gradle signingReport

### install using gradle ###
jarsigner -verbose -keystore ~/.android/debug.keystore ./app/build/outputs/apk/debug/app-debug.apk AndroidDebugKey
alias zipalign=~/android-sdk/build-tools/30.0.3/zipalign
zipalign -v 4 ./app/build/outputs/apk/debug/app-debug.apk authemail.apk

cd android

./gradlew clean
./gradlew build
./gradlew assembleDebug
./gradlew installDebug

cd android; ./gradlew assembleDebug; ./gradlew installDebug; adb shell am start -n "br.labs.securityp/br.labs.securityp.MainActivity" -a android.intent.action.MAIN -c android.intent.category.LAUNCHER; clear

adb shell am start -n "br.labs.securityp/br.labs.securityp.MainActivity" -a android.intent.action.MAIN -c android.intent.category.LAUNCHER

adb logcat --pid=`adb shell pidof -s br.labs.securityp`

### disassembling a dex file ####
alias dexdump=/home/element/android-sdk/build-tools/34.0.0-rc4/dexdump
dexdump -d classes2.dex > classes2.txt
dexdump -d classes2.dex | grep "security-products-corp"


### obfuscating an apk ####
alias zipalign=~/android-sdk/build-tools/30.0.3/zipalign
export ZIPALIGN_PATH=~/android-sdk/build-tools/30.0.3/zipalign
export BUNDLE_DECOMPILER_PATH=/usr/local/bin/BundleDecompiler.jar
export APKTOOL_PATH=/usr/bin/apktool
export APKSIGNER_PATH=/usr/bin/apksigner


docker run --rm -it -v "/home/element/dados/tutorials/sqlite/Obfuscapk/src":"/workdir" obfuscapk -p -d /workdir/ee.apk -o Nop -o Goto -o Rebuild -o AssetEncryption -o ClassRename -o DebugRemoval -o FieldRename -o LibEncryption -o MethodRename -o ResStringEncryption -o ConstStringEncryption /workdir/app-debug.apk

app-debug.apk is in /home/element/dados/tutorials/sqlite/Obfuscapk/src  
ee.apk will be in /home/element/dados/tutorials/sqlite/Obfuscapk/src  

cd ~/dados/tutorials/sqlite/jadx/build/jadx/bin
./jadx-gui

