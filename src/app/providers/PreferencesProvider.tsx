import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { settingsRepository } from '../../db/repositories/settingsRepository';
import { applyTheme, buildCustomTheme, themePresets, type ThemeColors, type ThemeId } from '../../theme/ui';

type Language = 'pl' | 'en';
export type StartTab = 'Lists' | 'MyDay' | 'Trash' | 'Settings';
export type ShoppingSortPreference = 'manual' | 'alpha';
export type ShoppingGroupPreference = 'flat' | 'unit' | 'category';

type PreferencesContextValue = {
  isReady: boolean;
  language: Language;
  themeId: ThemeId;
  theme: ThemeColors;
  customColors: {
    background: string;
    panel: string;
    primary: string;
  };
  showCompleted: boolean;
  startTab: StartTab;
  shoppingSortMode: ShoppingSortPreference;
  shoppingGroupMode: ShoppingGroupPreference;
  setLanguage: (language: Language) => Promise<void>;
  setTheme: (themeId: ThemeId) => Promise<void>;
  setCustomColors: (colors: Partial<{ background: string; panel: string; primary: string }>) => Promise<void>;
  setShowCompleted: (value: boolean) => Promise<void>;
  setStartTab: (tab: StartTab) => Promise<void>;
  setShoppingSortMode: (mode: ShoppingSortPreference) => Promise<void>;
  setShoppingGroupMode: (mode: ShoppingGroupPreference) => Promise<void>;
};

const translations = {
  pl: {
    tab_lists: 'Listy',
    tab_my_day: 'Moj dzien',
    tab_trash: 'Kosz',
    tab_settings: 'Ustawienia',
    list_details: 'Szczegoly listy',
    task_details_title: 'Szczegoly zadania',
    undo_title: 'Cofnij ostatnia akcje',
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
    settings_theme_glacier: 'Glacier',
    settings_theme_grove: 'Grove',
    settings_theme_custom: 'Custom',
    settings_language_pl: 'Polski',
    settings_language_en: 'Angielski',
    settings_behavior_section: 'Zachowanie aplikacji',
    settings_behavior_hint: 'Te opcje zmieniaja domyslny sposob otwierania i prezentacji danych.',
    settings_show_completed: 'Pokazuj ukonczone',
    settings_show_completed_hint: 'Kontroluje sekcje zakonczonych zadan i zakupow.',
    settings_start_tab: 'Ekran startowy',
    settings_start_lists: 'Listy',
    settings_start_my_day: 'Moj dzien',
    settings_start_trash: 'Kosz',
    settings_start_settings: 'Ustawienia',
    settings_shopping_section: 'Widok zakupow',
    settings_shopping_hint: 'Domyslne opcje dla nowych otwarc list zakupow.',
    settings_shopping_sort: 'Domyslne sortowanie',
    settings_shopping_sort_manual: 'Reczne',
    settings_shopping_sort_alpha: 'A-Z',
    settings_shopping_group: 'Domyslne grupowanie',
    settings_shopping_group_flat: 'Bez grup',
    settings_shopping_group_unit: 'Jednostki',
    settings_shopping_group_category: 'Kategorie',
    settings_show: 'Pokazuj',
    settings_hide: 'Ukryj',
    settings_preview_title: 'Podglad',
    settings_preview_description: 'Tu od razu sprawdzisz, jak wyglada wybrany motyw i ustawienia.',
    lists_title: 'Twoje listy',
    lists_intro: 'Wszystko zapisuje sie lokalnie. Szybko, bez internetu, bez chaosu.',
    lists_eyebrow: 'Offline-first command center',
    my_day_title: 'Moj dzien',
    my_day_intro: 'Widok dnia oparty wylacznie o lokalna baze i pole `myDayDate`.',
    my_day_eyebrow: 'Daily focus protocol',
    trash_title: 'Kosz',
    trash_intro: 'Tu odzyskasz lokalnie usuniete listy i elementy bez backendu i bez syncu.',
    trash_eyebrow: 'Offline recovery zone',
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
    task_details_title: 'Task details',
    undo_title: 'Undo last action',
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
    settings_theme_glacier: 'Glacier',
    settings_theme_grove: 'Grove',
    settings_theme_custom: 'Custom',
    settings_language_pl: 'Polish',
    settings_language_en: 'English',
    settings_behavior_section: 'App behavior',
    settings_behavior_hint: 'These options control default opening and data presentation.',
    settings_show_completed: 'Show completed',
    settings_show_completed_hint: 'Controls completed sections for tasks and shopping items.',
    settings_start_tab: 'Start screen',
    settings_start_lists: 'Lists',
    settings_start_my_day: 'My Day',
    settings_start_trash: 'Trash',
    settings_start_settings: 'Settings',
    settings_shopping_section: 'Shopping view',
    settings_shopping_hint: 'Default options when opening shopping lists.',
    settings_shopping_sort: 'Default sort',
    settings_shopping_sort_manual: 'Manual',
    settings_shopping_sort_alpha: 'A-Z',
    settings_shopping_group: 'Default grouping',
    settings_shopping_group_flat: 'No groups',
    settings_shopping_group_unit: 'Units',
    settings_shopping_group_category: 'Categories',
    settings_show: 'Show',
    settings_hide: 'Hide',
    settings_preview_title: 'Preview',
    settings_preview_description: 'Use this area to quickly verify your selected theme and behavior.',
    lists_title: 'Your lists',
    lists_intro: 'Everything is stored locally. Fast, offline, without chaos.',
    lists_eyebrow: 'Offline-first command center',
    my_day_title: 'My Day',
    my_day_intro: 'A day view powered entirely by local storage and the `myDayDate` field.',
    my_day_eyebrow: 'Daily focus protocol',
    trash_title: 'Trash',
    trash_intro: 'Recover deleted lists and items locally, without backend or sync.',
    trash_eyebrow: 'Offline recovery zone',
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
  const [isReady, setIsReady] = useState(false);
  const [language, setLanguageState] = useState<Language>('pl');
  const [themeId, setThemeIdState] = useState<ThemeId>('cyber');
  const [theme, setThemeState] = useState<ThemeColors>(themePresets.cyber);
  const [showCompleted, setShowCompletedState] = useState(true);
  const [startTab, setStartTabState] = useState<StartTab>('Lists');
  const [shoppingSortMode, setShoppingSortModeState] = useState<ShoppingSortPreference>('manual');
  const [shoppingGroupMode, setShoppingGroupModeState] = useState<ShoppingGroupPreference>('flat');
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
      const nextShowCompleted = values.showCompleted !== 'false';
      const nextStartTab =
        values.startTab === 'MyDay' || values.startTab === 'Trash' || values.startTab === 'Settings'
          ? (values.startTab as StartTab)
          : 'Lists';
      const nextShoppingSortMode = values.shoppingSortMode === 'alpha' ? 'alpha' : 'manual';
      const nextShoppingGroupMode =
        values.shoppingGroupMode === 'unit' || values.shoppingGroupMode === 'category'
          ? (values.shoppingGroupMode as ShoppingGroupPreference)
          : 'flat';
      const nextCustom = {
        background: values.customBackground ?? '',
        panel: values.customPanel ?? '',
        primary: values.customPrimary ?? '',
      };

      setLanguageState(nextLanguage);
      setThemeIdState(nextThemeId);
      setShowCompletedState(nextShowCompleted);
      setStartTabState(nextStartTab);
      setShoppingSortModeState(nextShoppingSortMode);
      setShoppingGroupModeState(nextShoppingGroupMode);
      setCustomColorsState(nextCustom);
      const nextTheme =
        nextThemeId === 'custom'
          ? buildCustomTheme(nextCustom)
          : themePresets[(nextThemeId as Exclude<ThemeId, 'custom'>) || 'cyber'];
      setThemeState(nextTheme);
      applyTheme(nextTheme);
      setIsReady(true);
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

  const setShowCompleted = useCallback(
    async (value: boolean) => {
      setShowCompletedState(value);
      await settingsRepository.set(db, 'showCompleted', value ? 'true' : 'false');
    },
    [db]
  );

  const setStartTab = useCallback(
    async (tab: StartTab) => {
      setStartTabState(tab);
      await settingsRepository.set(db, 'startTab', tab);
    },
    [db]
  );

  const setShoppingSortMode = useCallback(
    async (mode: ShoppingSortPreference) => {
      setShoppingSortModeState(mode);
      await settingsRepository.set(db, 'shoppingSortMode', mode);
    },
    [db]
  );

  const setShoppingGroupMode = useCallback(
    async (mode: ShoppingGroupPreference) => {
      setShoppingGroupModeState(mode);
      await settingsRepository.set(db, 'shoppingGroupMode', mode);
    },
    [db]
  );

  const value = useMemo(
    () => ({
      language,
      themeId,
      theme,
      customColors,
      isReady,
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
    }),
    [
      customColors,
      isReady,
      language,
      setCustomColors,
      setLanguage,
      setShoppingGroupMode,
      setShoppingSortMode,
      setShowCompleted,
      setStartTab,
      setTheme,
      shoppingGroupMode,
      shoppingSortMode,
      showCompleted,
      startTab,
      theme,
      themeId,
    ]
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
