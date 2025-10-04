package com.nexpat.electricitymetertracker.repository

import android.content.Context
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.preferencesDataStoreFile
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth.assertThat
import com.nexpat.electricitymetertracker.data.MeterDatabase
import com.nexpat.electricitymetertracker.data.MeterEntity
import com.nexpat.electricitymetertracker.data.MeterReadingEntity
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Before
import org.junit.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneId

@OptIn(ExperimentalCoroutinesApi::class)
class CycleStatsTest {
    private lateinit var context: Context
    private lateinit var database: MeterDatabase
    private lateinit var repository: MeterRepository
    private lateinit var scope: TestScope

    @Before
    fun setup() {
        context = ApplicationProvider.getApplicationContext()
        database = Room.inMemoryDatabaseBuilder(context, MeterDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        scope = TestScope(StandardTestDispatcher())
        val dataStore = PreferenceDataStoreFactory.create(
            scope = scope,
            produceFile = { context.preferencesDataStoreFile("test") }
        )
        val settingsRepository = com.nexpat.electricitymetertracker.repository.MeterSettingsRepository(dataStore)
        repository = MeterRepository(database.meterDao(), settingsRepository)
    }

    @After
    fun tearDown() {
        database.close()
    }

    @Test
    fun baselineUsesLatestBeforeWindowWhenNoReadingInside() = runTest {
        val meterId = repository.upsertMeter(MeterEntity(name = "Meter"))
        val window = MeterRepository.currentWindow(8, fixedClock("2024-10-12T00:00:00Z"))
        database.meterDao().insertReading(
            MeterReadingEntity(
                meterId = meterId,
                value = 90.0,
                recordedAt = window.start.minusSeconds(24 * 60 * 60)
            )
        )
        database.meterDao().insertReading(
            MeterReadingEntity(
                meterId = meterId,
                value = 140.0,
                recordedAt = window.start.plusSeconds(3 * 24 * 60 * 60)
            )
        )
        val stats = repository.getCycleStats(meterId, clock = fixedClock("2024-10-15T00:00:00Z"))
        assertThat(stats.baseline?.value).isWithin(0.01).of(90.0)
        assertThat(stats.usedUnits).isWithin(0.01).of(50.0)
    }

    @Test
    fun baselineUsesEarliestInWindowWhenAvailable() = runTest {
        val meterId = repository.upsertMeter(MeterEntity(name = "Meter"))
        val window = MeterRepository.currentWindow(1, fixedClock("2024-03-15T00:00:00Z"))
        database.meterDao().insertReading(
            MeterReadingEntity(
                meterId = meterId,
                value = 120.0,
                recordedAt = window.start.plusSeconds(2 * 24 * 60 * 60)
            )
        )
        database.meterDao().insertReading(
            MeterReadingEntity(
                meterId = meterId,
                value = 160.0,
                recordedAt = window.start.plusSeconds(10 * 24 * 60 * 60)
            )
        )
        val stats = repository.getCycleStats(meterId, clock = fixedClock("2024-03-20T00:00:00Z"))
        assertThat(stats.baseline?.value).isWithin(0.01).of(120.0)
        assertThat(stats.usedUnits).isWithin(0.01).of(40.0)
    }

    @Test
    fun projectionAndThresholdEtc() = runTest {
        val meterId = repository.upsertMeter(
            MeterEntity(name = "Meter", thresholdsCsv = "200,300")
        )
        val window = MeterRepository.currentWindow(5, fixedClock("2024-06-15T00:00:00Z"))
        database.meterDao().insertReading(
            MeterReadingEntity(
                meterId = meterId,
                value = 100.0,
                recordedAt = window.start.plusSeconds(1 * 24 * 60 * 60)
            )
        )
        database.meterDao().insertReading(
            MeterReadingEntity(
                meterId = meterId,
                value = 180.0,
                recordedAt = window.start.plusSeconds(6 * 24 * 60 * 60)
            )
        )
        val stats = repository.getCycleStats(meterId, clock = fixedClock("2024-06-15T00:00:00Z"))
        assertThat(stats.usedUnits).isWithin(0.01).of(80.0)
        assertThat(stats.dailyRate).isWithin(0.01).of(16.0)
        assertThat(stats.projectedUnits).isGreaterThan(80.0)
        assertThat(stats.nextThreshold).isEqualTo(200.0)
        assertThat(stats.nextThresholdDate).isNotNull()
    }

    @Test
    fun zeroRateYieldsNoThresholdEta() = runTest {
        val meterId = repository.upsertMeter(
            MeterEntity(name = "Meter", thresholdsCsv = "200")
        )
        val window = MeterRepository.currentWindow(3, fixedClock("2024-04-15T00:00:00Z"))
        database.meterDao().insertReading(
            MeterReadingEntity(
                meterId = meterId,
                value = 150.0,
                recordedAt = window.start.plusSeconds(1 * 24 * 60 * 60)
            )
        )
        database.meterDao().insertReading(
            MeterReadingEntity(
                meterId = meterId,
                value = 150.0,
                recordedAt = window.start.plusSeconds(5 * 24 * 60 * 60)
            )
        )
        val stats = repository.getCycleStats(meterId, clock = fixedClock("2024-04-20T00:00:00Z"))
        assertThat(stats.dailyRate).isWithin(0.01).of(0.0)
        assertThat(stats.nextThresholdDate).isNull()
    }

    private fun fixedClock(instant: String): Clock =
        Clock.fixed(Instant.parse(instant), ZoneId.of("UTC"))
}
