// Figma Plugin: Kealee Design System Manager
// code.js - Main plugin logic

const DESIGN_TOKENS = {
  colors: {
    primary: {
      50: { r: 0.9375, g: 0.9647, b: 1.0 },
      100: { r: 0.8588, g: 0.9216, b: 1.0 },
      200: { r: 0.749, g: 0.8588, b: 1.0 },
      300: { r: 0.5765, g: 0.7725, b: 1.0 },
      400: { r: 0.3765, g: 0.6471, b: 1.0 },
      500: { r: 0.2353, g: 0.5137, b: 0.9686 },
      600: { r: 0.1451, g: 0.3922, b: 0.9333 },
      700: { r: 0.1137, g: 0.3098, b: 0.8471 },
      800: { r: 0.1176, g: 0.2510, b: 0.6863 },
      900: { r: 0.1176, g: 0.2275, b: 0.5412 },
    },
    secondary: {
      50: { r: 1.0, g: 0.9686, b: 0.9294 },
      100: { r: 1.0, g: 0.9294, b: 0.8353 },
      200: { r: 1.0, g: 0.8431, b: 0.6667 },
      300: { r: 0.9922, g: 0.7294, b: 0.4549 },
      400: { r: 0.9843, g: 0.5725, b: 0.2353 },
      500: { r: 0.9765, g: 0.4510, b: 0.0941 },
      600: { r: 0.9176, g: 0.3451, b: 0.0471 },
      700: { r: 0.7608, g: 0.2549, b: 0.0471 },
    },
  },
};

// Generate color styles
async function generateColorStyles() {
  const page = figma.currentPage;
  const colors = DESIGN_TOKENS.colors;
  
  let yOffset = 0;
  
  // Create Primary Color Section
  Object.entries(colors.primary).forEach(([shade, color]) => {
    const rect = figma.createRectangle();
    rect.x = 0;
    rect.y = yOffset;
    rect.width = 100;
    rect.height = 40;
    rect.fills = [{ type: 'SOLID', color: color }];
    rect.name = `Primary-${shade}`;
    
    const text = figma.createText();
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    text.characters = `Primary-${shade}`;
    text.fontSize = 12;
    text.x = 110;
    text.y = yOffset + 10;
    text.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
    
    page.appendChild(rect);
    page.appendChild(text);
    yOffset += 50;
  });
}

// Create button components with states
async function generateButtonComponents() {
  const page = figma.currentPage;
  const componentSet = figma.createComponentSet();
  componentSet.name = 'Button/Primary';
  
  // Default state
  const defaultBtn = figma.createComponent();
  defaultBtn.name = 'Default';
  defaultBtn.width = 140;
  defaultBtn.height = 44;
  defaultBtn.fills = [{ type: 'SOLID', color: DESIGN_TOKENS.colors.primary[600] }];
  defaultBtn.cornerRadius = 8;
  defaultBtn.strokeWeight = 0;
  
  // Add text
  const text = figma.createText();
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  text.characters = 'Button';
  text.fontSize = 16;
  text.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  
  defaultBtn.appendChild(text);
  componentSet.appendChild(defaultBtn);
  
  page.appendChild(componentSet);
}

// Create form input component
async function generateInputComponent() {
  const page = figma.currentPage;
  const input = figma.createComponent();
  input.name = 'Input/Text';
  input.width = 320;
  input.height = 44;
  input.cornerRadius = 6;
  input.strokeWeight = 1;
  input.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
  input.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  
  page.appendChild(input);
}

// Create card component
async function generateCardComponent() {
  const page = figma.currentPage;
  const card = figma.createComponent();
  card.name = 'Card/Default';
  card.width = 300;
  card.height = 200;
  card.cornerRadius = 6;
  card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  card.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
  card.strokeWeight = 1;
  card.shadows = [{
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: 0.1 },
    offset: { x: 0, y: 4 },
    blur: 6,
    spread: -1,
  }];
  
  page.appendChild(card);
}

// Apply design tokens
async function applyDesignTokens() {
  try {
    await generateColorStyles();
    await generateButtonComponents();
    await generateInputComponent();
    await generateCardComponent();
    figma.ui.postMessage({ type: 'success', message: 'Design tokens applied successfully!' });
  } catch (error) {
    figma.ui.postMessage({ type: 'error', message: error.message });
  }
}

// Message handling
figma.ui.onmessage = (msg) => {
  if (msg.type === 'apply-tokens') {
    applyDesignTokens();
  }
};

figma.showUI(__html__, { width: 400, height: 500 });
