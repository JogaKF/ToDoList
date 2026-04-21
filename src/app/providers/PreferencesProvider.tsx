import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { settingsRepository } from '../../db/repositories/settingsRepository';
import { applyTheme, buildCustomTheme, themePresets, type ThemeColors, type ThemeId } from '../../theme/ui';

type Language = 'pl' | 'en';
export type StartTab = 'Lists' | 'Planner' | 'MyDay' | 'Trash' | 'Settings';
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
  dueReminderEnabled: boolean;
  dueReminderTime: string;
  myDayReminderEnabled: boolean;
  myDayReminderTime: string;
  dailyReviewEnabled: boolean;
  dailyReviewTime: string;
  setLanguage: (language: Language) => Promise<void>;
  setTheme: (themeId: ThemeId) => Promise<void>;
  setCustomColors: (colors: Partial<{ background: string; panel: string; primary: string }>) => Promise<void>;
  setShowCompleted: (value: boolean) => Promise<void>;
  setStartTab: (tab: StartTab) => Promise<void>;
  setShoppingSortMode: (mode: ShoppingSortPreference) => Promise<void>;
  setShoppingGroupMode: (mode: ShoppingGroupPreference) => Promise<void>;
  setDueReminderEnabled: (value: boolean) => Promise<void>;
  setDueReminderTime: (time: string) => Promise<void>;
  setMyDayReminderEnabled: (value: boolean) => Promise<void>;
  setMyDayReminderTime: (time: string) => Promise<void>;
  setDailyReviewEnabled: (value: boolean) => Promise<void>;
  setDailyReviewTime: (time: string) => Promise<void>;
  reloadPreferences: () => Promise<void>;
};

const translations = {
  pl: {
    tab_lists: 'Listy',
    tab_planner: 'Planner',
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
    settings_backup_section: 'Backup danych',
    settings_backup_hint: 'Wyeksportuj wszystko do JSON albo nadpisz lokalna baze plikiem backupu.',
    settings_backup_export: 'Eksportuj JSON',
    settings_backup_import: 'Importuj plik',
    settings_backup_confirm_title: 'Nadpisac lokalne dane?',
    settings_backup_confirm_hint: 'Import zastapi aktualne listy, zadania, kosz, ustawienia i historie zmian.',
    settings_backup_status_shared: 'Backup zapisany i gotowy do udostepnienia.',
    settings_backup_status_saved: 'Backup zapisany lokalnie w katalogu dokumentow aplikacji.',
    settings_backup_status_imported: 'Backup zostal wczytany do lokalnej bazy.',
    settings_backup_status_error: 'Nie udalo sie przetworzyc pliku backupu.',
    settings_backup_status_idle: 'JSON obejmuje listy, zadania, ustawienia, kosz, historie i zakupy.',
    settings_backup_file_label: 'Plik backupu',
    settings_backup_summary_lists: 'Listy',
    settings_backup_summary_items: 'Elementy',
    settings_backup_summary_deleted: 'Usuniete',
    settings_backup_summary_settings: 'Ustawienia',
    settings_backup_summary_activity: 'Historia',
    settings_backup_summary_categories: 'Kategorie',
    settings_backup_summary_favorites: 'Ulubione',
    settings_backup_summary_dictionary: 'Slownik',
    settings_notifications_section: 'Powiadomienia lokalne',
    settings_notifications_hint: 'Przypomnienia sa planowane na urzadzeniu z lokalnej bazy, bez syncu i bez internetu.',
    settings_notifications_due: 'Przypomnienia o terminach',
    settings_notifications_due_hint: 'Jedno przypomnienie dla aktywnych zadan z ustawionym terminem.',
    settings_notifications_my_day: 'Przypomnienia Moj dzien',
    settings_notifications_my_day_hint: 'Jedno przypomnienie dziennie, jesli wybrany dzien ma aktywne zadania.',
    settings_notifications_daily_review: 'Codzienny przeglad',
    settings_notifications_daily_review_hint: 'Stale codzienne przypomnienie, zeby sprawdzic plan dnia.',
    settings_notifications_time: 'Godzina',
    settings_enabled: 'Wlacz',
    settings_disabled: 'Wylacz',
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
    settings_start_planner: 'Planner',
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
    settings_shopping_dictionary: 'Slownik produktow',
    settings_shopping_dictionary_hint: 'Zarzadzaj produktami uzywanymi w podpowiedziach i wyborze po kategoriach.',
    settings_open_dictionary: 'Otworz slownik',
    dictionary_eyebrow: 'Shopping dictionary',
    dictionary_title: 'Slownik produktow',
    dictionary_subtitle: 'Produkty ze slownika podpowiadaja sie podczas wpisywania i sa dostepne w wyborze po kategoriach.',
    dictionary_edit_product_title: 'Edytuj produkt',
    dictionary_add_product_title: 'Dodaj produkt do slownika',
    dictionary_name: 'Nazwa',
    dictionary_name_placeholder: 'Np. Mleko',
    dictionary_quantity: 'Ilosc',
    dictionary_quantity_placeholder: 'Np. 2',
    dictionary_unit: 'Jednostka',
    dictionary_unit_placeholder: 'Np. l',
    dictionary_category: 'Kategoria',
    dictionary_custom_category_placeholder: 'Nowa kategoria',
    dictionary_add_category: 'Dodaj kategorie',
    dictionary_save_changes: 'Zapisz zmiany',
    dictionary_add_product: 'Dodaj produkt',
    dictionary_cancel_edit: 'Anuluj edycje',
    dictionary_browse_title: 'Przegladaj slownik',
    dictionary_search_placeholder: 'Szukaj produktu albo kategorii',
    dictionary_all: 'Wszystkie',
    dictionary_loading_title: 'Laduje slownik',
    dictionary_loading_hint: 'Pobieram produkty zapisane lokalnie.',
    dictionary_empty_title: 'Slownik jest pusty',
    dictionary_empty_hint: 'Dodaj produkt recznie albo dodaj produkty na liscie zakupow, a slownik zacznie budowac sie automatycznie.',
    dictionary_no_results_title: 'Brak wynikow',
    dictionary_no_results_hint: 'Zmien filtr albo wpisz inna fraze, zeby zobaczyc zapisane produkty.',
    dictionary_products: 'Produkty',
    dictionary_no_category: 'Bez kategorii',
    dictionary_no_category_or_unit: 'Bez kategorii i jednostki',
    dictionary_edit: 'Edytuj',
    dictionary_delete: 'Usun',
    dictionary_error_name_required: 'Podaj nazwe produktu.',
    dictionary_remove_title: 'Usunac produkt ze slownika?',
    dictionary_remove_hint: 'Produkt zniknie z podpowiedzi, ale nie zniknie z istniejacych list.',
    dictionary_remove_hint_missing: 'Produkt zniknie z podpowiedzi.',
    dictionary_cancel: 'Anuluj',
    dictionary_remove_action: 'Usun',
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
    planner_title: 'Planner',
    planner_intro: 'Przegladaj terminy, Moj dzien i zadania bez daty z jednego offline widoku.',
    planner_eyebrow: 'Local planning grid',
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
    tab_planner: 'Planner',
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
    settings_backup_section: 'Data backup',
    settings_backup_hint: 'Export everything to JSON or replace the local database from a backup file.',
    settings_backup_export: 'Export JSON',
    settings_backup_import: 'Import file',
    settings_backup_confirm_title: 'Replace local data?',
    settings_backup_confirm_hint: 'Import will replace the current lists, tasks, trash, settings and activity history.',
    settings_backup_status_shared: 'Backup saved and ready to share.',
    settings_backup_status_saved: 'Backup saved locally in the app documents directory.',
    settings_backup_status_imported: 'Backup has been imported into local storage.',
    settings_backup_status_error: 'Backup file could not be processed.',
    settings_backup_status_idle: 'The JSON contains lists, tasks, settings, trash, history and shopping data.',
    settings_backup_file_label: 'Backup file',
    settings_backup_summary_lists: 'Lists',
    settings_backup_summary_items: 'Items',
    settings_backup_summary_deleted: 'Deleted',
    settings_backup_summary_settings: 'Settings',
    settings_backup_summary_activity: 'History',
    settings_backup_summary_categories: 'Categories',
    settings_backup_summary_favorites: 'Favorites',
    settings_backup_summary_dictionary: 'Dictionary',
    settings_notifications_section: 'Local notifications',
    settings_notifications_hint: 'Reminders are scheduled on this device from local data, without sync or internet.',
    settings_notifications_due: 'Due date reminders',
    settings_notifications_due_hint: 'One reminder for active tasks with a due date.',
    settings_notifications_my_day: 'My Day reminders',
    settings_notifications_my_day_hint: 'One reminder per day when that day has active tasks.',
    settings_notifications_daily_review: 'Daily review',
    settings_notifications_daily_review_hint: 'A recurring daily reminder to review your plan.',
    settings_notifications_time: 'Time',
    settings_enabled: 'Enable',
    settings_disabled: 'Disable',
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
    settings_start_planner: 'Planner',
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
    settings_shopping_dictionary: 'Product dictionary',
    settings_shopping_dictionary_hint: 'Manage products used for suggestions and category-based picking.',
    settings_open_dictionary: 'Open dictionary',
    dictionary_eyebrow: 'Shopping dictionary',
    dictionary_title: 'Product dictionary',
    dictionary_subtitle: 'Dictionary products appear while typing and can be picked by category.',
    dictionary_edit_product_title: 'Edit product',
    dictionary_add_product_title: 'Add product to dictionary',
    dictionary_name: 'Name',
    dictionary_name_placeholder: 'E.g. Milk',
    dictionary_quantity: 'Quantity',
    dictionary_quantity_placeholder: 'E.g. 2',
    dictionary_unit: 'Unit',
    dictionary_unit_placeholder: 'E.g. l',
    dictionary_category: 'Category',
    dictionary_custom_category_placeholder: 'New category',
    dictionary_add_category: 'Add category',
    dictionary_save_changes: 'Save changes',
    dictionary_add_product: 'Add product',
    dictionary_cancel_edit: 'Cancel editing',
    dictionary_browse_title: 'Browse dictionary',
    dictionary_search_placeholder: 'Search product or category',
    dictionary_all: 'All',
    dictionary_loading_title: 'Loading dictionary',
    dictionary_loading_hint: 'Reading locally saved products.',
    dictionary_empty_title: 'Dictionary is empty',
    dictionary_empty_hint: 'Add a product manually or add items on a shopping list, and the dictionary will build itself automatically.',
    dictionary_no_results_title: 'No results',
    dictionary_no_results_hint: 'Change the filter or search phrase to see saved products.',
    dictionary_products: 'Products',
    dictionary_no_category: 'No category',
    dictionary_no_category_or_unit: 'No category or unit',
    dictionary_edit: 'Edit',
    dictionary_delete: 'Delete',
    dictionary_error_name_required: 'Enter product name.',
    dictionary_remove_title: 'Remove product from dictionary?',
    dictionary_remove_hint: 'The product will disappear from suggestions, but existing lists will stay unchanged.',
    dictionary_remove_hint_missing: 'The product will disappear from suggestions.',
    dictionary_cancel: 'Cancel',
    dictionary_remove_action: 'Remove',
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
    planner_title: 'Planner',
    planner_intro: 'Review due dates, My Day items and unscheduled tasks from one offline view.',
    planner_eyebrow: 'Local planning grid',
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

function normalizeTime(value: string | null | undefined, fallback: string) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return fallback;
  }

  const [hour, minute] = value.split(':').map(Number);
  if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
    return value;
  }

  return fallback;
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
  const [dueReminderEnabled, setDueReminderEnabledState] = useState(false);
  const [dueReminderTime, setDueReminderTimeState] = useState('09:00');
  const [myDayReminderEnabled, setMyDayReminderEnabledState] = useState(false);
  const [myDayReminderTime, setMyDayReminderTimeState] = useState('08:00');
  const [dailyReviewEnabled, setDailyReviewEnabledState] = useState(false);
  const [dailyReviewTime, setDailyReviewTimeState] = useState('18:00');
  const [customColors, setCustomColorsState] = useState({
    background: '',
    panel: '',
    primary: '',
  });

  const loadPreferences = useCallback(async () => {
    const values = await settingsRepository.getAll(db);
    const nextLanguage = values.language === 'en' ? 'en' : 'pl';
    const nextThemeId = (values.themeId as ThemeId) || 'cyber';
    const nextShowCompleted = values.showCompleted !== 'false';
    const nextStartTab =
      values.startTab === 'Planner' || values.startTab === 'MyDay' || values.startTab === 'Trash' || values.startTab === 'Settings'
        ? (values.startTab as StartTab)
        : 'Lists';
    const nextShoppingSortMode = values.shoppingSortMode === 'alpha' ? 'alpha' : 'manual';
    const nextShoppingGroupMode =
      values.shoppingGroupMode === 'unit' || values.shoppingGroupMode === 'category'
        ? (values.shoppingGroupMode as ShoppingGroupPreference)
        : 'flat';
    const nextDueReminderEnabled = values.dueReminderEnabled === 'true';
    const nextDueReminderTime = normalizeTime(values.dueReminderTime, '09:00');
    const nextMyDayReminderEnabled = values.myDayReminderEnabled === 'true';
    const nextMyDayReminderTime = normalizeTime(values.myDayReminderTime, '08:00');
    const nextDailyReviewEnabled = values.dailyReviewEnabled === 'true';
    const nextDailyReviewTime = normalizeTime(values.dailyReviewTime, '18:00');
    const nextCustom = {
      background: values.customBackground ?? '',
      panel: values.customPanel ?? '',
      primary: values.customPrimary ?? '',
    };
    const nextTheme =
      nextThemeId === 'custom'
        ? buildCustomTheme(nextCustom)
        : themePresets[(nextThemeId as Exclude<ThemeId, 'custom'>) || 'cyber'];

    setLanguageState(nextLanguage);
    setThemeIdState(nextThemeId);
    setShowCompletedState(nextShowCompleted);
    setStartTabState(nextStartTab);
    setShoppingSortModeState(nextShoppingSortMode);
    setShoppingGroupModeState(nextShoppingGroupMode);
    setDueReminderEnabledState(nextDueReminderEnabled);
    setDueReminderTimeState(nextDueReminderTime);
    setMyDayReminderEnabledState(nextMyDayReminderEnabled);
    setMyDayReminderTimeState(nextMyDayReminderTime);
    setDailyReviewEnabledState(nextDailyReviewEnabled);
    setDailyReviewTimeState(nextDailyReviewTime);
    setCustomColorsState(nextCustom);
    setThemeState(nextTheme);
    applyTheme(nextTheme);
    setIsReady(true);
  }, [db]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!isMounted) {
        return;
      }

      await loadPreferences();
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [loadPreferences]);

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

  const setDueReminderEnabled = useCallback(
    async (value: boolean) => {
      setDueReminderEnabledState(value);
      await settingsRepository.set(db, 'dueReminderEnabled', value ? 'true' : 'false');
    },
    [db]
  );

  const setDueReminderTime = useCallback(
    async (time: string) => {
      const nextTime = normalizeTime(time, '09:00');
      setDueReminderTimeState(nextTime);
      await settingsRepository.set(db, 'dueReminderTime', nextTime);
    },
    [db]
  );

  const setMyDayReminderEnabled = useCallback(
    async (value: boolean) => {
      setMyDayReminderEnabledState(value);
      await settingsRepository.set(db, 'myDayReminderEnabled', value ? 'true' : 'false');
    },
    [db]
  );

  const setMyDayReminderTime = useCallback(
    async (time: string) => {
      const nextTime = normalizeTime(time, '08:00');
      setMyDayReminderTimeState(nextTime);
      await settingsRepository.set(db, 'myDayReminderTime', nextTime);
    },
    [db]
  );

  const setDailyReviewEnabled = useCallback(
    async (value: boolean) => {
      setDailyReviewEnabledState(value);
      await settingsRepository.set(db, 'dailyReviewEnabled', value ? 'true' : 'false');
    },
    [db]
  );

  const setDailyReviewTime = useCallback(
    async (time: string) => {
      const nextTime = normalizeTime(time, '18:00');
      setDailyReviewTimeState(nextTime);
      await settingsRepository.set(db, 'dailyReviewTime', nextTime);
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
      dueReminderEnabled,
      dueReminderTime,
      myDayReminderEnabled,
      myDayReminderTime,
      dailyReviewEnabled,
      dailyReviewTime,
      setLanguage,
      setTheme,
      setCustomColors,
      setShowCompleted,
      setStartTab,
      setShoppingSortMode,
      setShoppingGroupMode,
      setDueReminderEnabled,
      setDueReminderTime,
      setMyDayReminderEnabled,
      setMyDayReminderTime,
      setDailyReviewEnabled,
      setDailyReviewTime,
      reloadPreferences: loadPreferences,
    }),
    [
      customColors,
      dailyReviewEnabled,
      dailyReviewTime,
      dueReminderEnabled,
      dueReminderTime,
      isReady,
      language,
      loadPreferences,
      setCustomColors,
      setDailyReviewEnabled,
      setDailyReviewTime,
      setDueReminderEnabled,
      setDueReminderTime,
      setLanguage,
      setMyDayReminderEnabled,
      setMyDayReminderTime,
      setShoppingGroupMode,
      setShoppingSortMode,
      setShowCompleted,
      setStartTab,
      setTheme,
      myDayReminderEnabled,
      myDayReminderTime,
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
