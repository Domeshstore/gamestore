/**
 * Ant Design Token — Warm Dark Theme
 * Based on oklch color system
 * Primary: amber/gold  oklch(0.92 0.06 67.02)
 * Background: warm dark brown oklch(0.20 0.00 17.53)
 */
import type { ThemeConfig } from 'antd';

export const COLORS = {
  bg:       '#2a2118',   // oklch(0.20 0.00 17.53) hex approx
  card:     '#362c22',   // oklch(0.27 0.01 17.95)
  card2:    '#3d3128',   // oklch(0.30 0.01 17.95)
  border:   '#4a3c2e',   // oklch(0.32 0.02 34.90)
  amber:    '#f0c060',   // oklch(0.92 0.06 67.02) — primary
  amber2:   '#d4903a',   // oklch(0.78 0.12 62.00)
  muted:    '#8a7a6a',   // oklch(0.65 0.01 17.53)
  text:     '#f0ece8',   // oklch(0.95 0 0)
  textDim:  '#a89880',   // oklch(0.70 0.01 17.53)
  success:  '#4ade80',
  warning:  '#fbbf24',
  error:    '#f87171',
  info:     '#60a5fa',
};

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary:         '#f0c060',
    colorSuccess:         '#4ade80',
    colorWarning:         '#fbbf24',
    colorError:           '#f87171',
    colorInfo:            '#60a5fa',

    colorBgBase:          '#2a2118',
    colorBgContainer:     '#362c22',
    colorBgElevated:      '#3d3128',
    colorBgLayout:        '#2a2118',
    colorBgSpotlight:     '#3d3128',
    colorBgMask:          'rgba(10,8,5,0.75)',

    colorText:            '#f0ece8',
    colorTextSecondary:   '#a89880',
    colorTextTertiary:    '#7a6a5a',
    colorTextQuaternary:  '#5a4a3a',
    colorTextDisabled:    '#4a3a2a',

    colorBorder:          '#4a3c2e',
    colorBorderSecondary: '#3d3128',
    colorSplit:           '#3d3128',

    colorFill:            'rgba(240,192,96,0.06)',
    colorFillSecondary:   'rgba(240,192,96,0.04)',
    colorFillTertiary:    'rgba(240,192,96,0.02)',

    fontFamily:           "'Inter','Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
    fontSize:             14,
    fontSizeLG:           16,
    fontSizeHeading2:     28,
    fontSizeHeading3:     22,
    fontWeightStrong:     700,

    borderRadius:         10,
    borderRadiusLG:       14,
    borderRadiusSM:       7,

    boxShadow:            '0 4px 24px rgba(10,8,5,0.45)',
    boxShadowSecondary:   '0 2px 12px rgba(10,8,5,0.30)',

    motionDurationMid:    '0.18s',
    motionDurationSlow:   '0.28s',
  },
  components: {
    Button: {
      colorPrimary:       '#f0c060',
      colorPrimaryHover:  '#d4903a',
      colorPrimaryActive: '#b87030',
      primaryShadow:      '0 4px 16px rgba(240,192,96,0.35)',
      borderRadius:       10,
      controlHeight:      38,
      controlHeightLG:    46,
      fontWeight:         700,
    },
    Card: {
      colorBgContainer:   '#362c22',
      borderRadius:       16,
      paddingLG:          20,
    },
    Table: {
      colorBgContainer:   '#362c22',
      headerBg:           '#2e2418',
      rowHoverBg:         'rgba(240,192,96,0.05)',
      borderColor:        '#3d3128',
      headerColor:        '#8a7a6a',
      borderRadius:       14,
    },
    Input: {
      colorBgContainer:   '#2e2418',
      colorBorder:        '#4a3c2e',
      activeBorderColor:  '#f0c060',
      hoverBorderColor:   'rgba(240,192,96,0.5)',
      activeShadow:       '0 0 0 2px rgba(240,192,96,0.15)',
      borderRadius:       10,
      controlHeight:      42,
    },
    Select: {
      colorBgContainer:   '#2e2418',
      colorBorder:        '#4a3c2e',
      optionSelectedBg:   'rgba(240,192,96,0.12)',
      borderRadius:       10,
    },
    Modal: {
      contentBg:          '#362c22',
      headerBg:           '#362c22',
      borderRadius:       18,
    },
    Menu: {
  // ✅ New v6 tokens
  itemColor:           '#8a7a6a',           // replaces colorItemText
  itemSelectedColor:   '#f0c060',           // replaces colorItemTextSelected
  itemHoverColor:      '#f0ece8',           // replaces colorItemTextHover
  itemBg:              'transparent',       // replaces colorItemBg
  itemSelectedBg:      'rgba(240,192,96,0.12)', // replaces colorItemBgSelected
  itemHoverBg:         'rgba(240,192,96,0.07)', // replaces colorItemBgHover
  
  // ✅ These tokens are still valid
  borderRadius:        10,
  itemBorderRadius:    10,
  
  // ✅ Additional v6 tokens you can use
  activeBarBorderWidth: 0,                  // Remove the active bar indicator
  activeBarHeight:      0,                  // Or customize it
  collapsedWidth:       80,
  groupTitleColor:      '#6a5a4a',
  iconMarginInlineEnd:  12,
  iconSize:             16,
  itemHeight:           44,
  itemMarginBlock:      4,
  itemMarginInline:     8,
  subMenuItemBg:        'transparent',
},
    Layout: {
      siderBg:            '#221c14',
      headerBg:           'rgba(34,28,20,0.85)',
      bodyBg:             '#2a2118',
    },
    Tag: {
      borderRadius:       99,
      fontWeightStrong:   700,
    },
    Segmented: {
      itemSelectedBg:     '#3d3128',
      itemSelectedColor:  '#f0ece8',
      trackBg:            '#2e2418',
    },
    Statistic: {
      contentFontSize:    30,
    },
    Progress: {
      colorInfo:          '#f0c060',
    },
    Alert: {
      borderRadius:       12,
    },
    Badge: {
      colorBgContainer:   '#f0c060',
      colorText:          '#1a1208',
    },
    Switch: {
      colorPrimary:       '#f0c060',
      colorPrimaryHover:  '#d4903a',
    },
    Tabs: {
      inkBarColor:        '#f0c060',
      itemColor:          '#8a7a6a',
      itemSelectedColor:  '#f0c060',
      itemHoverColor:     '#f0ece8',
    },
  },
};
