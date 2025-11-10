package org.turbowarp.android

import android.content.Context

fun readAssetAsString(context: Context, path: String): String {
    val stream = context.assets.open(path)
    val reader = stream.bufferedReader()
    return reader.readText()
}
