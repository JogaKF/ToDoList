export type ThemeColors = {
  background: string;
  backgroundTop: string;
  panel: string;
  panelStrong: string;
  panelSoft: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSoft: string;
  primary: string;
  primaryStrong: string;
  accent: string;
  danger: string;
  warning: string;
  input: string;
  white: string;
  shadow: string;
};

export type ThemeId = 'cyber' | 'aurora' | 'ember' | 'glacier' | 'grove' | 'custom';

export const themePresets: Record<Exclude<ThemeId, 'custom'>, ThemeColors> = {
  cyber: {
    background: '#07111F',
    backgroundTop: '#0D1B30',
    panel: '#0F2137',
    panelStrong: '#142B45',
    panelSoft: '#10263F',
    border: '#21486A',
    borderStrong: '#3AA0C8',
    text: '#F3F7FB',
    textMuted: '#9EB5C7',
    textSoft: '#7D98AE',
    primary: '#1499C8',
    primaryStrong: '#0F7CA4',
    accent: '#8BFFB7',
    danger: '#FF6C8C',
    warning: '#FFB86B',
    input: '#0B1C2E',
    white: '#FFFFFF',
    shadow: '#02060D',
  },
  aurora: {
    background: '#06131A',
    backgroundTop: '#10292A',
    panel: '#11282D',
    panelStrong: '#17343B',
    panelSoft: '#143039',
    border: '#2B6A72',
    borderStrong: '#6EE7D7',
    text: '#F2FCFB',
    textMuted: '#A2C9C6',
    textSoft: '#79A5A1',
    primary: '#3BD6C6',
    primaryStrong: '#1FA79A',
    accent: '#D3FF8A',
    danger: '#FF7A93',
    warning: '#FFC172',
    input: '#0B1E24',
    white: '#FFFFFF',
    shadow: '#020A0D',
  },
  ember: {
    background: '#170B12',
    backgroundTop: '#26121D',
    panel: '#291622',
    panelStrong: '#341C2A',
    panelSoft: '#301928',
    border: '#6F3145',
    borderStrong: '#FF8C69',
    text: '#FFF5F8',
    textMuted: '#D2AAB5',
    textSoft: '#AE8693',
    primary: '#FF7B54',
    primaryStrong: '#D95C39',
    accent: '#FFD37A',
    danger: '#FF6C8C',
    warning: '#FFB86B',
    input: '#210F18',
    white: '#FFFFFF',
    shadow: '#090306',
  },
  glacier: {
    background: '#08141F',
    backgroundTop: '#10273B',
    panel: '#122538',
    panelStrong: '#183149',
    panelSoft: '#163047',
    border: '#35668E',
    borderStrong: '#7EC8FF',
    text: '#F5FBFF',
    textMuted: '#B0C8DC',
    textSoft: '#88A5BC',
    primary: '#5FB7FF',
    primaryStrong: '#3C8ED0',
    accent: '#B8FFF3',
    danger: '#FF7998',
    warning: '#FFD27A',
    input: '#0D2031',
    white: '#FFFFFF',
    shadow: '#03080D',
  },
  grove: {
    background: '#0B1711',
    backgroundTop: '#14261B',
    panel: '#14281D',
    panelStrong: '#1B3426',
    panelSoft: '#173123',
    border: '#326248',
    borderStrong: '#81D39F',
    text: '#F6FFF8',
    textMuted: '#B4D0BD',
    textSoft: '#8EAF99',
    primary: '#65C987',
    primaryStrong: '#429E63',
    accent: '#FFE58A',
    danger: '#FF7E96',
    warning: '#F5C06B',
    input: '#102218',
    white: '#FFFFFF',
    shadow: '#030805',
  },
};

export const ui = {
  colors: { ...themePresets.cyber },
  radius: {
    sm: 14,
    md: 20,
    lg: 28,
    pill: 999,
  },
};

export function applyTheme(colors: ThemeColors) {
  Object.assign(ui.colors, colors);
}

export function buildCustomTheme(overrides: Partial<Pick<ThemeColors, 'background' | 'panel' | 'primary'>>) {
  const base = themePresets.cyber;

  return {
    ...base,
    background: overrides.background || base.background,
    backgroundTop: overrides.background || base.backgroundTop,
    panel: overrides.panel || base.panel,
    panelStrong: overrides.panel || base.panelStrong,
    panelSoft: overrides.panel || base.panelSoft,
    input: overrides.panel || base.input,
    border: overrides.primary || base.border,
    borderStrong: overrides.primary || base.borderStrong,
    primary: overrides.primary || base.primary,
    primaryStrong: overrides.primary || base.primaryStrong,
  };
}
