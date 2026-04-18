import { useEffect, useState } from 'react';

import { usePreferences } from '../../app/providers/PreferencesProvider';

export function useSettingsController() {
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

  useEffect(() => {
    setBackground(customColors.background);
    setPanel(customColors.panel);
    setPrimary(customColors.primary);
  }, [customColors.background, customColors.panel, customColors.primary]);

  return {
    language,
    themeId,
    customColors,
    showCompleted,
    startTab,
    shoppingSortMode,
    shoppingGroupMode,
    background,
    panel,
    primary,
    setBackground,
    setPanel,
    setPrimary,
    setLanguage,
    setTheme,
    setCustomColors,
    setShowCompleted,
    setStartTab,
    setShoppingSortMode,
    setShoppingGroupMode,
  };
}
