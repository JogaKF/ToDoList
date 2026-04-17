import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { settingsRepository } from '../../db/repositories/settingsRepository';
import { applyTheme, buildCustomTheme, themePresets, type ThemeColors, type ThemeId } from '../../theme/ui';

type Language = 'pl' | 'en';

type PreferencesContextValue = {
  language: Language;
  themeId: ThemeId;
  theme: ThemeColors;
  customColors: {
    background: string;
    panel: string;
    primary: string;
  };
  setLanguage: (language: Language) => Promise<void>;
  setTheme: (themeId: ThemeId) => Promise<void>;
  setCustomColors: (colors: Partial<{ background: string; panel: string; primary: string }>) => Promise<void>;
};

const translations = {
  pl: {
    tab_lists: 'Listy',
    tab_my_day: 'Moj dzien',
    tab_trash: 'Kosz',
    tab_settings: 'Ustawienia',
    list_details: 'Szczegoly listy',
    settings_title: 'Ustawienia',
    settings_intro: 'Dopasuj wyglad aplikacji i podstawowy jezyk interfejsu.',
    settings_theme_section: 'Motyw',
    settings_theme_hint: 'Zmiana zapisuje sie lokalnie i dziala po restarcie aplikacji.',
    settings_language_section: 'Jezyk',
    settings_language_hint: 'Na start udostepniamy polski i angielski.',
    settings_custom_section: 'Wlasne kolory',
    settings_custom_hint: 'Mozesz nadpisac tlo, panel i glowny kolor akcji.',
    settings_background: 'Tlo',
    settings_panel: 'Panel',
    settings_primary: 'Akcent',
    settings_apply_custom: 'Zapisz motyw custom',
    settings_theme_cyber: 'Cyber',
    settings_theme_aurora: 'Aurora',
    settings_theme_ember: 'Ember',
    settings_theme_custom: 'Custom',
    settings_language_pl: 'Polski',
    settings_language_en: 'Angielski',
    lists_title: 'Twoje listy',
    lists_intro: 'Wszystko zapisuje sie lokalnie. Szybko, bez internetu, bez chaosu.',
    lists_create: 'Utworz nowa liste',
    lists_name_hint: 'Krotka, czytelna nazwa. Wszystko zapisze sie lokalnie.',
    lists_tasks: 'Taski',
    lists_shopping: 'Zakupy',
    lists_create_button: 'Utworz liste',
    lists_open: 'Otworz',
    lists_empty: 'Nie masz jeszcze zadnej listy',
    lists_empty_hint: 'Zacznij od jednej listy i potraktuj ja jak swoje lokalne centrum dowodzenia.',
    my_day_loading: 'Laduje plan dnia',
    my_day_loading_hint: 'Zbieram z lokalnej bazy wszystko, co przypisales do wybranego dnia.',
    my_day_empty: 'Brak zadan na wybrany dzien',
    my_day_empty_hint: 'Otworz dowolna liste i zaplanuj zadanie na dzis albo jutro bez internetu.',
    trash_loading: 'Laduje kosz',
    trash_loading_hint: 'Sprawdzam lokalnie, co mozna jeszcze przywrocic.',
    trash_empty: 'Kosz jest pusty',
    trash_empty_hint: 'Soft delete dziala. Gdy cos usuniesz, odzyskasz to tutaj.',
    trash_deleted_lists: 'Usuniete listy',
    trash_deleted_items: 'Usuniete elementy',
    trash_restore_list: 'Przywroc liste',
    trash_restore_item: 'Przywroc element',
    details_loading: 'Laduje zawartosc listy',
    details_loading_hint: 'Buduje lokalne drzewo elementow i porzadkuje widok.',
    details_expand_all: 'Rozwin wszystko',
    details_collapse_all: 'Zwin wszystko',
    details_new_task: 'Nowy task',
    details_new_item: 'Nowa pozycja',
    details_add_task: 'Dodaj task',
    details_add_product: 'Dodaj produkty',
    details_empty_tasks: 'Ta lista jest jeszcze pusta',
    details_empty_tasks_hint: 'Dodaj pierwszy task i buduj drzewo przez subtaski.',
    details_empty_shopping: 'Lista zakupow jest jeszcze pusta',
    details_empty_shopping_hint: 'Dodaj pierwsze produkty i odhaczaj je podczas zakupow.',
    settings_hex_note: 'Uzyj pelnych kolorow w formacie #RRGGBB. Niepoprawne wartosci zostana pominiete.',
  },
  en: {
    tab_lists: 'Lists',
    tab_my_day: 'My Day',
    tab_trash: 'Trash',
    tab_settings: 'Settings',
    list_details: 'List details',
    settings_title: 'Settings',
    settings_intro: 'Adjust the app look and the base interface language.',
    settings_theme_section: 'Theme',
    settings_theme_hint: 'The change is stored locally and survives app restarts.',
    settings_language_section: 'Language',
    settings_language_hint: 'For now we support Polish and English.',
    settings_custom_section: 'Custom colors',
    settings_custom_hint: 'You can override background, panel and primary action color.',
    settings_background: 'Background',
    settings_panel: 'Panel',
    settings_primary: 'Accent',
    settings_apply_custom: 'Save custom theme',
    settings_theme_cyber: 'Cyber',
    settings_theme_aurora: 'Aurora',
    settings_theme_ember: 'Ember',
    settings_theme_custom: 'Custom',
    settings_language_pl: 'Polish',
    settings_language_en: 'English',
    lists_title: 'Your lists',
    lists_intro: 'Everything is stored locally. Fast, offline, without chaos.',
    lists_create: 'Create a new list',
    lists_name_hint: 'Keep it short and clear. Everything stays local.',
    lists_tasks: 'Tasks',
    lists_shopping: 'Shopping',
    lists_create_button: 'Create list',
    lists_open: 'Open',
    lists_empty: 'You do not have any lists yet',
    lists_empty_hint: 'Start with one list and treat it like your local command center.',
    my_day_loading: 'Loading your day plan',
    my_day_loading_hint: 'I am gathering everything assigned to the selected day from local storage.',
    my_day_empty: 'No tasks for the selected day',
    my_day_empty_hint: 'Open any list and plan a task for today or tomorrow, offline.',
    trash_loading: 'Loading trash',
    trash_loading_hint: 'Checking locally what can still be restored.',
    trash_empty: 'Trash is empty',
    trash_empty_hint: 'Soft delete works. When you remove something, you can recover it here.',
    trash_deleted_lists: 'Deleted lists',
    trash_deleted_items: 'Deleted items',
    trash_restore_list: 'Restore list',
    trash_restore_item: 'Restore item',
    details_loading: 'Loading list content',
    details_loading_hint: 'Building the local tree and preparing the view.',
    details_expand_all: 'Expand all',
    details_collapse_all: 'Collapse all',
    details_new_task: 'New task',
    details_new_item: 'New item',
    details_add_task: 'Add task',
    details_add_product: 'Add products',
    details_empty_tasks: 'This list is still empty',
    details_empty_tasks_hint: 'Add your first task and grow the tree with subtasks.',
    details_empty_shopping: 'This shopping list is still empty',
    details_empty_shopping_hint: 'Add your first products and check them off while shopping.',
    settings_hex_note: 'Use full colors in #RRGGBB format. Invalid values will be ignored.',
  },
} as const;

export type TranslationKey = keyof typeof translations.pl;

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function normalizeColor(value: string) {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return '';
}

export function PreferencesProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [language, setLanguageState] = useState<Language>('pl');
  const [themeId, setThemeIdState] = useState<ThemeId>('cyber');
  const [theme, setThemeState] = useState<ThemeColors>(themePresets.cyber);
  const [customColors, setCustomColorsState] = useState({
    background: '',
    panel: '',
    primary: '',
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const values = await settingsRepository.getAll(db);
      if (!isMounted) {
        return;
      }

      const nextLanguage = values.language === 'en' ? 'en' : 'pl';
      const nextThemeId = (values.themeId as ThemeId) || 'cyber';
      const nextCustom = {
        background: values.customBackground ?? '',
        panel: values.customPanel ?? '',
        primary: values.customPrimary ?? '',
      };

      setLanguageState(nextLanguage);
      setThemeIdState(nextThemeId);
      setCustomColorsState(nextCustom);
      const nextTheme =
        nextThemeId === 'custom'
          ? buildCustomTheme(nextCustom)
          : themePresets[(nextThemeId as Exclude<ThemeId, 'custom'>) || 'cyber'];
      setThemeState(nextTheme);
      applyTheme(nextTheme);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [db]);

  const setLanguage = useCallback(
    async (nextLanguage: Language) => {
      setLanguageState(nextLanguage);
      await settingsRepository.set(db, 'language', nextLanguage);
    },
    [db]
  );

  const setTheme = useCallback(
    async (nextThemeId: ThemeId) => {
      setThemeIdState(nextThemeId);
      const nextTheme =
        nextThemeId === 'custom'
          ? buildCustomTheme(customColors)
          : themePresets[nextThemeId as Exclude<ThemeId, 'custom'>];
      setThemeState(nextTheme);
      applyTheme(nextTheme);
      await settingsRepository.set(db, 'themeId', nextThemeId);
    },
    [customColors, db]
  );

  const setCustomColors = useCallback(
    async (partial: Partial<{ background: string; panel: string; primary: string }>) => {
      const nextCustom = {
        background: partial.background !== undefined ? normalizeColor(partial.background) : customColors.background,
        panel: partial.panel !== undefined ? normalizeColor(partial.panel) : customColors.panel,
        primary: partial.primary !== undefined ? normalizeColor(partial.primary) : customColors.primary,
      };

      setCustomColorsState(nextCustom);
      setThemeIdState('custom');
      const nextTheme = buildCustomTheme(nextCustom);
      setThemeState(nextTheme);
      applyTheme(nextTheme);

      await Promise.all([
        settingsRepository.set(db, 'themeId', 'custom'),
        settingsRepository.set(db, 'customBackground', nextCustom.background || null),
        settingsRepository.set(db, 'customPanel', nextCustom.panel || null),
        settingsRepository.set(db, 'customPrimary', nextCustom.primary || null),
      ]);
    },
    [customColors.background, customColors.panel, customColors.primary, db]
  );

  const value = useMemo(
    () => ({
      language,
      themeId,
      theme,
      customColors,
      setLanguage,
      setTheme,
      setCustomColors,
    }),
    [customColors, language, setCustomColors, setLanguage, setTheme, theme, themeId]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }

  return context;
}

export function useTheme() {
  return usePreferences().theme;
}

export function useI18n() {
  const { language } = usePreferences();

  return useCallback(
    (key: TranslationKey) => translations[language][key],
    [language]
  );
}
