package com.nexpat.electricitymetertracker.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.nexpat.electricitymetertracker.R
import com.nexpat.electricitymetertracker.repository.MeterRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.flow.first
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@HiltWorker
class MeterReminderWorker @AssistedInject constructor(
    @Assisted private val appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val repository: MeterRepository,
    private val dispatcher: MeterNotificationDispatcher
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val meters = repository.observeMeters().first()
        val zone = ZoneId.systemDefault()
        var notified = false
        for (meter in meters) {
            val stats = repository.getCycleStats(meter.id)
            val reminderFrequency = repository.observeReminderFrequency(meter.id).first()
            val now = Instant.now()
            val latestTime = stats.latest?.recordedAt ?: stats.baseline?.recordedAt
            if (latestTime == null || Duration.between(latestTime, now).toDays() >= reminderFrequency) {
                dispatcher.notify(
                    meter.id.toInt() * 3 + 1,
                    appContext.getString(R.string.reminder_title, meter.name),
                    appContext.getString(R.string.reminder_body, reminderFrequency)
                )
                notified = true
            }
            val tenthDayInstant = stats.cycle.start.plusSeconds(10L * 24 * 60 * 60)
            if (now.isAfter(tenthDayInstant) && stats.latest == null) {
                dispatcher.notify(
                    meter.id.toInt() * 3 + 2,
                    appContext.getString(R.string.nudge_title, meter.name),
                    appContext.getString(R.string.nudge_body)
                )
                notified = true
            }
            val nextThresholdDate = stats.nextThresholdDate
            if (nextThresholdDate != null) {
                val daysUntil = Duration.between(now, nextThresholdDate).toDays()
                if (daysUntil in 0..7) {
                    val formatted = DateTimeFormatter.ofPattern("dd MMM").withZone(zone)
                    dispatcher.notify(
                        meter.id.toInt() * 3 + 3,
                        appContext.getString(R.string.threshold_title, meter.name),
                        appContext.getString(
                            R.string.threshold_body,
                            stats.nextThreshold ?: 0.0,
                            formatted.format(nextThresholdDate)
                        )
                    )
                    notified = true
                }
            }
        }
        return if (notified) Result.success() else Result.success()
    }

    companion object {
        const val CHANNEL_ID = "meter_reminders"
    }
}
