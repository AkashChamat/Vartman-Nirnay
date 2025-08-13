# Add project specific ProGuard rules here.
# React Native Core
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }

# React Native Bridge (CRITICAL for JWT functions)
-keep class com.facebook.react.bridge.** { *; }
-keepclassmembers class com.facebook.react.bridge.** {
    public <methods>;
    public <fields>;
}

# JavaScript Bridge Methods
-keep class * extends com.facebook.react.bridge.BaseJavaModule { *; }
-keepclassmembers class * extends com.facebook.react.bridge.BaseJavaModule {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# JavaScript Interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# CRITICAL: Base64 and Crypto Functions
-keep class android.util.Base64 { 
    public static java.lang.String encodeToString(byte[], int);
    public static byte[] decode(java.lang.String, int);
    public static byte[] decode(byte[], int);
    public static java.lang.String encode(byte[], int);
}
-keep class java.util.Base64 { *; }
-keep class java.nio.Buffer { *; }
-keep class java.nio.ByteBuffer { *; }

# CRITICAL: String and Math Operations (Essential for JWT)
-keepclassmembers class java.lang.String {
    public <methods>;
}
-keepclassmembers class java.lang.StringBuilder {
    public <methods>;
}
-keepclassmembers class java.lang.Math {
    public static <methods>;
}

# CRITICAL: Date and Time Functions (For JWT expiration)
-keep class java.util.Date { *; }
-keepclassmembers class java.util.Date {
    public <methods>;
}
-keep class java.lang.System {
    public static long currentTimeMillis();
}

# CRITICAL: JSON Parsing (Essential for JWT payload)
-keep class org.json.** { *; }
-keepclassmembers class org.json.** { *; }
-keep class com.facebook.react.bridge.ReadableMap { *; }
-keep class com.facebook.react.bridge.WritableMap { *; }
-keep class com.facebook.react.bridge.ReadableArray { *; }
-keep class com.facebook.react.bridge.WritableArray { *; }

# CRITICAL: AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }
-keepclassmembers class com.reactnativecommunity.asyncstorage.** {
    public <methods>;
}

# CRITICAL: Prevent obfuscation of your JWT utility methods (SYNC)
-keep class * {
    *** isJWTExpired(...);
    *** decodeJWTPayload(...);
    *** extractUserInfo(...);
    *** base64UrlDecode(...);
    *** safeValidateJWT(...);
    *** debugJWT(...);
    *** testJWTUtilities(...);
}

# CRITICAL: ADD THESE - Prevent obfuscation of ASYNC JWT methods
-keep class * {
    *** isJWTExpiredAsync(...);
    *** decodeJWTPayloadAsync(...);
    *** extractUserInfoAsync(...);
    *** safeValidateJWTAsync(...);
}

# CRITICAL: ADD THIS - Keep Promise and async operations
-keep class java.util.concurrent.** { *; }
-dontwarn java.util.concurrent.**

# CRITICAL: ADD THIS - Keep global object properties for base64
-keepclassmembers class * {
    *** atob(...);
    *** btoa(...);
}

# Keep native method names
-keepclasseswithmembernames class * {
    native <methods>;
}

# AndroidX
-keep class androidx.** { *; }
-dontwarn androidx.**

# Cashfree
-keep class com.cashfree.** { *; }
-dontwarn com.cashfree.**

# Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# WebView
-keep class com.reactnativecommunity.webview.** { *; }

# General Android
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Networking
-keep class okhttp3.** { *; }
-keep class retrofit2.** { *; }
-dontwarn okhttp3.**
-dontwarn retrofit2.**

# Keep essential Android classes
-keep class android.support.** { *; }
-keep class androidx.core.** { *; }

# Crypto and Security
-keep class javax.crypto.** { *; }
-keep class java.security.** { *; }
-dontwarn javax.crypto.spec.**

# Suppress warnings for missing classes (not available in Android)
-dontwarn javax.naming.**
-dontwarn javax.naming.directory.**
-dontwarn javax.naming.ldap.**
-dontwarn javax.mail.**
-dontwarn javax.activation.**
-dontwarn javax.security.sasl.**
-dontwarn javax.security.auth.callback.**
-dontwarn java.awt.**
-dontwarn java.beans.**
-dontwarn javax.swing.**
-dontwarn sun.security.**
-dontwarn sun.misc.**
-dontwarn org.conscrypt.**
-dontwarn org.openjsse.**
-dontwarn okhttp3.internal.platform.**
-dontwarn org.apache.harmony.xnet.provider.jsse.**
-dontwarn java.lang.management.**
-dontwarn java.util.logging.**
-dontwarn javax.management.**
-dontwarn org.apache.http.**
-dontwarn android.net.http.**
-dontwarn java.security.cert.CertPathValidatorException
-dontwarn java.security.cert.PKIXRevocationChecker
-dontwarn com.facebook.flipper.**
-dontwarn org.slf4j.**
-dontwarn ch.qos.logback.**
-dontwarn org.apache.log4j.**
-dontwarn org.bouncycastle.**

# Keep attributes for debugging
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable

# CRITICAL: Protect base-64 npm package specifically
-keep class * {
    *** decode(java.lang.String);
    *** encode(java.lang.String);
}
-keepclassmembers class * {
    public static ** decode(**);
    public static ** encode(**);
}

# Protect require() calls for npm packages
-dontwarn **.base_64.**
-dontwarn **.base64.**

# Keep global object assignments
-keep class * {
    *** global;
    *** globalThis;
}
