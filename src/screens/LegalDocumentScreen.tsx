import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BackButton } from '../components/BackButton';
import { BottomBarSlot } from '../components/BottomBar';
import { legalPages, type LegalDocumentKey } from '../data/legal';
import { useDisplayFont, useLocale, useT } from '../i18n';
import { color, font, frame } from '../theme/tokens';

export function LegalDocumentScreen({ document, onBack }: {
  document: LegalDocumentKey;
  onBack: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const displayFont = useDisplayFont();
  const title = t(`legal.${document}.title`);

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <View style={styles.header}>
            <BackButton onPress={onBack} />
            <Text accessibilityRole="header" style={[styles.title, displayFont]}>{title}</Text>
          </View>
        </AppHeader>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {legalPages(document, locale).map((page, index) => (
          <View key={index} style={styles.page}>
            <Text style={styles.text} selectable>{page}</Text>
          </View>
        ))}
      </ScrollView>
      <BottomBarSlot />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, backgroundColor: color.gray50 },
  gutter: { paddingHorizontal: frame.gutter },
  header: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontFamily: font.display, fontSize: 22, lineHeight: 30, color: color.black },
  content: { paddingHorizontal: frame.gutter, paddingBottom: 32, gap: 16 },
  page: { backgroundColor: color.white, borderRadius: 16, padding: 18 },
  text: { fontFamily: font.body, fontSize: 14, lineHeight: 22, color: color.gray900 },
});
