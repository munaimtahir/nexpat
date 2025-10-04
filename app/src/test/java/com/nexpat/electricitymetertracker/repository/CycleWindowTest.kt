package com.nexpat.electricitymetertracker.repository

import com.google.common.truth.Truth.assertThat
import org.junit.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneId

class CycleWindowTest {
    @Test
    fun currentWindow_handlesAnchorOn31stInShortMonth() {
        val clock = fixedClock("2024-02-15T00:00:00Z")
        val window = MeterRepository.currentWindow(anchorDay = 31, clock = clock)
        assertThat(window.start).isEqualTo(Instant.parse("2024-01-31T00:00:00Z"))
        assertThat(window.end).isEqualTo(Instant.parse("2024-02-29T00:00:00Z"))
    }

    @Test
    fun currentWindow_rollsOverWhenBeforeAnchor() {
        val clock = fixedClock("2024-05-05T00:00:00Z")
        val window = MeterRepository.currentWindow(anchorDay = 8, clock = clock)
        assertThat(window.start).isEqualTo(Instant.parse("2024-04-08T00:00:00Z"))
        assertThat(window.end).isEqualTo(Instant.parse("2024-05-08T00:00:00Z"))
    }

    @Test
    fun currentWindow_handlesFebruaryAnchor29() {
        val clock = fixedClock("2023-02-10T00:00:00Z")
        val window = MeterRepository.currentWindow(anchorDay = 29, clock = clock)
        assertThat(window.start).isEqualTo(Instant.parse("2023-01-29T00:00:00Z"))
        assertThat(window.end).isEqualTo(Instant.parse("2023-02-28T00:00:00Z"))
    }

    private fun fixedClock(instant: String): Clock =
        Clock.fixed(Instant.parse(instant), ZoneId.of("UTC"))
}
