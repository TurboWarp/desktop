package org.turbowarp.android

import android.content.Context
import org.json.JSONObject

object L10N {
    private val translations = mutableMapOf<String, Map<String, String>>()

    private fun stringsWithDescriptionToMap(jsonObject: JSONObject): Map<String, String> {
        val map = mutableMapOf<String, String>()
        for (id in jsonObject.keys()) {
            val infoObject = jsonObject.getJSONObject(id)
            map[id] = infoObject.getString("string")
        }
        return map
    }

    private fun stringsToMap(jsonObject: JSONObject): Map<String, String> {
        val map = mutableMapOf<String, String>()
        for (id in jsonObject.keys()) {
            map[id] = jsonObject.getString(id)
        }
        return map
    }

    fun setup(context: Context) {
        val englishStrings = readAssetAsString(context, "l10n/en.json")
        val englishStringsObject = JSONObject(englishStrings)
        translations["en"] = stringsWithDescriptionToMap(englishStringsObject)

        val translatedStrings = readAssetAsString(context, "l10n/generated-translations.json")
        val translatedStringsObjects = JSONObject(translatedStrings)
        for (locale in translatedStringsObjects.keys()) {
            val localeStringsObject = translatedStringsObjects.getJSONObject(locale)
            translations[locale] = stringsToMap(localeStringsObject)
        }
    }

    fun getStrings(): Map<String, String> {
        return translations["en"]!!
    }
}