# Add project specific ProGuard rules here.

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Cashfree
-keep class com.cashfree.** { *; }
-dontwarn com.cashfree.**

# Keep native method names
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep React Native bridge
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# AndroidX
-keep class androidx.** { *; }
-dontwarn androidx.**

# Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# WebView
-keep class com.reactnativecommunity.webview.** { *; }

# General Android
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# FIXED: Enhanced Base64 and JWT handling for release builds
-keep class java.util.Base64 { *; }
-keep class android.util.Base64 { *; }

# Keep Buffer class for polyfill
-keep class java.nio.Buffer { *; }
-keep class java.nio.ByteBuffer { *; }

# Keep anything related to JWT decoding
-keep class com.auth0.** { *; }
-dontwarn com.auth0.**

# Keep your own token class/model if any
-keep class **.TokenModel { *; }

# ADDED: Prevent obfuscation of JavaScript polyfills
-keep class org.apache.commons.codec.binary.Base64 { *; }
-dontwarn org.apache.commons.codec.binary.Base64

# ADDED: Keep JavaScript engine related classes
-keep class com.facebook.react.bridge.JavaScriptModule { *; }
-keep class com.facebook.react.bridge.NativeModule { *; }
-keep class com.facebook.react.bridge.ReactMethod { *; }

# ADDED: Prevent issues with atob/btoa polyfills
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# ADDED: Keep all classes that might be accessed via reflection
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# ADDED: Prevent stripping of global object properties
-keepclassmembers class * {
    *** atob(...);
    *** btoa(...);
}

# FIXED: BouncyCastle and crypto related warnings
-keep class org.bouncycastle.** { *; }
-dontwarn org.bouncycastle.**

# FIXED: Missing LDAP classes (not available in Android)
-dontwarn javax.naming.**
-dontwarn javax.naming.directory.**
-dontwarn javax.naming.ldap.**

# FIXED: Missing javax classes that are not available in Android
-dontwarn javax.mail.**
-dontwarn javax.activation.**
-dontwarn javax.security.sasl.**
-dontwarn javax.security.auth.callback.**

# FIXED: Additional missing classes warnings
-dontwarn java.awt.**
-dontwarn java.beans.**
-dontwarn javax.swing.**
-dontwarn sun.security.**
-dontwarn sun.misc.**

# FIXED: Crypto provider warnings
-dontwarn org.conscrypt.**
-dontwarn org.openjsse.**

# FIXED: Network security warnings
-dontwarn okhttp3.internal.platform.**
-dontwarn org.apache.harmony.xnet.provider.jsse.**

# FIXED: Keep crypto classes but ignore missing dependencies
-keep class javax.crypto.** { *; }
-keep class java.security.** { *; }
-dontwarn javax.crypto.spec.**

# FIXED: Ignore missing classes that are desktop/server only
-dontwarn java.lang.management.**
-dontwarn java.util.logging.**
-dontwarn javax.management.**

# FIXED: HTTP client warnings
-dontwarn org.apache.http.**
-dontwarn android.net.http.**

# FIXED: Additional security warnings
-dontwarn java.security.cert.CertPathValidatorException
-dontwarn java.security.cert.PKIXRevocationChecker

# FIXED: Keep essential classes for networking
-keep class okhttp3.** { *; }
-keep class retrofit2.** { *; }
-dontwarn okhttp3.**
-dontwarn retrofit2.**

# FIXED: React Native specific crypto
-keep class com.facebook.crypto.** { *; }
-dontwarn com.facebook.crypto.**

# FIXED: Additional React Native networking
-keep class com.facebook.react.modules.network.** { *; }
-dontwarn com.facebook.react.modules.network.**

# FIXED: Hermes engine
-keep class com.facebook.hermes.reactexecutor.** { *; }
-dontwarn com.facebook.hermes.**

# FIXED: JSC engine
-keep class com.facebook.react.jscexecutor.** { *; }
-dontwarn com.facebook.react.jscexecutor.**

# FIXED: Flipper (if used)
-dontwarn com.facebook.flipper.**
-dontwarn com.facebook.soloader.**

# FIXED: Additional missing classes
-dontwarn org.slf4j.**
-dontwarn ch.qos.logback.**
-dontwarn org.apache.log4j.**

# FIXED: Keep essential Android classes
-keep class android.support.** { *; }
-keep class androidx.core.** { *; }

# FIXED: Prevent issues with reflection
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# FIXED: Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# FIXED: Keep Serializable classes
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
