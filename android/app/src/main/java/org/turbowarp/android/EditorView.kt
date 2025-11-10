package org.turbowarp.android

import androidx.compose.runtime.Composable
import org.json.JSONArray
import org.json.JSONObject

fun mapToJsonObject(map: Map<String, String>): JSONObject {
    val jsonObject = JSONObject()
    for ((key, value) in map) {
        jsonObject.put(key, value)
    }
    return jsonObject
}

@Composable
fun EditorView() {
    TurboWarpWebView(
        url = "https://editor.android-assets.turbowarp.org/gui/gui.html",
        preloads = listOf(
            "editor.js",
        ),
        ipcHandler = object : IpcHandler {
            override fun handleSync(
                method: String,
                args: JSONArray
            ): Any? {
                if (method == "is-initially-fullscreen") {
                    return false
                }

                if (method == "set-locale") {
                    val result = JSONObject()
                    val strings = L10N.getStrings()
                    result.put("strings", mapToJsonObject(strings))
                    println(result)
                    return result
                }

                return null
            }
        }
    )
}
