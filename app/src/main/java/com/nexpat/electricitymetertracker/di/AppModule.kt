package com.nexpat.electricitymetertracker.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import com.nexpat.electricitymetertracker.data.MeterDao
import com.nexpat.electricitymetertracker.data.MeterDatabase
import com.nexpat.electricitymetertracker.repository.MeterRepository
import com.nexpat.electricitymetertracker.repository.MeterSettingsRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

private const val DATASTORE_NAME = "meter_settings"

private val Context.dataStore by preferencesDataStore(DATASTORE_NAME)

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): MeterDatabase =
        MeterDatabase.build(context)

    @Provides
    fun provideMeterDao(database: MeterDatabase): MeterDao = database.meterDao()

    @Provides
    @Singleton
    fun provideDataStore(@ApplicationContext context: Context): DataStore<Preferences> =
        context.dataStore

    @Provides
    @Singleton
    fun provideSettingsRepository(dataStore: DataStore<Preferences>): MeterSettingsRepository =
        MeterSettingsRepository(dataStore)

    @Provides
    @Singleton
    fun provideMeterRepository(
        dao: MeterDao,
        settingsRepository: MeterSettingsRepository
    ): MeterRepository = MeterRepository(dao, settingsRepository)
}
