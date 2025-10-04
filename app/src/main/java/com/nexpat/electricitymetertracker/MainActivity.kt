package com.nexpat.electricitymetertracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.nexpat.electricitymetertracker.ui.home.HomeScreen
import com.nexpat.electricitymetertracker.ui.home.HomeViewModel
import com.nexpat.electricitymetertracker.ui.history.HistoryScreen
import com.nexpat.electricitymetertracker.ui.history.HistoryViewModel
import com.nexpat.electricitymetertracker.ui.settings.SettingsScreen
import com.nexpat.electricitymetertracker.ui.settings.SettingsViewModel
import com.nexpat.electricitymetertracker.ui.theme.MeterTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MeterTheme {
                Surface {
                    MeterNavHost()
                }
            }
        }
    }
}

sealed class MeterDestination(val route: String) {
    object Home : MeterDestination("home")
    object History : MeterDestination("history/{meterId}")
    object Settings : MeterDestination("settings/{meterId}")
}

@Composable
fun MeterNavHost() {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = MeterDestination.Home.route) {
        composable(MeterDestination.Home.route) {
            val viewModel: HomeViewModel = hiltViewModel()
            val uiState = viewModel.uiState.collectAsStateWithLifecycle().value
            HomeScreen(
                state = uiState,
                onAddReading = viewModel::addQuickReading,
                onOpenHistory = { meterId ->
                    navController.navigate("history/$meterId")
                },
                onOpenSettings = { meterId ->
                    navController.navigate("settings/$meterId")
                }
            )
        }
        composable(
            MeterDestination.History.route,
            arguments = listOf(navArgument("meterId") { type = NavType.LongType })
        ) { backStackEntry ->
            val meterId = backStackEntry.arguments?.getLong("meterId") ?: return@composable
            val viewModel: HistoryViewModel = hiltViewModel()
            val uiState = viewModel.stateFor(meterId).collectAsStateWithLifecycle().value
            HistoryScreen(state = uiState, onBack = { navController.popBackStack() })
        }
        composable(
            MeterDestination.Settings.route,
            arguments = listOf(navArgument("meterId") { type = NavType.LongType })
        ) { backStackEntry ->
            val meterId = backStackEntry.arguments?.getLong("meterId") ?: return@composable
            val viewModel: SettingsViewModel = hiltViewModel()
            val state = viewModel.stateFor(meterId).collectAsStateWithLifecycle().value
            SettingsScreen(
                state = state,
                onAnchorChanged = { viewModel.updateAnchorDay(meterId, it) },
                onThresholdsChanged = { viewModel.updateThresholds(meterId, it) },
                onReminderChanged = { viewModel.updateReminderDays(meterId, it) },
                onBack = { navController.popBackStack() }
            )
        }
    }
}
