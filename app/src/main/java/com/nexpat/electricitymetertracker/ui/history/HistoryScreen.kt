package com.nexpat.electricitymetertracker.ui.history

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.unit.dp
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
fun HistoryScreen(
    state: HistoryUiState,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Button(onClick = onBack) { Text("Back") }
        val stats = state.stats
        if (stats != null) {
            val formatter = DateTimeFormatter.ofPattern("dd MMM").withZone(ZoneId.systemDefault())
            Text(text = stats.meter.name, style = MaterialTheme.typography.titleLarge)
            Text(
                text = "${formatter.format(stats.cycle.start)} – ${formatter.format(stats.cycle.end)}",
                style = MaterialTheme.typography.bodyMedium
            )
            Spacer(modifier = Modifier.height(16.dp))
            UsageChart(state)
        } else {
            Text("No data yet")
        }
    }
}

@Composable
private fun UsageChart(state: HistoryUiState) {
    val stats = state.stats ?: return
    val readings = state.readings
    if (readings.isEmpty()) {
        Text("Add readings to view history")
        return
    }
    val minValue = readings.minOf { it.value }
    val maxValue = readings.maxOf { it.value }.coerceAtLeast(minValue + 1)
    Canvas(modifier = Modifier.fillMaxWidth().height(240.dp)) {
        val start = stats.cycle.start.toEpochMilli().toFloat()
        val end = stats.cycle.end.toEpochMilli().toFloat()
        val width = size.width
        val height = size.height
        val valueRange = (maxValue - minValue).toFloat()
        val timeRange = end - start
        var previousPoint: Offset? = null
        for (reading in readings) {
            val xFraction = (reading.recordedAt.toEpochMilli() - start) / timeRange
            val yFraction = (reading.value - minValue) / valueRange
            val point = Offset(
                x = (xFraction.coerceIn(0f, 1f) * width),
                y = height - (yFraction.coerceIn(0f, 1f) * height)
            )
            previousPoint?.let { drawLine(Color.Green, it, point, strokeWidth = 6f) }
            previousPoint = point
        }
        val projectionStart = previousPoint
        if (projectionStart != null) {
            val projectedValue = stats.projectedUnits + minValue
            val projectedFraction = ((stats.cycle.end.toEpochMilli() - start) / timeRange).coerceIn(0f, 1f)
            val projectionPoint = Offset(
                x = projectedFraction * width,
                y = height - (((projectedValue - minValue) / valueRange).coerceIn(0f, 1f) * height)
            )
            drawLine(
                color = Color.Gray,
                start = projectionStart,
                end = projectionPoint,
                strokeWidth = 4f,
                pathEffect = PathEffect.dashPathEffect(floatArrayOf(20f, 12f))
            )
        }
    }
}
