import { Pressable, Text, View } from 'react-native';

import { styles } from './styles';

type ColorPickerProps = {
  label: string;
  options: string[];
  selectedColor: string;
  onSelect: (color: string) => void;
};

export function ColorPickerRow({ label, options, selectedColor, onSelect }: ColorPickerProps) {
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
              style={[styles.swatch, { backgroundColor: color }, isSelected && styles.swatchSelected]}
            >
              {isSelected ? <View style={styles.swatchInner} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
