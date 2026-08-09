// Auto-generated type exports from design tokens
// DO NOT EDIT MANUALLY

export type ColorKey =
  | 'primary'
  | 'orange'
  | 'green'
  | 'yellow'
  | 'red'
  | 'gray';

export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export type FontSize =
  | 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';

export type FontWeight =
  | 'normal' | 'medium' | 'semibold' | 'bold';

export type Spacing =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;

export type ZIndex = keyof typeof zIndexValues;

const zIndexValues = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

export { zIndexValues };
