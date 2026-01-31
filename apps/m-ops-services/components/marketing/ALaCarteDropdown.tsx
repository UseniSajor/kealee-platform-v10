"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import Link from "next/link";

const aLaCarteServices = [
  { name: "Permit Application Assistance", price: "$325", category: "Permits" },
  { name: "Inspection Scheduling", price: "$200", category: "Permits" },
  { name: "Document Organization", price: "$400", category: "Documentation" },
  { name: "Contractor Coordination", price: "$500", category: "Coordination" },
  { name: "Site Visit & Reporting", price: "$350", category: "Field Services" },
  { name: "Budget Analysis", price: "$450", category: "Financial" },
  { name: "Progress Reporting", price: "$250", category: "Documentation" },
  { name: "Quality Control Review", price: "$400", category: "Field Services" },
  { name: "Change Order Management", price: "$475", category: "Coordination" },
  { name: "Schedule Optimization", price: "$1,250", category: "Planning" },
];

const categories = [
  { id: "all", label: "All Services" },
  { id: "Permits", label: "Permits & Inspections" },
  { id: "Documentation", label: "Documentation" },
  { id: "Coordination", label: "Coordination" },
  { id: "Field Services", label: "Field Services" },
  { id: "Financial", label: "Financial" },
  { id: "Planning", label: "Planning" },
];

export function ALaCarteDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const filteredServices = selectedCategory === "all"
    ? aLaCarteServices
    : aLaCarteServices.filter(s => s.category === selectedCategory);

  const toggleService = (name: string) => {
    setSelectedServices(prev =>
      prev.includes(name)
        ? prev.filter(s => s !== name)
        : [...prev, name]
    );
  };

  const totalPrice = selectedServices.reduce((sum, name) => {
    const service = aLaCarteServices.find(s => s.name === name);
    if (!service) return sum;
    return sum + parseInt(service.price.replace(/[$,]/g, ""));
  }, 0);

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black">À La Carte Services</h3>
          <p className="mt-1 text-sm text-zinc-600">
            Select individual services based on your project needs
          </p>
        </div>
        {selectedServices.length > 0 && (
          <div className="text-right">
            <div className="text-sm text-zinc-500">{selectedServices.length} selected</div>
            <div className="text-xl font-black text-[var(--primary)]">${totalPrice.toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${
              selectedCategory === cat.id
                ? "bg-[var(--primary)] text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Dropdown Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mt-4 w-full flex items-center justify-between px-4 py-3 bg-zinc-50 rounded-lg border border-zinc-200 hover:border-zinc-300 transition"
      >
        <span className="text-sm font-medium text-zinc-700">
          {selectedServices.length > 0
            ? `${selectedServices.length} service${selectedServices.length > 1 ? "s" : ""} selected`
            : "Select services..."}
        </span>
        <ChevronDown
          size={18}
          className={`text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="mt-2 border border-zinc-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
          {filteredServices.map((service) => (
            <button
              key={service.name}
              onClick={() => toggleService(service.name)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 border-b border-zinc-100 last:border-0 transition ${
                selectedServices.includes(service.name) ? "bg-emerald-50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                  selectedServices.includes(service.name)
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-zinc-300"
                }`}>
                  {selectedServices.includes(service.name) && (
                    <Check size={14} className="text-white" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-800">{service.name}</div>
                  <div className="text-xs text-zinc-500">{service.category}</div>
                </div>
              </div>
              <span className="text-sm font-bold text-zinc-900">{service.price}</span>
            </button>
          ))}
        </div>
      )}

      {/* Selected Services Summary */}
      {selectedServices.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedServices.map((name) => {
              const service = aLaCarteServices.find(s => s.name === name);
              return (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full"
                >
                  {name}
                  <button
                    onClick={() => toggleService(name)}
                    className="hover:text-emerald-900"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
          <Link
            href={`/signup?services=${encodeURIComponent(selectedServices.join(","))}`}
            className="block w-full text-center py-2.5 bg-[var(--primary)] text-white font-bold rounded-lg hover:opacity-95 transition"
          >
            Get Started with Selected Services
          </Link>
        </div>
      )}
    </div>
  );
}
