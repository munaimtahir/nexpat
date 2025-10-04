package com.nexpat.electricitymetertracker.worker

import android.content.Context
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.preferencesDataStoreFile
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import androidx.work.WorkerFactory
import androidx.work.WorkerParameters
import androidx.work.testing.TestListenableWorkerBuilder
import com.google.common.truth.Truth.assertThat
import com.nexpat.electricitymetertracker.data.MeterDatabase
import com.nexpat.electricitymetertracker.data.MeterEntity
import com.nexpat.electricitymetertracker.data.MeterReadingEntity
import com.nexpat.electricitymetertracker.repository.MeterRepository
import com.nexpat.electricitymetertracker.repository.MeterSettingsRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Before
import org.junit.Test
import java.time.Instant
import java.time.temporal.ChronoUnit

class MeterReminderWorkerTest {
    private lateinit var context: Context
    private lateinit var database: MeterDatabase
    private lateinit var repository: MeterRepository
    private lateinit var dispatcher: FakeDispatcher

    @Before
    fun setup() {
        context = ApplicationProvider.getApplicationContext()
        database = Room.inMemoryDatabaseBuilder(context, MeterDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        val dataStore = PreferenceDataStoreFactory.create(
            scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
        ) {
            context.preferencesDataStoreFile("worker-test")
        }
        val settingsRepository = MeterSettingsRepository(dataStore)
        repository = MeterRepository(database.meterDao(), settingsRepository)
        dispatcher = FakeDispatcher()
    }

    @After
    fun tearDown() {
        database.close()
        context.deleteDatabase("worker-test")
    }

    @Test
    fun thresholdNotificationWithinSevenDays() = runBlocking {
        val meterId = repository.upsertMeter(MeterEntity(name = "Meter", thresholdsCsv = "100"))
        val window = MeterRepository.currentWindow(1)
        database.meterDao().insertReading(
            MeterReadingEntity(
                meterId = meterId,
                value = 0.0,
                recordedAt = window.start
            )
        )
        database.meterDao().insertReading(
            MeterReadingEntity(
                meterId = meterId,
                value = 80.0,
                recordedAt = Instant.now()
            )
        )
        val worker = buildWorker()
        val result = worker.doWork()
        assertThat(result).isEqualTo(androidx.work.ListenableWorker.Result.success())
        assertThat(dispatcher.notifications.any { it.message.contains("100") }).isTrue()
    }

    @Test
    fun nudgeTriggeredAfterTenDaysWithoutReading() = runBlocking {
        val meterId = repository.upsertMeter(MeterEntity(name = "Meter"))
        val window = MeterRepository.currentWindow(1)
        database.meterDao().insertReading(
            MeterReadingEntity(
                meterId = meterId,
                value = 50.0,
                recordedAt = window.start.minus(12, ChronoUnit.DAYS)
            )
        )
        val worker = buildWorker()
        worker.doWork()
        assertThat(dispatcher.notifications.count { it.message.contains("No readings") }).isEqualTo(1)
    }

    private fun buildWorker(): MeterReminderWorker {
        return TestListenableWorkerBuilder<MeterReminderWorker>(context)
            .setWorkerFactory(object : WorkerFactory() {
                override fun createWorker(
                    appContext: Context,
                    workerClassName: String,
                    workerParameters: WorkerParameters
                ): androidx.work.ListenableWorker? {
                    return MeterReminderWorker(appContext, workerParameters, repository, dispatcher)
                }
            })
            .build() as MeterReminderWorker
    }

    private class FakeDispatcher : MeterNotificationDispatcher(ApplicationProvider.getApplicationContext()) {
        val notifications = mutableListOf<Notification>()

        data class Notification(val id: Int, val title: String, val message: String)

        override fun notify(id: Int, title: String, message: String) {
            notifications += Notification(id, title, message)
        }
    }
}
