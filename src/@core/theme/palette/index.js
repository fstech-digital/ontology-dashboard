// Theme-config-driven palette
// Reads from theme.config.json directly (client-safe, no fs)
// Default: Zed One Dark theme

import themeConfig from '../../../../theme.config.json'

const DefaultPalette = () => {
  const t = themeConfig
  const mainColor = '220, 224, 229'

  return {
    customColors: {
      dark: '220, 224, 229',
      main: mainColor,
      light: '169, 175, 188',
      bodyBg: t.backgrounds.body,
      trackBg: t.backgrounds.paper,
      avatarBg: t.backgrounds.hover,
      tableHeaderBg: t.backgrounds.tableHeader
    },
    mode: 'dark',
    common: {
      black: '#000',
      white: '#FFF'
    },
    primary: t.colors.primary,
    secondary: t.colors.secondary,
    error: t.colors.error,
    warning: t.colors.warning,
    info: t.colors.info,
    success: t.colors.success,
    grey: {
      50: t.grey['50'],
      100: t.grey['100'],
      200: t.grey['200'],
      300: t.grey['300'],
      400: t.grey['400'],
      500: t.grey['500'],
      600: t.grey['600'],
      700: t.grey['700'],
      800: t.grey['800'],
      900: t.grey['900'],
      A100: t.grey['100'],
      A200: t.grey['200'],
      A400: t.grey['400'],
      A700: t.grey['600']
    },
    text: t.text,
    divider: t.divider,
    background: {
      paper: t.backgrounds.paper,
      default: t.backgrounds.body
    },
    action: {
      active: t.action.active,
      hover: t.action.hover,
      selected: t.action.selected,
      selectedOpacity: 0.12,
      disabled: t.action.disabled,
      disabledBackground: t.action.hover,
      focus: t.action.focus
    }
  }
}

export default DefaultPalette
