package com.nexpat.electricitymetertracker.repository

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class MeterSettingsRepository @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    private fun keyForReminder(meterId: Long) = intPreferencesKey("meter_" + meterId + "_reminder_days")

    fun observeReminderFrequencyDays(meterId: Long): Flow<Int> =
        dataStore.data.map { it[keyForReminder(meterId)] ?: DEFAULT_REMINDER_DAYS }

    suspend fun setReminderFrequency(meterId: Long, days: Int) {
        dataStore.edit { prefs ->
            prefs[keyForReminder(meterId)] = days
        }
    }

    companion object {
        const val DEFAULT_REMINDER_DAYS = 7
    }
}
