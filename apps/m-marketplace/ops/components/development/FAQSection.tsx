import { Accordion, AccordionItem } from "@ops/components/ui"

export function FAQSection() {
  const faqs = [
    {
      question: "How does owner's rep work across multiple locations?",
      answer: "We leverage video calls, cloud-based project management tools, and strategic in-person site visits. Most development decisions happen in meetings and document reviews—not on the jobsite daily. We coordinate your project team while providing senior-level oversight without the overhead of full-time staff.",
    },
    {
      question: "What size projects do you work on?",
      answer: "We focus on projects with 10+ units or equivalent complexity across all asset types: multifamily, mixed-use, townhomes, single-family developments, commercial, and industrial. Our minimum engagement typically starts around $1M in total project budget.",
    },
    {
      question: "Do you replace my architect or general contractor?",
      answer: "No. We work alongside your design team and GC as the owner's advocate. We review their work, manage schedules, verify budgets, and ensure everyone is aligned with your goals. Think of us as your senior development manager who protects your interests.",
    },
    {
      question: "What's the difference between Tier 1, 2, and 3?",
      answer: "Tier 1 is a short feasibility study before you commit capital. Tier 2 is full owner's rep services from design through close-out. Tier 3 is for select projects where we take a promote participation in exchange for a reduced retainer—fully aligning our incentives with yours.",
    },
    {
      question: "How do you charge for your services?",
      answer: "Tier 1 is a fixed fee ($7,500–$15,000). Tier 2 is typically a monthly retainer plus milestone fees, scaled to project complexity. Tier 3 includes a reduced retainer with 5–10% of the sponsor promote. We provide clear fee proposals upfront.",
    },
    {
      question: "Can you help with entitlements and permitting?",
      answer: "Yes. We coordinate the entitlement process, manage consultants, interface with planning departments, and track approvals. While we don't provide engineering or legal services directly, we ensure your team stays on schedule and responsive to jurisdiction requirements.",
    },
    {
      question: "What if my project is already under construction?",
      answer: "We can join mid-project. Common scenarios include change order disputes, schedule delays, budget overruns, or GC performance issues. We quickly assess the situation, stabilize the project, and get you back on track.",
    },
    {
      question: "Do you work with family offices and institutional clients?",
      answer: "Absolutely. We work with high-net-worth individuals, family offices, non-profits, and institutional owners who need experienced development oversight but don't want to build an internal team. We act as your outsourced development department.",
    },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <Accordion>
        {faqs.map((faq, index) => (
          <AccordionItem key={index} title={faq.question}>
            {faq.answer}
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
