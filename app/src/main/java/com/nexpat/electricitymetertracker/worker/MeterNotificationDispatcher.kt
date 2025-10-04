package com.nexpat.electricitymetertracker.worker

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.nexpat.electricitymetertracker.R
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
open class MeterNotificationDispatcher @Inject constructor(private val context: Context) {
    init {
        ensureChannel()
    }

    open fun notify(id: Int, title: String, message: String) {
        val notification = NotificationCompat.Builder(context, MeterReminderWorker.CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()
        NotificationManagerCompat.from(context).notify(id, notification)
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                MeterReminderWorker.CHANNEL_ID,
                context.getString(R.string.channel_name),
                NotificationManager.IMPORTANCE_DEFAULT
            )
            val manager = context.getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}
