package org.turbowarp.android

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.JavaScriptReplyProxy
import androidx.webkit.WebMessageCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat
import java.io.IOException
import java.net.URLConnection

private fun readAssetAsString(context: Context, path: String): String {
    val stream = context.assets.open(path)
    val reader = stream.bufferedReader()
    return reader.readText()
}

private class ServeAsset(
    private val context: Context,
    private val subfolder: String
) : WebViewAssetLoader.PathHandler {
    override fun handle(path: String): WebResourceResponse? {
        return try {
            val assetPath = "$subfolder/$path"
            val inputStream = context.assets.open(assetPath)
            val mimeType = URLConnection.guessContentTypeFromName(assetPath)
            WebResourceResponse(mimeType, null, inputStream)
        } catch (_: IOException) {
            // TODO: better error page?
            WebResourceResponse(null, null, null)
        }
    }
}

private class TurboWarpWebViewClient(
    private val context: Context,
    private val preloads: List<String>,
) : WebViewClient() {
    private val assetLoaders = mapOf(
        "editor.android-assets.turbowarp.org" to WebViewAssetLoader.Builder()
            .setDomain("editor.android-assets.turbowarp.org")
            .addPathHandler("/", ServeAsset(context, "dist-renderer-webpack/editor"))
            .build(),

        "packager.android-assets.turbowarp.org" to WebViewAssetLoader.Builder()
            .setDomain("packager.android-assets.turbowarp.org")
            .addPathHandler("/", ServeAsset(context, "packager"))
            .build(),

        "about.android-assets.turbowarp.org" to WebViewAssetLoader.Builder()
            .setDomain("about.android-assets.turbowarp.org")
            .addPathHandler("/", ServeAsset(context, "about"))
            .build()
    )

    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        super.onPageStarted(view, url, favicon)

        val sb = StringBuilder()
        sb.append("(function() { 'use strict';\n");
        for (preloadName in preloads) {
            // We assume that the preloads variable is trusted, don't need to worry about path
            // traversal or anything like that.
            val preloadScript = readAssetAsString(context, "preload/$preloadName")
            sb.append(preloadScript)
        }
        sb.append("\n}());");

        view?.evaluateJavascript(sb.toString(), null);
    }

    override fun shouldInterceptRequest(
        view: WebView,
        request: WebResourceRequest
    ): WebResourceResponse? {
        val loader = request.url.host?.let { assetLoaders[it] }
        return loader?.shouldInterceptRequest(request.url)
    }
}

private class WebViewIPC : WebViewCompat.WebMessageListener {
    override fun onPostMessage(
        view: WebView,
        message: WebMessageCompat,
        sourceOrigin: Uri,
        isMainFrame: Boolean,
        replyProxy: JavaScriptReplyProxy
    ) {

    }
}

private fun getOrigin(url: String): String {
    val uri = Uri.parse(url)
    val sb = StringBuilder()
    sb.append(uri.scheme)
    sb.append("://")
    sb.append(uri.host)
    sb.append(uri.host)
    return sb.toString()
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun TurboWarpWebView(
    url: String,
    modifier: Modifier = Modifier,
    preloads: List<String> = emptyList(),
) {
    AndroidView(
        modifier = modifier,
        factory = { context ->
            WebView(context).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )

                // Enable standard web APIs
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true

                // All of our assets come through custom asset loaders, so
                // don't disable file access, like browsers do.
                settings.allowFileAccess = false
                settings.allowContentAccess = false

                WebViewCompat.addWebMessageListener(
                    this,
                    "AndroidIPC",
                    setOf(getOrigin(url)),
                    WebViewIPC()
                )

                webViewClient = TurboWarpWebViewClient(context, preloads)
            }
        },
        update = { webView ->
            webView.loadUrl(url)
        }
    )
}
