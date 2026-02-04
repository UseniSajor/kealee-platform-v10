// packages/ui/src/components/marketing/FAQAccordion.tsx
// Accordion component for FAQ sections

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQAccordionProps {
  items: FAQItem[];
  allowMultiple?: boolean;
  className?: string;
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
  items,
  allowMultiple = false,
  className,
}) => {
  const [openIndices, setOpenIndices] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    if (allowMultiple) {
      setOpenIndices((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      setOpenIndices((prev) =>
        prev.includes(index) ? [] : [index]
      );
    }
  };

  const isOpen = (index: number) => openIndices.includes(index);

  return (
    <div className={cn('w-full divide-y divide-gray-200', className)}>
      {items.map((item, index) => (
        <div key={index} className="py-4">
          {/* Question Button */}
          <button
            onClick={() => toggleItem(index)}
            className="w-full flex items-center justify-between text-left group"
          >
            <span
              className="text-base md:text-lg font-semibold text-[#4A90D9] group-hover:text-[#2ABFBF] transition-colors pr-4"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              {item.question}
            </span>
            <motion.span
              animate={{ rotate: isOpen(index) ? 45 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 group-hover:bg-[#2ABFBF]/10 group-hover:text-[#2ABFBF] transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </motion.span>
          </button>

          {/* Answer */}
          <AnimatePresence initial={false}>
            {isOpen(index) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <p className="pt-4 text-gray-600 text-sm md:text-base leading-relaxed">
                  {item.answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default FAQAccordion;
