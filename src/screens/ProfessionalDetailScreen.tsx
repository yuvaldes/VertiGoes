import { CalendarPlus, EnvelopeSimple, MapPin, Phone, Translate } from 'phosphor-react-native';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { ProfessionalAvatar } from '../components/ProfessionalAvatar';
import { Ring } from '../components/Ring';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import type { TabKey } from '../data/home';
import { professionalById } from '../data/professionals';
import { useDisplayFont, useT } from '../i18n';
import { color, font, frame, shadow } from '../theme/tokens';

type Props = {
  id: string;
  onBack: () => void;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

const ICON = 18;

export function ProfessionalDetailScreen({ id, onBack, activeTab, onChangeTab }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const professional = professionalById(id);

  /** Mocked like the emergency dial: real intent, reserved test number behind it. */
  const open = (url: string) => {
    if (Platform.OS === 'web') {
      console.log(`[mock] would open ${url}`);
      return;
    }
    Linking.openURL(url).catch(() => console.warn(`[mock] could not open ${url}`));
  };

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <ScreenTitleRow
            title={professional?.name ?? t('browse.proDetail.fallbackTitle')}
            onBack={onBack}
          />
        </AppHeader>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!professional ? (
          <Text style={styles.missing}>{t('browse.proDetail.missing')}</Text>
        ) : (
          <>
            <View style={styles.hero}>
              <ProfessionalAvatar name={professional.name} photoUrl={professional.photoUrl} size={88} />
              <Text style={[styles.name, displayFont]}>{professional.name}</Text>
              <Text style={styles.profession}>{t(professional.professionKey)}</Text>
              <Text style={styles.years}>
                {t('browse.proDetail.yearsAndCity', {
                  years: professional.yearsExperience,
                  city: t(professional.cityKey),
                })}
              </Text>
              <View
                style={[
                  styles.status,
                  professional.acceptingPatients ? styles.statusOpen : styles.statusClosed,
                ]}
              >
                <Text
                  style={[
                    styles.statusLabel,
                    professional.acceptingPatients
                      ? styles.statusLabelOpen
                      : styles.statusLabelClosed,
                  ]}
                >
                  {professional.acceptingPatients
                    ? t('browse.proDetail.statusAccepting')
                    : t('browse.proDetail.statusWaitlist')}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, displayFont]}>
                {t('browse.proDetail.sectionAbout')}
              </Text>
              <Text style={styles.paragraph}>{t(professional.aboutKey)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, displayFont]}>
                {t('browse.proDetail.sectionSpecialties')}
              </Text>
              <View style={styles.chips}>
                {professional.specialtyKeys.map((specialtyKey) => (
                  <View key={specialtyKey} style={styles.chip}>
                    <Text style={styles.chipLabel}>{t(specialtyKey)}</Text>
                    <Ring radius={14} color={color.brand100} />
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, displayFont]}>
                {t('browse.proDetail.sectionContact')}
              </Text>

              <Pressable
                style={styles.contactRow}
                onPress={() => open(`tel:${professional.phone.replace(/[^+\d]/g, '')}`)}
                accessibilityRole="button"
                accessibilityLabel={t('browse.proDetail.a11yCall', { name: professional.name })}
              >
                <Phone size={ICON} color={color.brand500} />
                <Text style={styles.contactValue}>{professional.phone}</Text>
              </Pressable>

              <Pressable
                style={styles.contactRow}
                onPress={() => open(`mailto:${professional.email}`)}
                accessibilityRole="button"
                accessibilityLabel={t('browse.proDetail.a11yEmail', { name: professional.name })}
              >
                <EnvelopeSimple size={ICON} color={color.brand500} />
                <Text style={styles.contactValue}>{professional.email}</Text>
              </Pressable>

              <View style={styles.contactRow}>
                <MapPin size={ICON} color={color.gray500} />
                <Text style={styles.contactPlain}>
                  {t('browse.proDetail.clinicLine', {
                    clinic: t(professional.clinicKey),
                    city: t(professional.cityKey),
                  })}
                </Text>
              </View>

              <View style={styles.contactRow}>
                <Translate size={ICON} color={color.gray500} />
                <Text style={styles.contactPlain}>
                  {professional.languageKeys.map((key) => t(key)).join(', ')}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.book}
              onPress={() =>
                console.log(`[stub] book an appointment with ${professional.name}`)
              }
              accessibilityRole="button"
            >
              <CalendarPlus size={18} weight="fill" color={color.white} />
              <Text style={styles.bookLabel}>{t('browse.proDetail.bookCta')}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <BottomBarSlot />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: color.gray50,
  },
  gutter: {
    paddingHorizontal: frame.gutter,
  },
  scroll: {
    flex: 1,
    marginTop: 8,
  },
  content: {
    paddingHorizontal: frame.gutter,
    paddingBottom: 24,
    gap: 20,
  },
  missing: {
    fontFamily: font.body,
    fontSize: 14,
    color: color.gray500,
  },
  hero: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
  },
  name: {
    marginTop: 8,
    fontFamily: font.display,
    fontSize: 22,
    lineHeight: 30,
    color: color.black,
    textAlign: 'center',
  },
  profession: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 19,
    color: color.gray700,
    textAlign: 'center',
  },
  years: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray500,
  },
  status: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: color.success100,
  },
  statusClosed: {
    backgroundColor: color.orange100,
  },
  statusLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 11,
    lineHeight: 15,
  },
  statusLabelOpen: {
    color: color.success500,
  },
  statusLabelClosed: {
    color: color.orange500,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.black,
  },
  paragraph: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray700,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: color.brand50,
  },
  chipLabel: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray900,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 28,
  },
  contactValue: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: color.brand500,
  },
  contactPlain: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray700,
  },
  book: {
    height: 48,
    borderRadius: 12,
    backgroundColor: color.brand500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadow.xs,
  },
  bookLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    color: color.white,
  },
});
