import { Text, View } from 'react-native';

import type {
  TranslationKey,
  ShoppingGroupPreference,
  ShoppingSortPreference,
  StartTab,
} from '../../app/providers/PreferencesProvider';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { StateCard } from '../../components/common/StateCard';
import type { ThemeId } from '../../theme/ui';
import { ColorPickerRow } from './ColorPickerRow';
import {
  backgroundOptions,
  notificationTimeOptions,
  panelOptions,
  primaryOptions,
  shoppingGroupOptions,
  shoppingSortOptions,
  startTabOptions,
  themeOptions,
} from './constants';
import { getBackupStatusCopy, getStartTabTranslationKey } from './helpers';
import { styles } from './styles';
import type { BackupStatus } from './types';

type SettingsContentProps = {
  t: (key: TranslationKey) => string;
  bottomInset: number;
  language: 'pl' | 'en';
  themeId: ThemeId;
  showCompleted: boolean;
  startTab: StartTab;
  shoppingSortMode: ShoppingSortPreference;
  shoppingGroupMode: ShoppingGroupPreference;
  dueReminderEnabled: boolean;
  dueReminderTime: string;
  myDayReminderEnabled: boolean;
  myDayReminderTime: string;
  dailyReviewEnabled: boolean;
  dailyReviewTime: string;
  background: string;
  panel: string;
  primary: string;
  onSetLanguage: (value: 'pl' | 'en') => void;
  onSetTheme: (value: ThemeId) => void;
  onSetShowCompleted: (value: boolean) => void;
  onSetStartTab: (value: StartTab) => void;
  onSetShoppingSortMode: (value: ShoppingSortPreference) => void;
  onSetShoppingGroupMode: (value: ShoppingGroupPreference) => void;
  onOpenProductDictionary: () => void;
  onOpenActivityLog: () => void;
  onSetDueReminderEnabled: (value: boolean) => void;
  onSetDueReminderTime: (value: string) => void;
  onSetMyDayReminderEnabled: (value: boolean) => void;
  onSetMyDayReminderTime: (value: string) => void;
  onSetDailyReviewEnabled: (value: boolean) => void;
  onSetDailyReviewTime: (value: string) => void;
  onSetBackground: (value: string) => void;
  onSetPanel: (value: string) => void;
  onSetPrimary: (value: string) => void;
  onApplyCustomColors: () => void;
  isBackupBusy: boolean;
  backupStatus: BackupStatus;
  onExportBackup: () => void;
  onImportBackup: () => void;
};

export function SettingsContent({
  t,
  bottomInset,
  language,
  themeId,
  showCompleted,
  startTab,
  shoppingSortMode,
  shoppingGroupMode,
  dueReminderEnabled,
  dueReminderTime,
  myDayReminderEnabled,
  myDayReminderTime,
  dailyReviewEnabled,
  dailyReviewTime,
  background,
  panel,
  primary,
  onSetLanguage,
  onSetTheme,
  onSetShowCompleted,
  onSetStartTab,
  onSetShoppingSortMode,
  onSetShoppingGroupMode,
  onOpenProductDictionary,
  onOpenActivityLog,
  onSetDueReminderEnabled,
  onSetDueReminderTime,
  onSetMyDayReminderEnabled,
  onSetMyDayReminderTime,
  onSetDailyReviewEnabled,
  onSetDailyReviewTime,
  onSetBackground,
  onSetPanel,
  onSetPrimary,
  onApplyCustomColors,
  isBackupBusy,
  backupStatus,
  onExportBackup,
  onImportBackup,
}: SettingsContentProps) {
  const backupCard = getBackupStatusCopy(t, backupStatus);
  const renderTimeOptions = (selectedTime: string, onSelect: (value: string) => void) => (
    <View style={styles.optionGrid}>
      {notificationTimeOptions.map((time) => (
        <PrimaryButton
          key={time}
          label={time}
          tone={selectedTime === time ? 'primary' : 'muted'}
          onPress={() => onSelect(time)}
        />
      ))}
    </View>
  );

  return (
    <ScreenContainer bottomInset={bottomInset}>
      <View style={styles.hero}>
        <Text style={styles.title}>{t('settings_title')}</Text>
        <Text style={styles.subtitle}>{t('settings_intro')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings_shopping_dictionary')}</Text>
        <Text style={styles.sectionHint}>{t('settings_shopping_dictionary_hint')}</Text>
        <PrimaryButton label={t('settings_open_dictionary')} onPress={onOpenProductDictionary} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings_activity_log')}</Text>
        <Text style={styles.sectionHint}>{t('settings_activity_log_hint')}</Text>
        <PrimaryButton label={t('settings_open_activity_log')} tone="muted" onPress={onOpenActivityLog} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings_behavior_section')}</Text>
        <Text style={styles.sectionHint}>{t('settings_behavior_hint')}</Text>
        <Text style={styles.inputLabel}>{t('settings_show_completed')}</Text>
        <Text style={styles.sectionHint}>{t('settings_show_completed_hint')}</Text>
        <View style={styles.optionGrid}>
          <PrimaryButton label={t('settings_show')} tone={showCompleted ? 'primary' : 'muted'} onPress={() => onSetShowCompleted(true)} />
          <PrimaryButton label={t('settings_hide')} tone={!showCompleted ? 'primary' : 'muted'} onPress={() => onSetShowCompleted(false)} />
        </View>
        <Text style={styles.inputLabel}>{t('settings_start_tab')}</Text>
        <View style={styles.optionGrid}>
          {startTabOptions.map((option) => (
            <PrimaryButton
              key={option}
              label={t(getStartTabTranslationKey(option))}
              tone={startTab === option ? 'primary' : 'muted'}
              onPress={() => onSetStartTab(option)}
            />
          ))}
        </View>
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
              onPress={() => onSetTheme(option)}
            />
          ))}
        </View>
        <Text style={styles.inputLabel}>{t('settings_custom_section')}</Text>
        <Text style={styles.sectionHint}>{t('settings_custom_hint')}</Text>
        <ColorPickerRow label={t('settings_background')} options={backgroundOptions} selectedColor={background} onSelect={onSetBackground} />
        <ColorPickerRow label={t('settings_panel')} options={panelOptions} selectedColor={panel} onSelect={onSetPanel} />
        <ColorPickerRow label={t('settings_primary')} options={primaryOptions} selectedColor={primary} onSelect={onSetPrimary} />
        <PrimaryButton label={t('settings_apply_custom')} onPress={onApplyCustomColors} />
        <StateCard title={t('settings_preview_title')} description={t('settings_preview_description')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings_language_section')}</Text>
        <Text style={styles.sectionHint}>{t('settings_language_hint')}</Text>
        <View style={styles.optionGrid}>
          <PrimaryButton label={t('settings_language_pl')} tone={language === 'pl' ? 'primary' : 'muted'} onPress={() => onSetLanguage('pl')} />
          <PrimaryButton label={t('settings_language_en')} tone={language === 'en' ? 'primary' : 'muted'} onPress={() => onSetLanguage('en')} />
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
              onPress={() => onSetShoppingSortMode(option)}
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
              onPress={() => onSetShoppingGroupMode(option)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings_notifications_section')}</Text>
        <Text style={styles.sectionHint}>{t('settings_notifications_hint')}</Text>

        <View style={styles.pickerBlock}>
          <Text style={styles.inputLabel}>{t('settings_notifications_due')}</Text>
          <Text style={styles.sectionHint}>{t('settings_notifications_due_hint')}</Text>
          <View style={styles.optionGrid}>
            <PrimaryButton label={t('settings_enabled')} tone={dueReminderEnabled ? 'primary' : 'muted'} onPress={() => onSetDueReminderEnabled(true)} />
            <PrimaryButton label={t('settings_disabled')} tone={!dueReminderEnabled ? 'primary' : 'muted'} onPress={() => onSetDueReminderEnabled(false)} />
          </View>
          {dueReminderEnabled ? (
            <>
              <Text style={styles.inputLabel}>{t('settings_notifications_time')}</Text>
              {renderTimeOptions(dueReminderTime, onSetDueReminderTime)}
            </>
          ) : null}
        </View>

        <View style={styles.pickerBlock}>
          <Text style={styles.inputLabel}>{t('settings_notifications_my_day')}</Text>
          <Text style={styles.sectionHint}>{t('settings_notifications_my_day_hint')}</Text>
          <View style={styles.optionGrid}>
            <PrimaryButton label={t('settings_enabled')} tone={myDayReminderEnabled ? 'primary' : 'muted'} onPress={() => onSetMyDayReminderEnabled(true)} />
            <PrimaryButton label={t('settings_disabled')} tone={!myDayReminderEnabled ? 'primary' : 'muted'} onPress={() => onSetMyDayReminderEnabled(false)} />
          </View>
          {myDayReminderEnabled ? (
            <>
              <Text style={styles.inputLabel}>{t('settings_notifications_time')}</Text>
              {renderTimeOptions(myDayReminderTime, onSetMyDayReminderTime)}
            </>
          ) : null}
        </View>

        <View style={styles.pickerBlock}>
          <Text style={styles.inputLabel}>{t('settings_notifications_daily_review')}</Text>
          <Text style={styles.sectionHint}>{t('settings_notifications_daily_review_hint')}</Text>
          <View style={styles.optionGrid}>
            <PrimaryButton label={t('settings_enabled')} tone={dailyReviewEnabled ? 'primary' : 'muted'} onPress={() => onSetDailyReviewEnabled(true)} />
            <PrimaryButton label={t('settings_disabled')} tone={!dailyReviewEnabled ? 'primary' : 'muted'} onPress={() => onSetDailyReviewEnabled(false)} />
          </View>
          {dailyReviewEnabled ? (
            <>
              <Text style={styles.inputLabel}>{t('settings_notifications_time')}</Text>
              {renderTimeOptions(dailyReviewTime, onSetDailyReviewTime)}
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings_backup_section')}</Text>
        <Text style={styles.sectionHint}>{t('settings_backup_hint')}</Text>
        <View style={styles.optionGrid}>
          <PrimaryButton label={t('settings_backup_export')} disabled={isBackupBusy} onPress={onExportBackup} />
          <PrimaryButton label={t('settings_backup_import')} tone="muted" disabled={isBackupBusy} onPress={onImportBackup} />
        </View>
        <StateCard title={backupCard.title} description={backupCard.description} tone={backupCard.tone} />
      </View>
    </ScreenContainer>
  );
}
