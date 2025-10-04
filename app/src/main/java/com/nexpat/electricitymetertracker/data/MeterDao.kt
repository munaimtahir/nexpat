package com.nexpat.electricitymetertracker.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
import kotlinx.coroutines.flow.Flow
import java.time.Instant

@Dao
interface MeterDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMeter(entity: MeterEntity): Long

    @Update
    suspend fun updateMeter(entity: MeterEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReading(entity: MeterReadingEntity): Long

    @Query("SELECT * FROM meters ORDER BY id")
    fun observeMeters(): Flow<List<MeterEntity>>

    @Query("SELECT * FROM meters WHERE id = :meterId")
    fun observeMeter(meterId: Long): Flow<MeterEntity?>

    @Query("SELECT * FROM meters WHERE id = :meterId")
    suspend fun getMeter(meterId: Long): MeterEntity?

    @Query(
        "SELECT * FROM meter_readings WHERE meter_id = :meterId AND recorded_at < :instant ORDER BY recorded_at DESC LIMIT 1"
    )
    suspend fun latestBefore(meterId: Long, instant: Instant): MeterReadingEntity?

    @Query(
        "SELECT * FROM meter_readings WHERE meter_id = :meterId AND recorded_at >= :start AND recorded_at < :end ORDER BY recorded_at ASC LIMIT 1"
    )
    suspend fun earliestInWindow(meterId: Long, start: Instant, end: Instant): MeterReadingEntity?

    @Query(
        "SELECT * FROM meter_readings WHERE meter_id = :meterId AND recorded_at >= :start AND recorded_at < :end ORDER BY recorded_at DESC LIMIT 1"
    )
    suspend fun latestInWindow(meterId: Long, start: Instant, end: Instant): MeterReadingEntity?

    @Query(
        "SELECT * FROM meter_readings WHERE meter_id = :meterId AND recorded_at >= :start AND recorded_at < :end ORDER BY recorded_at ASC"
    )
    fun observeReadingsInWindow(meterId: Long, start: Instant, end: Instant): Flow<List<MeterReadingEntity>>

    @Query(
        "SELECT * FROM meter_readings WHERE meter_id = :meterId AND recorded_at >= :start AND recorded_at < :end ORDER BY recorded_at ASC"
    )
    suspend fun getReadingsInWindow(meterId: Long, start: Instant, end: Instant): List<MeterReadingEntity>

    @Transaction
    suspend fun upsertMeter(entity: MeterEntity): Long {
        return if (entity.id == 0L) {
            insertMeter(entity)
        } else {
            updateMeter(entity)
            entity.id
        }
    }
}
