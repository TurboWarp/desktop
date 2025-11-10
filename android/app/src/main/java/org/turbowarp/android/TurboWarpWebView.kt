package org.turbowarp.android

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.view.ViewGroup
import android.webkit.JavascriptInterface
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
import androidx.core.net.toUri
import org.json.JSONArray
import org.json.JSONObject
import java.io.InputStream

private fun addIndexIfNeeded(path: String): String {
    return if (path.endsWith("/")) {
        "$path/index.html"
    } else {
        path
    }
}

private fun makeFetchableResponse(data: InputStream, path: String): WebResourceResponse {
    // TODO: use our own mime types instead of the system's
    val mimeType = URLConnection.guessContentTypeFromName(path)

    return WebResourceResponse(
        mimeType,
        null,
        200,
        "OK",
        mapOf<String, String>(
            "Access-Control-Allow-Origin" to "*"
        ),
        data,
    )
}

private fun makeErrorResponse(): WebResourceResponse {
    // TODO
    return WebResourceResponse(null, null, null)
}

private class ServeAsset(
    private val context: Context,
    private val subfolder: String
) : WebViewAssetLoader.PathHandler {
    override fun handle(path: String): WebResourceResponse? {
        return try {
            // TODO: probably vulnerable to path traversal
            val pathWithIndex = addIndexIfNeeded(path)
            val assetPath = "$subfolder/$pathWithIndex"

            val stream = context.assets.open(assetPath)
            makeFetchableResponse(stream, pathWithIndex)
        } catch (_: IOException) {
            makeErrorResponse()
        }
    }
}

private class ServeBrotliAsset(
    private val context: Context,
    private val subfolder: String
) : WebViewAssetLoader.PathHandler {
    override fun handle(path: String): WebResourceResponse? {
        return try {
            // TODO: probably vulnerable to path traversal
            val pathWithIndex = addIndexIfNeeded(path)
            val compressedAssetPath = "$subfolder/$pathWithIndex.br"

            val stream = readBrotliAssetAsStream(context, compressedAssetPath)
            makeFetchableResponse(stream, pathWithIndex)
        } catch (_: IOException) {
            // TODO: does this fall-through to remote or fallthrough?
            null
        }
    }
}

private class ServeLibraryAsset(
    private val context: Context,
    private val subfolder: String
) : WebViewAssetLoader.PathHandler {
    private fun findMd5ext(path: String): String? {
        val md5ext = Regex("[0-9a-f]{32}\\.\\w{3}", RegexOption.IGNORE_CASE).find(path)
        return md5ext?.value
    }

    override fun handle(path: String): WebResourceResponse? {
        return try {
            val md5ext = findMd5ext(path)

            if (md5ext == null) {
                makeErrorResponse()
            } else {
                val compressedAssetPath = "$subfolder/$md5ext.br"
                val stream = readBrotliAssetAsStream(context, compressedAssetPath)
                makeFetchableResponse(stream, md5ext)
            }
        } catch (_: IOException) {
            makeErrorResponse()
        }
    }
}

private class TurboWarpWebViewClient(
    private val context: Context,
    private val preloads: List<String>,
    private val initialUrl: String
) : WebViewClient() {
    private val assetLoaders = mapOf(
        "editor.android-assets.turbowarp.org" to WebViewAssetLoader.Builder()
            .setDomain("editor.android-assets.turbowarp.org")
            .addPathHandler("/", ServeAsset(context, "dist-renderer-webpack/editor"))
            .build(),

        "extensions.turbowarp.org" to WebViewAssetLoader.Builder()
            .setDomain("extensions.turbowarp.org")
            .addPathHandler("/", ServeBrotliAsset(context, "dist-extensions"))
            .build(),

        "assets.scratch.mit.edu" to WebViewAssetLoader.Builder()
            .setDomain("assets.scratch.mit.edu")
            .addPathHandler("/", ServeLibraryAsset(context, "dist-library-files"))
            .build(),

        "cdn.assets.scratch.mit.edu" to WebViewAssetLoader.Builder()
            .setDomain("cdn.assets.scratch.mit.edu")
            .addPathHandler("/", ServeLibraryAsset(context, "dist-library-files"))
            .build(),

        "packager.turbowarp.org" to WebViewAssetLoader.Builder()
            .setDomain("packager.turbowarp.org")
            .addPathHandler("/", ServeAsset(context, "packager"))
            .build(),
    )

    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        super.onPageStarted(view, url, favicon)

        // Execute preloads in IIFE so that we only expose the variables we want to
        val sb = StringBuilder()
        sb.append("(function() { 'use strict';\n")
        for (preloadName in preloads) {
            // We assume that the preloads variable is trusted, don't need to worry about path
            // traversal or anything like that.
            val preloadScript = readAssetAsString(context, "preload/$preloadName")
            sb.append(preloadScript)
        }
        sb.append("\n}());")

        view?.evaluateJavascript(sb.toString(), null)
    }

    override fun shouldInterceptRequest(
        view: WebView,
        request: WebResourceRequest
    ): WebResourceResponse? {
        val loader = request.url.host?.let { assetLoaders[it] }
        return loader?.shouldInterceptRequest(request.url)
    }

    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        // Open links in browser app
        // TODO: can we make this feel a bit less weird? like that custom tabs thing?
        if (request?.url.toString() != initialUrl) {
            val intent = Intent(Intent.ACTION_VIEW, request?.url)
            view?.context?.startActivity(intent)
            return true
        }

        return super.shouldOverrideUrlLoading(view, request)
    }
}

interface IpcHandler {
    fun handleSync(method: String, args: JSONArray): Any?
}

private class IpcSync(private val ipcHandler: IpcHandler) {
    // Android's JavaScript interface apparently only supports the primitive types.
    // So we have to pass around JSON strings. Real fun.
    @JavascriptInterface
    fun sendSync(jsonRequestString: String): String {
        val jsonRequest = JSONObject(jsonRequestString)
        val method = jsonRequest.getString("method")
        val args = jsonRequest.getJSONArray("args")

        val jsonResponse = ipcHandler.handleSync(method, args)
        return jsonResponse?.toString() ?: "null"
    }
}

private class IpcAsync(private val ipcHandler: IpcHandler) : WebViewCompat.WebMessageListener {
    @SuppressLint("RequiresFeature")
    override fun onPostMessage(
        view: WebView,
        message: WebMessageCompat,
        sourceOrigin: Uri,
        isMainFrame: Boolean,
        replyProxy: JavaScriptReplyProxy
    ) {
        replyProxy.postMessage("e")
    }
}

private fun getOrigin(url: String): String {
    val uri = url.toUri()
    val sb = StringBuilder()
    sb.append(uri.scheme)
    sb.append("://")
    sb.append(uri.host)
    return sb.toString()
}

@SuppressLint("SetJavaScriptEnabled", "RequiresFeature")
@Composable
fun TurboWarpWebView(
    url: String,
    modifier: Modifier = Modifier,
    preloads: List<String> = emptyList(),
    ipcHandler: IpcHandler? = null
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

                // To help troubleshooting
                val version = BuildConfig.VERSION_NAME
                val appId = BuildConfig.APPLICATION_ID
                settings.userAgentString += " $appId/$version"

                if (ipcHandler != null) {
                    val origin = getOrigin(url)
                    WebViewCompat.addWebMessageListener(
                        this,
                        "AndroidIpcAsync",
                        setOf(origin),
                        IpcAsync(ipcHandler)
                    )
                    addJavascriptInterface(IpcSync(ipcHandler), "AndroidIpcSync")
                }

                webViewClient = TurboWarpWebViewClient(
                    context = context,
                    initialUrl = url,
                    preloads = if (ipcHandler == null) {
                        preloads
                    } else {
                        listOf("ipc-init.js").plus(preloads)
                    }
                )
            }
        },
        update = { webView ->
            webView.loadUrl(url)
        }
    )
}
