package org.turbowarp.android

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp

@Composable
fun AboutView() {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xffff4c4c)
    ) {
        Column (
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "TurboWarp for Android",
                fontSize = 30.sp,
                color = Color.White,
                textAlign = TextAlign.Center
            )
            Text(
                text = "${BuildConfig.APPLICATION_ID}/${BuildConfig.VERSION_NAME}",
                fontSize = 20.sp,
                color = Color.White,
                textAlign = TextAlign.Center
            )
        }
    }
}
