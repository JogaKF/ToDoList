import { Text, TextInput, View, Pressable } from 'react-native';

import { PrimaryButton } from '../../components/common/PrimaryButton';
import type { TranslationKey } from '../../app/providers/PreferencesProvider';
import type { ShoppingFavorite, ShoppingHistoryEntry } from '../../features/items/types';
import { ui } from '../../theme/ui';
import { dateKeyWithOffset, todayKey } from '../../utils/date';
import { recurrenceLabels, recurrenceOptions, shoppingQuickUnits } from './constants';
import type { ShoppingTemplate } from './helpers';
import { buildTemplateKey } from './helpers';
import { styles } from './styles';

type ComposerSectionProps = {
  t: (key: TranslationKey) => string;
  isShoppingList: boolean;
  newTaskTitle: string;
  newTaskError: string | null;
  onChangeNewTaskTitle: (value: string) => void;
  onSubmit: () => void;
  composerCategory: string;
  composerQuantity: string;
  composerUnit: string;
  composerNote: string;
  composerDueDate: string;
  composerRecurrenceType: (typeof recurrenceOptions)[number];
  composerRecurrenceInterval: string;
  composerRecurrenceUnit: 'days' | 'weeks' | 'months';
  onChangeComposerCategory: (value: string) => void;
  onChangeComposerQuantity: (value: string) => void;
  onChangeComposerUnit: (value: string) => void;
  onChangeComposerNote: (value: string) => void;
  onChangeComposerDueDate: (value: string) => void;
  onChangeComposerRecurrenceType: (value: (typeof recurrenceOptions)[number]) => void;
  onChangeComposerRecurrenceInterval: (value: string) => void;
  onChangeComposerRecurrenceUnit: (value: 'days' | 'weeks' | 'months') => void;
  showComposerDetails: boolean;
  onToggleComposerDetails: () => void;
  showShoppingDetails: boolean;
  showShoppingFavorites: boolean;
  showShoppingHistory: boolean;
  showShoppingCategories: boolean;
  onToggleShoppingDetails: () => void;
  onToggleShoppingFavorites: () => void;
  onToggleShoppingHistory: () => void;
  onToggleShoppingCategories: () => void;
  customCategoryName: string;
  onChangeCustomCategoryName: (value: string) => void;
  onAddCustomCategory: () => void;
  allShoppingCategoryNames: string[];
  shoppingSuggestions: ShoppingTemplate[];
  shoppingFavorites: ShoppingFavorite[];
  shoppingHistory: ShoppingHistoryEntry[];
  onApplyShoppingTemplate: (template: ShoppingTemplate) => void;
  onCreateFromShoppingTemplate: (template: ShoppingTemplate) => void;
  selectedBrowseCategory: string | null;
  onToggleBrowseCategory: (category: string) => void;
  browseCategoryTemplates: ShoppingTemplate[];
};

export function ListComposerSection({
  t,
  isShoppingList,
  newTaskTitle,
  newTaskError,
  onChangeNewTaskTitle,
  onSubmit,
  composerCategory,
  composerQuantity,
  composerUnit,
  composerNote,
  composerDueDate,
  composerRecurrenceType,
  composerRecurrenceInterval,
  composerRecurrenceUnit,
  onChangeComposerCategory,
  onChangeComposerQuantity,
  onChangeComposerUnit,
  onChangeComposerNote,
  onChangeComposerDueDate,
  onChangeComposerRecurrenceType,
  onChangeComposerRecurrenceInterval,
  onChangeComposerRecurrenceUnit,
  showComposerDetails,
  onToggleComposerDetails,
  showShoppingDetails,
  showShoppingFavorites,
  showShoppingHistory,
  showShoppingCategories,
  onToggleShoppingDetails,
  onToggleShoppingFavorites,
  onToggleShoppingHistory,
  onToggleShoppingCategories,
  customCategoryName,
  onChangeCustomCategoryName,
  onAddCustomCategory,
  allShoppingCategoryNames,
  shoppingSuggestions,
  shoppingFavorites,
  shoppingHistory,
  onApplyShoppingTemplate,
  onCreateFromShoppingTemplate,
  selectedBrowseCategory,
  onToggleBrowseCategory,
  browseCategoryTemplates,
}: ComposerSectionProps) {
  return (
    <View style={styles.composerCard}>
      <Text style={styles.sectionTitle}>
        {isShoppingList ? t('details_new_item') : t('details_new_task')}
      </Text>
      <TextInput
        value={newTaskTitle}
        onChangeText={onChangeNewTaskTitle}
        placeholder={isShoppingList ? 'Np. Chleb, mleko, jajka' : 'Dodaj glowny task'}
        placeholderTextColor={ui.colors.textSoft}
        style={styles.input}
        maxLength={120}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      <Text style={styles.inputHint}>
        {newTaskError ??
          (isShoppingList
            ? 'Wpisz wiele produktow naraz, oddzielajac je przecinkiem albo nowa linia.'
            : 'Tworz glowny task i potem rozwijaj go subtaskami.')}
      </Text>

      {isShoppingList && shoppingSuggestions.length > 0 ? (
        <View style={styles.shoppingSupportSection}>
          <Text style={styles.supportTitle}>Podpowiedzi</Text>
          <View style={styles.supportGrid}>
            {shoppingSuggestions.map((template, index) => (
              <Pressable
                key={`${buildTemplateKey(template)}-${index}`}
                onPress={() => onApplyShoppingTemplate(template)}
                style={styles.supportCard}
              >
                <Text style={styles.supportCardTitle}>{template.title}</Text>
                <Text style={styles.supportCardMeta}>
                  {[template.category, template.quantity, template.unit].filter(Boolean).join(' • ') || 'Dopelnij i dodaj'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {isShoppingList ? (
        <>
          <View style={styles.toolbarRow}>
            <PrimaryButton
              label={showShoppingDetails ? 'Ukryj szczegoly' : 'Szczegoly produktu'}
              tone="muted"
              onPress={onToggleShoppingDetails}
            />
            <PrimaryButton
              label={showShoppingFavorites ? 'Ukryj ulubione' : 'Ulubione'}
              tone="muted"
              onPress={onToggleShoppingFavorites}
            />
            <PrimaryButton
              label={showShoppingHistory ? 'Ukryj historie' : 'Historia'}
              tone="muted"
              onPress={onToggleShoppingHistory}
            />
            <PrimaryButton
              label={showShoppingCategories ? 'Ukryj kategorie' : 'Kategorie'}
              tone="muted"
              onPress={onToggleShoppingCategories}
            />
          </View>

          {showShoppingDetails ? (
            <View style={styles.detailsEditor}>
              <View style={styles.scheduleRow}>
                <TextInput
                  value={composerQuantity}
                  onChangeText={onChangeComposerQuantity}
                  style={[styles.input, styles.shoppingMetaInput]}
                  placeholder="Ilosc"
                  placeholderTextColor={ui.colors.textSoft}
                />
                <TextInput
                  value={composerUnit}
                  onChangeText={onChangeComposerUnit}
                  style={[styles.input, styles.shoppingMetaInput]}
                  placeholder="Jednostka"
                  placeholderTextColor={ui.colors.textSoft}
                />
              </View>
              <View style={styles.scheduleRow}>
                {shoppingQuickUnits.map((unit) => (
                  <PrimaryButton
                    key={`composer-unit-${unit}`}
                    label={unit}
                    tone={composerUnit === unit ? 'primary' : 'muted'}
                    onPress={() => onChangeComposerUnit(composerUnit === unit ? '' : unit)}
                  />
                ))}
              </View>
              <View style={styles.scheduleRow}>
                {allShoppingCategoryNames.map((category) => (
                  <PrimaryButton
                    key={`composer-category-${category}`}
                    label={category}
                    tone={composerCategory === category ? 'primary' : 'muted'}
                    onPress={() => onChangeComposerCategory(composerCategory === category ? '' : category)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {showShoppingCategories ? (
            <View style={styles.shoppingSupportSection}>
              <Text style={styles.supportTitle}>Kategorie i katalog</Text>
              <View style={styles.scheduleRow}>
                {allShoppingCategoryNames.map((category) => (
                  <PrimaryButton
                    key={`browse-${category}`}
                    label={category}
                    tone={selectedBrowseCategory === category ? 'primary' : 'muted'}
                    onPress={() => onToggleBrowseCategory(category)}
                  />
                ))}
              </View>
              <View style={styles.scheduleRow}>
                <TextInput
                  value={customCategoryName}
                  onChangeText={onChangeCustomCategoryName}
                  style={[styles.input, styles.shoppingMetaInput]}
                  placeholder="Nowa kategoria"
                  placeholderTextColor={ui.colors.textSoft}
                />
                <PrimaryButton
                  label="Dodaj kategorie"
                  tone="muted"
                  onPress={onAddCustomCategory}
                  disabled={!customCategoryName.trim()}
                />
              </View>
              {selectedBrowseCategory ? (
                <View style={styles.supportGrid}>
                  {browseCategoryTemplates.length > 0 ? (
                    browseCategoryTemplates.map((template, index) => (
                      <Pressable
                        key={`${buildTemplateKey(template)}-browse-${index}`}
                        onPress={() => onCreateFromShoppingTemplate(template)}
                        style={styles.supportCard}
                      >
                        <Text style={styles.supportCardTitle}>{template.title}</Text>
                        <Text style={styles.supportCardMeta}>
                          {[template.quantity, template.unit].filter(Boolean).join(' ') || selectedBrowseCategory}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text style={styles.inputHintInline}>Brak zapisanych produktow w tej kategorii.</Text>
                  )}
                </View>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}

      <PrimaryButton
        label={isShoppingList ? t('details_add_product') : t('details_add_task')}
        leadingIcon="+"
        disabled={!newTaskTitle.trim()}
        onPress={onSubmit}
      />

      {!isShoppingList ? (
        <>
          <PrimaryButton
            label={showComposerDetails ? 'Ukryj szczegoly zadania' : 'Dodaj note i termin'}
            tone="muted"
            onPress={onToggleComposerDetails}
          />
          {showComposerDetails ? (
            <View style={styles.detailsEditor}>
              <TextInput
                value={composerNote}
                onChangeText={onChangeComposerNote}
                style={[styles.input, styles.noteInput]}
                placeholder="Notatka do zadania"
                placeholderTextColor={ui.colors.textSoft}
                multiline
                textAlignVertical="top"
              />
              <TextInput
                value={composerDueDate}
                onChangeText={onChangeComposerDueDate}
                style={styles.input}
                placeholder="Termin YYYY-MM-DD"
                placeholderTextColor={ui.colors.textSoft}
                autoCapitalize="none"
              />
              <View style={styles.scheduleRow}>
                <PrimaryButton
                  label="Dzisiaj"
                  tone={composerDueDate === todayKey() ? 'primary' : 'muted'}
                  onPress={() => onChangeComposerDueDate(todayKey())}
                />
                <PrimaryButton
                  label="Jutro"
                  tone={composerDueDate === dateKeyWithOffset(1) ? 'primary' : 'muted'}
                  onPress={() => onChangeComposerDueDate(dateKeyWithOffset(1))}
                />
                <PrimaryButton
                  label="Bez daty"
                  tone={!composerDueDate ? 'primary' : 'muted'}
                  onPress={() => onChangeComposerDueDate('')}
                />
              </View>
              <View style={styles.scheduleRow}>
                {recurrenceOptions.map((option) => (
                  <PrimaryButton
                    key={`composer-${option}`}
                    label={recurrenceLabels[option]}
                    tone={composerRecurrenceType === option ? 'primary' : 'muted'}
                    onPress={() => onChangeComposerRecurrenceType(option)}
                  />
                ))}
              </View>
              {composerRecurrenceType === 'custom' ? (
                <View style={styles.scheduleRow}>
                  <TextInput
                    value={composerRecurrenceInterval}
                    onChangeText={onChangeComposerRecurrenceInterval}
                    style={[styles.input, styles.intervalInput]}
                    placeholder="Interwal"
                    placeholderTextColor={ui.colors.textSoft}
                    keyboardType="number-pad"
                  />
                  {(['days', 'weeks', 'months'] as const).map((unit) => (
                    <PrimaryButton
                      key={`composer-${unit}`}
                      label={unit === 'days' ? 'Dni' : unit === 'weeks' ? 'Tygodnie' : 'Miesiace'}
                      tone={composerRecurrenceUnit === unit ? 'primary' : 'muted'}
                      onPress={() => onChangeComposerRecurrenceUnit(unit)}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}

      {isShoppingList && showShoppingFavorites && shoppingFavorites.length > 0 ? (
        <View style={styles.shoppingSupportSection}>
          <Text style={styles.supportTitle}>Ulubione produkty</Text>
          <View style={styles.supportGrid}>
            {shoppingFavorites.slice(0, 8).map((favorite) => (
              <Pressable
                key={favorite.id}
                onPress={() => onApplyShoppingTemplate(favorite)}
                style={styles.supportCard}
              >
                <Text style={styles.supportCardTitle}>{favorite.title}</Text>
                <Text style={styles.supportCardMeta}>
                  {[favorite.category, favorite.quantity, favorite.unit].filter(Boolean).join(' • ') || 'Szybkie dodanie'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {isShoppingList && showShoppingHistory && shoppingHistory.length > 0 ? (
        <View style={styles.shoppingSupportSection}>
          <Text style={styles.supportTitle}>Dodaj z historii</Text>
          <View style={styles.supportGrid}>
            {shoppingHistory.slice(0, 10).map((entry, index) => (
              <Pressable
                key={`${entry.title}-${entry.category ?? 'none'}-${index}`}
                onPress={() => onApplyShoppingTemplate(entry)}
                style={styles.supportCard}
              >
                <Text style={styles.supportCardTitle}>{entry.title}</Text>
                <Text style={styles.supportCardMeta}>
                  {[entry.category, entry.quantity, entry.unit].filter(Boolean).join(' • ') || 'Historia'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
