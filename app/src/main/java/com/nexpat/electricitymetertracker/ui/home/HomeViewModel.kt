package com.nexpat.electricitymetertracker.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nexpat.electricitymetertracker.data.MeterEntity
import com.nexpat.electricitymetertracker.repository.MeterRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: MeterRepository
) : ViewModel() {
    private val formatter = DateTimeFormatter.ofPattern("dd MMM")
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.observeCycleStats().collect { statsList ->
                val zone = ZoneId.systemDefault()
                _uiState.value = HomeUiState(
                    meters = statsList.map { stats ->
                        val startLabel = formatter.withZone(zone).format(stats.cycle.start)
                        val endLabel = formatter.withZone(zone).format(stats.cycle.end)
                        MeterSummary(
                            id = stats.meter.id,
                            name = stats.meter.name,
                            cycleLabel = "Cycle $startLabel – $endLabel",
                            usedUnits = stats.usedUnits,
                            projectedUnits = stats.projectedUnits
                        )
                    }
                )
            }
        }
        viewModelScope.launch {
            val existing = repository.observeMeters().first()
            if (existing.isEmpty()) {
                repository.upsertMeter(MeterEntity(name = "Home Meter"))
            }
        }
    }

    fun addQuickReading(meterId: Long) {
        viewModelScope.launch {
            repository.addReading(meterId, value = 0.0)
        }
    }
}

data class HomeUiState(
    val meters: List<MeterSummary> = emptyList()
)

data class MeterSummary(
    val id: Long,
    val name: String,
    val cycleLabel: String,
    val usedUnits: Double,
    val projectedUnits: Double
)
