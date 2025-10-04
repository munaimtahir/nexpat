package com.nexpat.electricitymetertracker.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nexpat.electricitymetertracker.repository.MeterRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val repository: MeterRepository
) : ViewModel() {
    private val stateCache = mutableMapOf<Long, MutableStateFlow<SettingsUiState>>()

    fun stateFor(meterId: Long): StateFlow<SettingsUiState> {
        val state = stateCache.getOrPut(meterId) { MutableStateFlow(SettingsUiState.Loading) }
        viewModelScope.launch {
            val meter = repository.getMeter(meterId)
            if (meter != null) {
                val reminderDays = repository.observeReminderFrequency(meterId).first()
                state.value = SettingsUiState.Loaded(
                    meterId = meter.id,
                    name = meter.name,
                    anchorDay = meter.billingAnchorDay,
                    thresholds = meter.thresholdsCsv,
                    reminderDays = reminderDays
                )
            }
        }
        return state
    }

    fun updateAnchorDay(meterId: Long, day: Int) {
        updateState(meterId) { current ->
            viewModelScope.launch {
                val meter = repository.getMeter(meterId) ?: return@launch
                repository.updateMeter(meter.copy(billingAnchorDay = day))
                emit(current.copy(anchorDay = day))
            }
        }
    }

    fun updateThresholds(meterId: Long, thresholds: String) {
        updateState(meterId) { current ->
            viewModelScope.launch {
                val meter = repository.getMeter(meterId) ?: return@launch
                repository.updateMeter(meter.copy(thresholdsCsv = thresholds))
                emit(current.copy(thresholds = thresholds))
            }
        }
    }

    fun updateReminderDays(meterId: Long, days: Int) {
        updateState(meterId) { current ->
            viewModelScope.launch {
                repository.setReminderFrequency(meterId, days)
                emit(current.copy(reminderDays = days))
            }
        }
    }

    private fun updateState(
        meterId: Long,
        block: suspend (SettingsUiState.Loaded) -> Unit
    ) {
        val state = stateCache[meterId] ?: return
        val current = state.value
        if (current is SettingsUiState.Loaded) {
            viewModelScope.launch {
                block(current)
            }
        }
    }

    private suspend fun emit(newState: SettingsUiState.Loaded) {
        stateCache[newState.meterId]?.emit(newState)
    }

    companion object {
        private const val DEFAULT_REMINDER = 7
    }
}

sealed class SettingsUiState {
    data object Loading : SettingsUiState()
    data class Loaded(
        val meterId: Long,
        val name: String,
        val anchorDay: Int,
        val thresholds: String,
        val reminderDays: Int
    ) : SettingsUiState()
}
