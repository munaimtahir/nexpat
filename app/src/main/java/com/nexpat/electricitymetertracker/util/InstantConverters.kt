package com.nexpat.electricitymetertracker.util

import androidx.room.TypeConverter
import java.time.Instant

object InstantConverters {
    @TypeConverter
    @JvmStatic
    fun fromTimestamp(value: Long?): Instant? = value?.let { Instant.ofEpochMilli(it) }

    @TypeConverter
    @JvmStatic
    fun instantToTimestamp(instant: Instant?): Long? = instant?.toEpochMilli()
}
