"use client"

import { useState } from "react"
import { Header } from "@ops/components/development/Header"
import { Footer } from "@ops/components/development/Footer"
import { IntakeFormModal } from "@ops/components/development/IntakeFormModal"

export default function DevelopmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header onRequestReview={() => setIsIntakeModalOpen(true)} />
      <main className="flex-1">{children}</main>
      <Footer />
      <IntakeFormModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
      />
    </div>
  )
}
