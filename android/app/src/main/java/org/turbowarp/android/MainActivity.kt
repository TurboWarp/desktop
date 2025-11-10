package org.turbowarp.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.webkit.WebViewFeature
import org.turbowarp.android.ui.theme.TurboWarpTheme

// TODO
private fun isDeviceSupported(): Boolean {
    return WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        L10N.setup(applicationContext)
        setContent {
            TurboWarpTheme {
                EditorView()
            }
        }
    }
}
