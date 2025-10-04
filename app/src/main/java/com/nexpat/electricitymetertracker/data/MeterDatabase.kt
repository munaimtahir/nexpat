package com.nexpat.electricitymetertracker.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.nexpat.electricitymetertracker.util.InstantConverters

@Database(
    entities = [MeterEntity::class, MeterReadingEntity::class],
    version = 2,
    exportSchema = true
)
@TypeConverters(InstantConverters::class)
abstract class MeterDatabase : RoomDatabase() {
    abstract fun meterDao(): MeterDao

    companion object {
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(database: SupportSQLiteDatabase) {
                database.execSQL("ALTER TABLE meters ADD COLUMN billing_anchor_day INTEGER NOT NULL DEFAULT 1")
                database.execSQL("ALTER TABLE meters ADD COLUMN thresholds_csv TEXT NOT NULL DEFAULT '200,300'")
            }
        }

        fun build(context: Context): MeterDatabase = Room.databaseBuilder(
            context,
            MeterDatabase::class.java,
            "meter.db"
        ).addMigrations(MIGRATION_1_2)
            .fallbackToDestructiveMigrationOnDowngrade()
            .build()
    }
}
