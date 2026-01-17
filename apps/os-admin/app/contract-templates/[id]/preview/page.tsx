'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '../../../../lib/api'

export default function ContractTemplatePreviewPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const [projectId, setProjectId] = useState('')
  const [variableOverrides, setVariableOverrides] = useState<Record<string, string>>({})

  const loadPreview = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.previewContractTemplate(params.id, projectId ? { projectId, variables: variableOverrides } : { variables: variableOverrides })
      setPreview(res.preview)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load preview')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPreview()
  }, [params.id])

  const handleVariableChange = (key: string, value: string) => {
    setVariableOverrides((prev) => ({ ...prev, [key]: value }))
  }

  const handlePreview = () => {
    loadPreview()
  }

  if (loading && !preview) {
    return (
      <main style={{ padding: 24 }}>
        <div>Loading preview...</div>
      </main>
    )
  }

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href={`/contract-templates/${params.id}`} style={{ textDecoration: 'underline' }}>
          ← Back to template
        </Link>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Template Preview</h1>
      <p style={{ color: '#52525b', marginBottom: 24 }}>
        Preview template with variable substitution. Optionally provide a project ID for auto-population.
      </p>

      {error ? (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#991b1b',
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }} htmlFor="projectId">
              Project ID (optional)
            </label>
            <input
              id="projectId"
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="UUID"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </div>

          {preview?.availableVariables && preview.availableVariables.length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Variable Overrides</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {preview.availableVariables.map((v: any) => {
                  const key = typeof v === 'string' ? v : v.key
                  const label = typeof v === 'string' ? v : v.label || v.key
                  return (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }} htmlFor={`var-${key}`}>
                        {label}
                      </label>
                      <input
                        id={`var-${key}`}
                        type="text"
                        value={variableOverrides[key] || preview.variables?.[key] || ''}
                        onChange={(e) => handleVariableChange(key, e.target.value)}
                        placeholder={preview.variables?.[key] || ''}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handlePreview}
            style={{
              width: '100%',
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Refresh Preview
          </button>
        </div>

        <div>
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 24,
              backgroundColor: 'white',
              minHeight: 400,
            }}
          >
            {preview ? (
              <div dangerouslySetInnerHTML={{ __html: preview.preview }} />
            ) : (
              <div style={{ color: '#6b7280' }}>No preview available</div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
