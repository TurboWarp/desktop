package org.turbowarp.android

import android.content.Context
import org.brotli.dec.BrotliInputStream
import java.io.InputStream

fun readAssetAsString(context: Context, path: String): String {
    val stream = context.assets.open(path)
    val reader = stream.bufferedReader()
    return reader.readText()
}

fun readBrotliAssetAsStream(context: Context, path: String): InputStream {
    val compressedDataStream = context.assets.open(path)
    val decompressedDataStream = BrotliInputStream(compressedDataStream)
    return decompressedDataStream
}