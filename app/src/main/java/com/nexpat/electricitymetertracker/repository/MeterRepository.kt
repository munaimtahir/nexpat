package com.nexpat.electricitymetertracker.repository

import com.nexpat.electricitymetertracker.data.MeterDao
import com.nexpat.electricitymetertracker.data.MeterEntity
import com.nexpat.electricitymetertracker.data.MeterReadingEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.mapLatest
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlin.math.max
import kotlin.math.round
import javax.inject.Inject

data class CycleWindow(val start: Instant, val end: Instant)

data class CycleStats(
    val meter: MeterEntity,
    val cycle: CycleWindow,
    val baseline: MeterReadingEntity?,
    val latest: MeterReadingEntity?,
    val usedUnits: Double,
    val dailyRate: Double,
    val projectedUnits: Double,
    val projectionDate: Instant,
    val nextThreshold: Double?,
    val nextThresholdDate: Instant?
)

class MeterRepository @Inject constructor(
    private val meterDao: MeterDao,
    private val settingsRepository: MeterSettingsRepository
) {
    fun observeMeters(): Flow<List<MeterEntity>> = meterDao.observeMeters()

    fun observeMeter(meterId: Long): Flow<MeterEntity?> = meterDao.observeMeter(meterId)

    suspend fun upsertMeter(entity: MeterEntity): Long = meterDao.upsertMeter(entity)

    suspend fun getMeter(meterId: Long): MeterEntity? = meterDao.getMeter(meterId)

    suspend fun updateMeter(entity: MeterEntity) = meterDao.updateMeter(entity)

    suspend fun addReading(meterId: Long, value: Double, recordedAt: Instant = Instant.now()): Long =
        meterDao.insertReading(
            MeterReadingEntity(
                meterId = meterId,
                value = value,
                recordedAt = recordedAt
            )
        )

    fun observeCycleStats(clock: Clock = Clock.systemDefaultZone()): Flow<List<CycleStats>> =
        meterDao.observeMeters().mapLatest { meters ->
            meters.map { getCycleStats(it.id, clock) }
        }

    suspend fun getCycleStats(meterId: Long, clock: Clock = Clock.systemDefaultZone()): CycleStats {
        val meter = meterDao.getMeter(meterId)
            ?: error("Meter $meterId not found")
        val window = currentWindow(meter.billingAnchorDay, clock)
        val baseline = meterDao.latestBefore(meterId, window.start)
            ?: meterDao.earliestInWindow(meterId, window.start, window.end)
        val latest = meterDao.latestInWindow(meterId, window.start, window.end)
        val now = Instant.now(clock)
        val reference = latest?.recordedAt ?: now
        val daysElapsed = if (baseline != null && reference.isAfter(baseline.recordedAt)) {
            Duration.between(baseline.recordedAt, reference).toHours() / 24.0
        } else 0.0
        val usedUnits = if (baseline != null && latest != null) {
            max(0.0, latest.value - baseline.value)
        } else 0.0
        val dailyRate = if (usedUnits > 0 && daysElapsed > 0) usedUnits / daysElapsed else 0.0
        val remainingDays = if (reference.isBefore(window.end)) {
            Duration.between(reference, window.end).toHours() / 24.0
        } else 0.0
        val projectedUnits = if (dailyRate > 0) usedUnits + dailyRate * remainingDays else usedUnits
        val thresholds = meter.thresholdsCsv.split(',')
            .mapNotNull { it.trim().takeIf(String::isNotEmpty)?.toDoubleOrNull() }
            .sorted()
        val nextThreshold = thresholds.firstOrNull { it > usedUnits }
        val nextThresholdDate = if (nextThreshold != null && dailyRate > 0) {
            val deltaUnits = nextThreshold - usedUnits
            if (deltaUnits <= 0) {
                reference
            } else {
                val daysToThreshold = deltaUnits / dailyRate
                val instant = reference.plusSeconds((daysToThreshold * 86400).toLong())
                if (instant.isBefore(window.end)) instant else null
            }
        } else null
        return CycleStats(
            meter = meter,
            cycle = window,
            baseline = baseline,
            latest = latest,
            usedUnits = roundToTwo(usedUnits),
            dailyRate = roundToTwo(dailyRate),
            projectedUnits = roundToTwo(projectedUnits),
            projectionDate = window.end,
            nextThreshold = nextThreshold,
            nextThresholdDate = nextThresholdDate
        )
    }

    suspend fun getReadingsInWindow(
        meterId: Long,
        window: CycleWindow
    ): List<MeterReadingEntity> =
        meterDao.getReadingsInWindow(meterId, window.start, window.end)

    suspend fun setReminderFrequency(meterId: Long, days: Int) {
        settingsRepository.setReminderFrequency(meterId, days)
    }

    fun observeReminderFrequency(meterId: Long): Flow<Int> =
        settingsRepository.observeReminderFrequencyDays(meterId)

    companion object {
        fun currentWindow(anchorDay: Int, clock: Clock = Clock.systemDefaultZone()): CycleWindow {
            require(anchorDay in 1..31)
            val zone: ZoneId = clock.zone
            val today = LocalDate.now(clock)
            val currentAnchor = anchorDateFor(today.year, today.monthValue, anchorDay)
            val startDate = if (!today.isBefore(currentAnchor)) {
                currentAnchor
            } else {
                val prev = today.minusMonths(1)
                anchorDateFor(prev.year, prev.monthValue, anchorDay)
            }
            val nextMonth = startDate.plusMonths(1)
            val endDate = anchorDateFor(nextMonth.year, nextMonth.monthValue, anchorDay)
            return CycleWindow(
                startDate.atStartOfDay(zone).toInstant(),
                endDate.atStartOfDay(zone).toInstant()
            )
        }

        private fun anchorDateFor(year: Int, month: Int, anchorDay: Int): LocalDate {
            val firstDay = LocalDate.of(year, month, 1)
            val day = anchorDay.coerceAtMost(firstDay.lengthOfMonth())
            return firstDay.withDayOfMonth(day)
        }

        private fun roundToTwo(value: Double): Double =
            round(value * 100.0) / 100.0
    }
}
