package org.turbowarp.android

import android.os.Handler
import android.os.Looper
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
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
    val navController = rememberNavController()

    val editor = TurboWarpWebView(
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
                    return result
                }

                if (method == "open-about") {
                    Handler(Looper.getMainLooper()).post {
                        navController.navigate("about")
                    }
                    return null
                }

                if (method == "open-addon-settings") {
                    Handler(Looper.getMainLooper()).post {
                        navController.navigate("addons")
                    }
                    return null
                }

                if (method == "open-privacy") {
                    Handler(Looper.getMainLooper()).post {
                        navController.navigate("privacy")
                    }
                    return null
                }

                return null
            }
        }
    )

    Box {
        editor
        NavHost(navController = navController, startDestination = "none") {
            composable("none") {
                // empty
            }
            composable("about") {
                AboutView()
            }
            composable("addons") {
                AddonsView()
            }
            composable("privacy") {
                PrivacyView()
            }
        }
    }
}
