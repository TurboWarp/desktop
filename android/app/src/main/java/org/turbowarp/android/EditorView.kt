package org.turbowarp.android

import androidx.compose.runtime.Composable

@Composable
fun EditorView() {
    TurboWarpWebView(
        url = "https://editor.android-assets.turbowarp.org/gui/gui.html",
        preloads = listOf(
            "ipc-init.js",
            "editor.js",
        )
    )
}
