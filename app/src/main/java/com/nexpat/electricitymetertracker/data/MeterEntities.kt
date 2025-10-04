package com.nexpat.electricitymetertracker.data

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import java.time.Instant

@Entity(tableName = "meters")
data class MeterEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    @ColumnInfo(name = "billing_anchor_day")
    val billingAnchorDay: Int = 1,
    @ColumnInfo(name = "thresholds_csv")
    val thresholdsCsv: String = "200,300"
)

@Entity(
    tableName = "meter_readings",
    foreignKeys = [
        ForeignKey(
            entity = MeterEntity::class,
            parentColumns = ["id"],
            childColumns = ["meter_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("meter_id"), Index(value = ["meter_id", "recorded_at"], unique = true)]
)
data class MeterReadingEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    @ColumnInfo(name = "meter_id")
    val meterId: Long,
    val value: Double,
    @ColumnInfo(name = "recorded_at")
    val recordedAt: Instant
)
