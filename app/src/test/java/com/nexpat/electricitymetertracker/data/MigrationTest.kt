package com.nexpat.electricitymetertracker.data

import android.content.Context
import androidx.room.Room
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Before
import org.junit.Test
import java.io.File

class MigrationTest {
    private lateinit var context: Context
    private lateinit var dbFile: File

    @Before
    fun setup() {
        context = ApplicationProvider.getApplicationContext()
        dbFile = context.getDatabasePath(TEST_DB)
        if (dbFile.exists()) {
            dbFile.delete()
        }
    }

    @After
    fun tearDown() {
        context.deleteDatabase(TEST_DB)
    }

    @Test
    fun migrationAddsAnchorAndThresholdColumns() {
        createVersion1Database(context)
        val migrated = Room.databaseBuilder(context, MeterDatabase::class.java, TEST_DB)
            .addMigrations(MeterDatabase.MIGRATION_1_2)
            .build()
        val meter = runBlocking { migrated.meterDao().getMeter(1) }
        assertThat(meter).isNotNull()
        assertThat(meter!!.billingAnchorDay).isEqualTo(1)
        assertThat(meter.thresholdsCsv).isEqualTo("200,300")
        migrated.close()
    }

    private fun createVersion1Database(context: Context) {
        val helper = FrameworkSQLiteOpenHelperFactory().create(
            androidx.sqlite.db.SupportSQLiteOpenHelper.Configuration.builder(context)
                .name(TEST_DB)
                .callback(object : androidx.sqlite.db.SupportSQLiteOpenHelper.Callback(1) {
                    override fun onCreate(db: SupportSQLiteDatabase) {
                        db.execSQL(
                            """
                            CREATE TABLE IF NOT EXISTS meters (
                                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                                name TEXT NOT NULL
                            )
                            """.trimIndent()
                        )
                        db.execSQL(
                            """
                            CREATE TABLE IF NOT EXISTS meter_readings (
                                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                                meter_id INTEGER NOT NULL,
                                value REAL NOT NULL,
                                recorded_at INTEGER NOT NULL,
                                FOREIGN KEY(meter_id) REFERENCES meters(id) ON DELETE CASCADE
                            )
                            """.trimIndent()
                        )
                    }

                    override fun onUpgrade(
                        db: SupportSQLiteDatabase,
                        oldVersion: Int,
                        newVersion: Int
                    ) = Unit
                })
                .build()
        )
        val db = helper.writableDatabase
        db.execSQL("INSERT INTO meters (id, name) VALUES (1, 'Legacy meter')")
        db.close()
    }

    companion object {
        private const val TEST_DB = "migration-test.db"
    }
}
