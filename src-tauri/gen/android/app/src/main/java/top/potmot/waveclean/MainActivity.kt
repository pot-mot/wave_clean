package top.potmot.waveclean

import android.webkit.WebView

class MainActivity : TauriActivity() {
    private lateinit var wv: WebView

    override fun onWebViewCreate(webView: WebView) {
        wv = webView
    }

    override fun onBackPressed() {
        wv.evaluateJavascript(/* script = */ """
      try {
        window.touchBackCallback()
      } catch (_) {
        true
      }
    """.trimIndent()
        ) { result ->
            if (result == "true") {
                super.onBackPressed();
            }
        }
    }
}