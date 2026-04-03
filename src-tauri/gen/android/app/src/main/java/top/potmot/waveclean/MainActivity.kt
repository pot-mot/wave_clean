package top.potmot.waveclean

import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback

class MainActivity : TauriActivity() {
    private lateinit var wv: WebView

    override fun onWebViewCreate(webView: WebView) {
        wv = webView
        setupBackPressHandler()
    }

    private fun setupBackPressHandler() {
        val evalJsCallback = object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                wv.evaluateJavascript(
                    """
(async () => {
    try {
        if (window.touchBackCallback) {
            const result = await window.touchBackCallback();
            androidBackHandler.emit(result);
            return;
        }
        androidBackHandler.emit(true);
    } catch (_) {
        androidBackHandler.emit(true);
    }
})()
                """
                ) {}
            }
        }

        wv.addJavascriptInterface(object : Any() {
            @JavascriptInterface
            fun emit(value: Boolean) {
                if (value) {
                    // 在主线程中执行后退操作，避免 WebView 线程问题
                    wv.post {
                        evalJsCallback.isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        evalJsCallback.isEnabled = true
                    }
                }
            }
        }, "androidBackHandler")
        onBackPressedDispatcher.addCallback(this, evalJsCallback)
    }
}