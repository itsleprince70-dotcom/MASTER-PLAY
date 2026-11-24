# ProGuard / R8 Rules for MASTER PLAY (com.masterplay.kekechallenge)
-keepattributes *Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-dontwarn android.webkit.**
