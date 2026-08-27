import { CalSans_400Regular } from '@expo-google-fonts/cal-sans';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PhonePreview } from './src/components/PhonePreview';
import { AppShell } from './src/navigation/AppShell';
import { DayRecordsProvider } from './src/state/DayRecordsContext';
import { ExercisesProvider } from './src/state/ExercisesContext';
import { LivChatProvider } from './src/state/LivChatContext';
import { PreferencesProvider } from './src/state/PreferencesContext';
import { SubscriptionProvider } from './src/state/SubscriptionContext';
import { color } from './src/theme/tokens';

export default function App() {
  const [fontsLoaded] = useFonts({
    CalSans_400Regular,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Every measurement in this screen is line-height exact, so hold the first paint
  // until both faces are in — a fallback face would reflow the whole page.
  //
  // The guarantee is Latin-only: neither face maps the Hebrew block, so Hebrew text is drawn
  // by a platform fallback whose metrics we never measured. The tight boxes (ScreenTitleRow's
  // 24/32, the 10/12 labels on the task and weekly cards) are the ones to check first if
  // Hebrew clips.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: color.gray50 }} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {/* LivChat sits inside DayRecords: it reads the day's record and writes its summary. */}
      <PreferencesProvider>
        <SubscriptionProvider>
          <DayRecordsProvider>
            <LivChatProvider>
              <ExercisesProvider>
                <PhonePreview>
                  <AppShell />
                </PhonePreview>
              </ExercisesProvider>
            </LivChatProvider>
          </DayRecordsProvider>
        </SubscriptionProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
