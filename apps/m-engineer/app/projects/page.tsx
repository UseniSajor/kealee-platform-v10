"use client";

import Link from "next/link";
import { useState } from "react";

const projects = [
  {
    id: "proj-001",
    name: "Modern Kitchen Addition",
    service: "Structural Engineering",
    status: "In Progress",
    progress: 65,
    engineer: "John Smith, PE",
    startDate: "Jan 15, 2024",
    dueDate: "Jan 28, 2024",
    amount: "$4,500",
  },
  {
    id: "proj-002",
    name: "Backyard ADU",
    service: "Full MEP + Structural",
    status: "Under Review",
    progress: 90,
    engineer: "Sarah Chen, PE",
    startDate: "Jan 10, 2024",
    dueDate: "Jan 25, 2024",
    amount: "$8,200",
  },
  {
    id: "proj-003",
    name: "Commercial Buildout",
    service: "MEP Engineering",
    status: "Completed",
    progress: 100,
    engineer: "Mike Johnson, PE",
    startDate: "Dec 20, 2023",
    dueDate: "Jan 8, 2024",
    amount: "$12,000",
  },
  {
    id: "proj-004",
    name: "Foundation Repair Analysis",
    service: "Structural + Geotechnical",
    status: "Pending Payment",
    progress: 0,
    engineer: "Pending Assignment",
    startDate: "-",
    dueDate: "-",
    amount: "$3,800",
  },
];

export default function ProjectsPage() {
  const [filter, setFilter] = useState("all");

  const filteredProjects = projects.filter((p) => {
    if (filter === "all") return true;
    if (filter === "active") return p.status === "In Progress" || p.status === "Under Review";
    if (filter === "completed") return p.status === "Completed";
    if (filter === "pending") return p.status === "Pending Payment";
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-black text-blue-600">
              Kealee Engineering
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/services" className="text-zinc-600 hover:text-zinc-900">Services</Link>
              <Link href="/pricing" className="text-zinc-600 hover:text-zinc-900">Pricing</Link>
              <Link href="/projects" className="text-blue-600 font-semibold">My Projects</Link>
              <Link href="/quote" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
                New Project
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">My Projects</h1>
            <p className="text-zinc-500">Track your engineering projects and deliverables</p>
          </div>
          <Link
            href="/quote"
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
          >
            + New Project
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Active Projects</div>
            <div className="text-2xl font-black">2</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Completed</div>
            <div className="text-2xl font-black">1</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Pending</div>
            <div className="text-2xl font-black">1</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Total Spent</div>
            <div className="text-2xl font-black">$28,500</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "all", label: "All Projects" },
            { id: "active", label: "Active" },
            { id: "completed", label: "Completed" },
            { id: "pending", label: "Pending" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                filter === f.id
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Project List */}
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-zinc-400">{project.id}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      project.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                      project.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                      project.status === "Under Review" ? "bg-amber-100 text-amber-700" :
                      "bg-zinc-100 text-zinc-600"
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold">{project.name}</h2>
                  <p className="text-zinc-500">{project.service}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-blue-600">{project.amount}</div>
                  <div className="text-sm text-zinc-500">Project Value</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-zinc-400">Engineer</div>
                  <div className="font-medium">{project.engineer}</div>
                </div>
                <div>
                  <div className="text-zinc-400">Start Date</div>
                  <div className="font-medium">{project.startDate}</div>
                </div>
                <div>
                  <div className="text-zinc-400">Due Date</div>
                  <div className="font-medium">{project.dueDate}</div>
                </div>
                <div>
                  <div className="text-zinc-400">Progress</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Link
                  href={`/projects/${project.id}`}
                  className="px-4 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50"
                >
                  View Details
                </Link>
                {project.status === "Completed" && (
                  <button className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg">
                    Download Drawings
                  </button>
                )}
                {project.status === "Pending Payment" && (
                  <button className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Complete Payment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
