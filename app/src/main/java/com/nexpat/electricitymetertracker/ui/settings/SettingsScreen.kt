package com.nexpat.electricitymetertracker.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenu
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun SettingsScreen(
    state: SettingsUiState,
    onAnchorChanged: (Int) -> Unit,
    onThresholdsChanged: (String) -> Unit,
    onReminderChanged: (Int) -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Button(onClick = onBack) { Text("Back") }
        when (state) {
            SettingsUiState.Loading -> Text("Loading…")
            is SettingsUiState.Loaded -> SettingsContent(
                state = state,
                onAnchorChanged = onAnchorChanged,
                onThresholdsChanged = onThresholdsChanged,
                onReminderChanged = onReminderChanged
            )
        }
    }
}

@Composable
private fun SettingsContent(
    state: SettingsUiState.Loaded,
    onAnchorChanged: (Int) -> Unit,
    onThresholdsChanged: (String) -> Unit,
    onReminderChanged: (Int) -> Unit
) {
    Text(text = state.name, style = MaterialTheme.typography.titleLarge)
    AnchorDayPicker(state.anchorDay, onAnchorChanged)
    OutlinedTextField(
        value = state.thresholds,
        onValueChange = onThresholdsChanged,
        label = { Text("Thresholds (comma separated)") },
        modifier = Modifier.fillMaxWidth()
    )
    ReminderPicker(reminderDays = state.reminderDays, onReminderChanged = onReminderChanged)
}

@Composable
private fun AnchorDayPicker(selectedDay: Int, onAnchorChanged: (Int) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded }
    ) {
        OutlinedTextField(
            modifier = Modifier.menuAnchor().fillMaxWidth(),
            value = selectedDay.toString(),
            onValueChange = {},
            readOnly = true,
            label = { Text("Billing anchor day") },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) }
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            for (day in 1..31) {
                DropdownMenuItem(
                    text = { Text(day.toString()) },
                    onClick = {
                        expanded = false
                        onAnchorChanged(day)
                    }
                )
            }
        }
    }
}

@Composable
private fun ReminderPicker(reminderDays: Int, onReminderChanged: (Int) -> Unit) {
    val textState = remember(reminderDays) { mutableStateOf(reminderDays.toString()) }
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(text = "Reminder frequency (days)")
        OutlinedTextField(
            value = textState.value,
            onValueChange = {
                textState.value = it
                it.toIntOrNull()?.let(onReminderChanged)
            },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )
    }
}
