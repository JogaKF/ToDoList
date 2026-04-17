import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { StateCard } from '../components/common/StateCard';
import {
  useI18n,
  usePreferences,
  type ShoppingGroupPreference,
  type ShoppingSortPreference,
  type StartTab,
  type TranslationKey,
} from '../app/providers/PreferencesProvider';
import { ui, type ThemeId } from '../theme/ui';

const themeOptions: ThemeId[] = ['cyber', 'aurora', 'ember', 'glacier', 'grove', 'custom'];
const backgroundOptions = ['#07111F', '#06131A', '#170B12', '#102332', '#0F1A14', '#201225'];
const panelOptions = ['#0F2137', '#11282D', '#291622', '#183047', '#163031', '#352032'];
const primaryOptions = ['#1499C8', '#3BD6C6', '#FF7B54', '#7DB6FF', '#9BE15D', '#FF8AD8'];

type ColorPickerProps = {
  label: string;
  options: string[];
  selectedColor: string;
  onSelect: (color: string) => void;
};

function ColorPickerRow({ label, options, selectedColor, onSelect }: ColorPickerProps) {
  return (
    <View style={styles.pickerBlock}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.swatchGrid}>
        {options.map((color) => {
          const isSelected = selectedColor === color;

          return (
            <Pressable
              key={`${label}-${color}`}
              onPress={() => onSelect(color)}
              style={[
                styles.swatch,
                { backgroundColor: color },
                isSelected && styles.swatchSelected,
              ]}
            >
              {isSelected ? <View style={styles.swatchInner} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SettingsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const t = useI18n();
  const {
    language,
    themeId,
    customColors,
    showCompleted,
    startTab,
    shoppingSortMode,
    shoppingGroupMode,
    setLanguage,
    setTheme,
    setCustomColors,
    setShowCompleted,
    setStartTab,
    setShoppingSortMode,
    setShoppingGroupMode,
  } = usePreferences();
  const [background, setBackground] = useState(customColors.background);
  const [panel, setPanel] = useState(customColors.panel);
  const [primary, setPrimary] = useState(customColors.primary);

  const startTabOptions: StartTab[] = ['Lists', 'Planner', 'MyDay', 'Trash', 'Settings'];
  const shoppingSortOptions: ShoppingSortPreference[] = ['manual', 'alpha'];
  const shoppingGroupOptions: ShoppingGroupPreference[] = ['flat', 'unit', 'category'];

  useEffect(() => {
    setBackground(customColors.background);
    setPanel(customColors.panel);
    setPrimary(customColors.primary);
  }, [customColors.background, customColors.panel, customColors.primary]);

  return (
    <ScreenContainer bottomInset={tabBarHeight + 16}>
      <View style={styles.hero}>
        <Text style={styles.title}>{t('settings_title')}</Text>
        <Text style={styles.subtitle}>{t('settings_intro')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings_theme_section')}</Text>
        <Text style={styles.sectionHint}>{t('settings_theme_hint')}</Text>
        <View style={styles.optionGrid}>
          {themeOptions.map((option) => (
            <PrimaryButton
              key={option}
              label={t(`settings_theme_${option}` as TranslationKey)}
              tone={themeId === option ? 'primary' : 'muted'}
              onPress={() => {
                void setTheme(option);
              }}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings_language_section')}</Text>
        <Text style={styles.sectionHint}>{t('settings_language_hint')}</Text>
        <View style={styles.optionGrid}>
          <PrimaryButton
            label={t('settings_language_pl')}
            tone={language === 'pl' ? 'primary' : 'muted'}
            onPress={() => {
              void setLanguage('pl');
            }}
          />
          <PrimaryButton
            label={t('settings_language_en')}
            tone={language === 'en' ? 'primary' : 'muted'}
            onPress={() => {
              void setLanguage('en');
            }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings_behavior_section')}</Text>
        <Text style={styles.sectionHint}>{t('settings_behavior_hint')}</Text>
        <Text style={styles.inputLabel}>{t('settings_show_completed')}</Text>
        <Text style={styles.sectionHint}>{t('settings_show_completed_hint')}</Text>
        <View style={styles.optionGrid}>
          <PrimaryButton
            label={t('settings_show')}
            tone={showCompleted ? 'primary' : 'muted'}
            onPress={() => {
              void setShowCompleted(true);
            }}
          />
          <PrimaryButton
            label={t('settings_hide')}
            tone={!showCompleted ? 'primary' : 'muted'}
            onPress={() => {
              void setShowCompleted(false);
            }}
          />
        </View>
        <Text style={styles.inputLabel}>{t('settings_start_tab')}</Text>
        <View style={styles.optionGrid}>
          {startTabOptions.map((option) => (
            <PrimaryButton
              key={option}
              label={
                t(
                  `settings_start_${
                    option === 'Lists'
                      ? 'lists'
                      : option === 'Planner'
                        ? 'planner'
                      : option === 'MyDay'
                        ? 'my_day'
                        : option === 'Trash'
                          ? 'trash'
                          : 'settings'
                  }` as TranslationKey
                )
              }
              tone={startTab === option ? 'primary' : 'muted'}
              onPress={() => {
                void setStartTab(option);
              }}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings_shopping_section')}</Text>
        <Text style={styles.sectionHint}>{t('settings_shopping_hint')}</Text>
        <Text style={styles.inputLabel}>{t('settings_shopping_sort')}</Text>
        <View style={styles.optionGrid}>
          {shoppingSortOptions.map((option) => (
            <PrimaryButton
              key={option}
              label={t(`settings_shopping_sort_${option}` as TranslationKey)}
              tone={shoppingSortMode === option ? 'primary' : 'muted'}
              onPress={() => {
                void setShoppingSortMode(option);
              }}
            />
          ))}
        </View>
        <Text style={styles.inputLabel}>{t('settings_shopping_group')}</Text>
        <View style={styles.optionGrid}>
          {shoppingGroupOptions.map((option) => (
            <PrimaryButton
              key={option}
              label={t(`settings_shopping_group_${option}` as TranslationKey)}
              tone={shoppingGroupMode === option ? 'primary' : 'muted'}
              onPress={() => {
                void setShoppingGroupMode(option);
              }}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings_custom_section')}</Text>
        <Text style={styles.sectionHint}>{t('settings_custom_hint')}</Text>
        <ColorPickerRow
          label={t('settings_background')}
          options={backgroundOptions}
          selectedColor={background}
          onSelect={setBackground}
        />
        <ColorPickerRow
          label={t('settings_panel')}
          options={panelOptions}
          selectedColor={panel}
          onSelect={setPanel}
        />
        <ColorPickerRow
          label={t('settings_primary')}
          options={primaryOptions}
          selectedColor={primary}
          onSelect={setPrimary}
        />
        <PrimaryButton
          label={t('settings_apply_custom')}
          onPress={() => {
            void setCustomColors({ background, panel, primary });
          }}
        />
        <StateCard
          title={t('settings_preview_title')}
          description={t('settings_preview_description')}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 8,
    paddingTop: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: ui.colors.text,
  },
  subtitle: {
    color: ui.colors.textMuted,
    lineHeight: 22,
  },
  section: {
    backgroundColor: 'rgba(12, 27, 43, 0.76)',
    borderRadius: ui.radius.lg,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.32)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ui.colors.text,
  },
  sectionHint: {
    color: ui.colors.textMuted,
    lineHeight: 20,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerBlock: {
    gap: 8,
  },
  inputLabel: {
    color: ui.colors.textSoft,
    fontSize: 12,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderColor: ui.colors.white,
  },
  swatchInner: {
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
});
