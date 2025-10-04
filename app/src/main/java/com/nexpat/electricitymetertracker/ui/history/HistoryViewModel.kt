package com.nexpat.electricitymetertracker.ui.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nexpat.electricitymetertracker.repository.CycleStats
import com.nexpat.electricitymetertracker.repository.MeterRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HistoryViewModel @Inject constructor(
    private val repository: MeterRepository
) : ViewModel() {
    private val stateCache = mutableMapOf<Long, MutableStateFlow<HistoryUiState>>()

    fun stateFor(meterId: Long): StateFlow<HistoryUiState> {
        val state = stateCache.getOrPut(meterId) { MutableStateFlow(HistoryUiState()) }
        viewModelScope.launch {
            val stats = repository.getCycleStats(meterId)
            val readings = repository.getReadingsInWindow(meterId, stats.cycle)
            state.value = HistoryUiState(
                stats = stats,
                readings = readings
            )
        }
        return state
    }
}

data class HistoryUiState(
    val stats: CycleStats? = null,
    val readings: List<com.nexpat.electricitymetertracker.data.MeterReadingEntity> = emptyList()
)
