package com.nexpat.electricitymetertracker.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun HomeScreen(
    state: HomeUiState,
    onAddReading: (Long) -> Unit,
    onOpenHistory: (Long) -> Unit,
    onOpenSettings: (Long) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(state.meters) { summary ->
            MeterCard(
                summary = summary,
                onAddReading = { onAddReading(summary.id) },
                onOpenHistory = { onOpenHistory(summary.id) },
                onOpenSettings = { onOpenSettings(summary.id) }
            )
        }
    }
}

@Composable
private fun MeterCard(
    summary: MeterSummary,
    onAddReading: () -> Unit,
    onOpenHistory: () -> Unit,
    onOpenSettings: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = summary.name, style = MaterialTheme.typography.titleMedium)
            Text(text = summary.cycleLabel, style = MaterialTheme.typography.bodySmall)
            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = "Used", style = MaterialTheme.typography.labelSmall)
                    Text(text = "${summary.usedUnits}", style = MaterialTheme.typography.bodyLarge)
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = "Projected", style = MaterialTheme.typography.labelSmall)
                    Text(text = "${summary.projectedUnits}", style = MaterialTheme.typography.bodyLarge)
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = onAddReading) {
                    Text(text = "Add Reading")
                }
                Button(onClick = onOpenHistory) {
                    Text(text = "History")
                }
                Button(onClick = onOpenSettings) {
                    Text(text = "Settings")
                }
            }
        }
    }
}
