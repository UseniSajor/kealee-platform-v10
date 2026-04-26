"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayout = getLayout;
const LAYOUT_MAP = {
    HOMEOWNER: ['hero', 'concept_packages', 'budget_breakdown', 'timeline', 'pricing_grid', 'case_studies'],
    CONTRACTOR: ['hero', 'case_studies', 'concept_packages', 'budget_breakdown', 'timeline', 'pricing_grid'],
    ARCHITECT: ['hero', 'timeline', 'budget_breakdown', 'case_studies', 'concept_packages', 'pricing_grid'],
    INVESTOR: ['hero', 'pricing_grid', 'budget_breakdown', 'concept_packages', 'timeline', 'case_studies'],
    PROPERTY_MANAGER: ['hero', 'concept_packages', 'pricing_grid', 'budget_breakdown', 'timeline', 'case_studies'],
};
const DEFAULT_LAYOUT = ['hero', 'concept_packages', 'budget_breakdown', 'timeline', 'pricing_grid', 'case_studies'];
function getLayout(userType) {
    return LAYOUT_MAP[userType] || DEFAULT_LAYOUT;
}
