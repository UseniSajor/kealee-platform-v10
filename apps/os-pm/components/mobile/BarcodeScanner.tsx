"use client"

import * as React from "react"
import { useState } from "react"
import { Scan, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState("")

  const handleScan = () => {
    if (barcodeInput.trim()) {
      onScan(barcodeInput.trim())
      setBarcodeInput("")
      setIsOpen(false)
    }
  }

  const handleCameraScan = async () => {
    // In a real implementation, this would use a barcode scanner library
    // like @zxing/library or react-qr-reader
    // For now, we'll use manual input
    alert("Camera scanning requires additional library setup. Use manual input for now.")
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-50 rounded-full shadow-lg"
      >
        <Scan className="h-4 w-4 mr-2" />
        Scan
      </Button>
    )
  }

  return (
    <Card className="fixed inset-4 z-50 shadow-2xl max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Barcode Scanner</CardTitle>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Enter barcode or scan"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleScan()
              }
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button onClick={handleScan} className="flex-1" disabled={!barcodeInput.trim()}>
              Submit
            </Button>
            <Button onClick={handleCameraScan} variant="outline">
              <Scan className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-neutral-500 text-center">
          Enter barcode manually or use camera to scan
        </p>
      </CardContent>
    </Card>
  )
}

