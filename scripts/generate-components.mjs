#!/usr/bin/env node
/**
 * STEP 2: Generate Component Library
 * Creates React components from design system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const componentsDir = path.join(projectRoot, 'packages/ui/src/components');

console.log('\n🧩 STEP 2: Component Library Generation\n');

// Ensure components directory exists
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

// Generate components
const components = [
  { name: 'Button', variants: ['Primary', 'Secondary', 'Tertiary', 'Icon', 'Ghost'] },
  { name: 'Input', variants: ['Text', 'Textarea', 'Select', 'Checkbox', 'Radio', 'Search'] },
  { name: 'Card', variants: ['Default', 'Project', 'Interactive'] },
  { name: 'Modal', variants: ['Default', 'Alert', 'Confirmation'] },
  { name: 'Badge', variants: ['Default', 'Pill', 'Outline'] },
];

components.forEach(comp => {
  generateComponent(comp.name, comp.variants);
  console.log(`✅ Generated ${comp.name} component (${comp.variants.length} variants)`);
});

// Generate component index
generateComponentIndex();
console.log('✅ Generated components index');

// Generate component types
generateComponentTypes();
console.log('✅ Generated component types');

console.log('\n✨ Component Library Generated!');
console.log(`📁 ${components.length} components created in packages/ui/src/components/`);

function generateComponent(name, variants) {
  const filename = name.toLowerCase();
  const filepath = path.join(componentsDir, `${filename}.tsx`);

  const variantTypes = variants.map(v => `'${v.toLowerCase()}'`).join(' | ');

  const content = `import React from 'react';
import { cn } from '@/lib/utils';

export interface ${name}Props extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ${variantTypes};
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const ${name} = React.forwardRef<HTMLDivElement, ${name}Props>(
  ({ className, variant = 'default', size = 'md', disabled, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          '${filename} component',
          \`variant-\\\${variant}\`,
          \`size-\\\${size}\`,
          disabled && 'disabled',
          className
        )}
        {...props}
      />
    );
  }
);

${name}.displayName = '${name}';

export default ${name};
`;

  fs.writeFileSync(filepath, content);
}

function generateComponentIndex() {
  const components = [
    'Button', 'Input', 'Card', 'Modal', 'Badge'
  ];

  const indexPath = path.join(componentsDir, 'index.ts');
  const indexContent = components.map(comp => `export { default as ${comp} } from './${comp.toLowerCase()}';`).join('\n');

  fs.writeFileSync(indexPath, indexContent + '\n');
}

function generateComponentTypes() {
  const typesPath = path.join(componentsDir, 'types.ts');

  const content = `// Component type definitions
// Auto-generated from component generation

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'icon' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type InputVariant = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'search';
export type InputSize = 'sm' | 'md' | 'lg';

export type CardVariant = 'default' | 'project' | 'interactive';

export type BadgeVariant = 'default' | 'pill' | 'outline';
export type BadgeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}
`;

  fs.writeFileSync(typesPath, content);
}
