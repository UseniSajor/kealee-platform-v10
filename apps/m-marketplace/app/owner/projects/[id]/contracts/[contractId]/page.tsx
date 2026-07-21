'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Contract } from '@owner/lib/api'

type SignatureStatus = {
  status?: {
    status: string
    statusChangedDateTime?: string
    completedDateTime?: string
    recipients?: {
      signers?: Array<{ name: string; email: string; status?: string }>
    }
  }
  message?: string
}

export default function ContractDetailPage({
  params,
}: {
  params: { id: string; contractId: string }
}) {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contract, setContract] = useState<Contract | null>(null)
  const [signatureStatus, setSignatureStatus] = useState<SignatureStatus | null>(null)
  const [compliance, setCompliance] = useState<{
    isValid: boolean
    errors: string[]
    warnings: string[]
    requiredDisclosures: string[]
    suggestedLanguage: string
    complianceInfo: {
      state: string
      requiredDisclosures: string[]
      statutoryLanguage: string
      minContractAmount?: number
      maxContractAmount?: number
      requiresWitness: boolean
      requiredSigners: string[]
      retentionYears: number
    }
  } | null>(null)
  const [retention, setRetention] = useState<{
    retentionYears: number
    expiresAt: string | null
    shouldRetain: boolean
  } | null>(null)
  const [checkingCompliance, setCheckingCompliance] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [contractRes, statusRes, complianceRes, retentionRes] = await Promise.all([
        api.getContract(params.contractId),
        api.getContractSignatureStatus(params.contractId).catch(() => ({ message: 'Not sent yet' })),
        api.validateContractCompliance(params.contractId).catch(() => null),
        api.checkDocumentRetention(params.contractId).catch(() => null),
      ])
      setContract(contractRes.contract)
      setSignatureStatus(statusRes.status || statusRes)
      if (complianceRes) setCompliance(complianceRes)
      if (retentionRes) setRetention(retentionRes)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load contract')
    } finally {
      setLoading(false)
    }
  }, [params.contractId])

  const handleCheckCompliance = async () => {
    setCheckingCompliance(true)
    setError(null)
    try {
      const validation = await api.validateContractCompliance(params.contractId)
      setCompliance(validation)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to check compliance')
    } finally {
      setCheckingCompliance(false)
    }
  }

  const handleAddStatutoryLanguage = async (autoAppend: boolean = false) => {
    if (!compliance) return
    if (!confirm(`Add statutory language for ${compliance.complianceInfo.state}?${autoAppend ? ' This will automatically update your contract terms.' : ''}`)) {
      return
    }
    try {
      const result = await api.addStatutoryLanguage(params.contractId, autoAppend)
      if (autoAppend) {
        await loadData() // Reload to see updated terms
      } else {
        // Show preview
        setCompliance({ ...compliance, suggestedLanguage: result.terms })
      }
      alert(autoAppend ? 'Statutory language added to contract' : 'Suggested language generated (preview only)')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add statutory language')
    }
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  const handleSendForSignature = async () => {
    if (!confirm('Send this contract for signature? All parties will receive an email notification.')) {
      return
    }

    setSending(true)
    setError(null)

    try {
      const result = await api.sendContractForSignature(params.contractId)
      if (result.recipientViewUrl) {
        // Open embedded signing view
        window.open(result.recipientViewUrl, '_blank')
      }
      alert('Contract sent for signature! Check your email or sign in the embedded view.')
      await loadData() // Reload to get updated status
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send contract for signature')
    } finally {
      setSending(false)
    }
  }

  const handleDownloadSigned = async () => {
    setDownloading(true)
    setError(null)

    try {
      const blob = await api.downloadSignedContract(params.contractId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contract_${params.contractId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to download signed contract')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <div>Loading contract...</div>
      </main>
    )
  }

  if (!contract) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <div className="text-red-600">Contract not found</div>
      </main>
    )
  }

  const isSigned = contract.status === 'SIGNED' || contract.status === 'ACTIVE'
  const isSent = contract.status === 'SENT' || contract.docusignEnvelopeId

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-600">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link className="underline underline-offset-4" href="/">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link className="underline underline-offset-4" href={`/owner/projects/${params.id}`}>
              Project
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link className="underline underline-offset-4" href={`/owner/projects/${params.id}/owner/contracts/new`}>
              Contracts
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-neutral-800">Contract Details</li>
        </ol>
      </nav>

      <header className="mt-4">
        <h1 className="text-2xl font-semibold text-neutral-900">Contract Details</h1>
        <p className="mt-1 text-sm text-neutral-600">View and manage contract signing</p>
      </header>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        {/* Contract Status */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Status</h2>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                contract.status === 'DRAFT'
                  ? 'bg-neutral-100 text-neutral-700'
                  : contract.status === 'SENT'
                    ? 'bg-blue-100 text-blue-700'
                    : contract.status === 'SIGNED'
                      ? 'bg-green-100 text-green-700'
                      : contract.status === 'ACTIVE'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              {contract.status}
            </span>
            {contract.docusignEnvelopeId ? (
              <span className="text-sm text-neutral-600">
                Envelope ID: {contract.docusignEnvelopeId.slice(0, 8)}...
              </span>
            ) : null}
          </div>

          {/* Signature Status Details */}
          {signatureStatus && signatureStatus.status ? (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="text-sm font-medium text-blue-900">Signature Status</h3>
              <p className="mt-1 text-sm text-blue-800">
                Status: <strong>{signatureStatus.status.status}</strong>
              </p>
              {signatureStatus.status.completedDateTime ? (
                <p className="mt-1 text-sm text-blue-800">
                  Completed: {new Date(signatureStatus.status.completedDateTime).toLocaleString()}
                </p>
              ) : null}
              {signatureStatus.status.recipients?.signers ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-blue-900">Signers:</p>
                  {signatureStatus.status.recipients.signers.map((signer, idx) => (
                    <div key={idx} className="text-sm text-blue-800">
                      {signer.name} ({signer.email}) - {signer.status || 'Pending'}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : signatureStatus?.message ? (
            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm text-neutral-600">{signatureStatus.message}</p>
            </div>
          ) : null}
        </section>

        {/* Contract Information */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Contract Information</h2>
          <div className="mt-4 space-y-3">
            <div>
              <span className="text-sm font-medium text-neutral-700">Total Amount:</span>
              <span className="ml-2 text-sm text-neutral-900">
                {contract.totalAmount
                  ? `$${Number(contract.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : 'Not set'}
              </span>
            </div>
            {contract.contractor ? (
              <div>
                <span className="text-sm font-medium text-neutral-700">Contractor:</span>
                <span className="ml-2 text-sm text-neutral-900">
                  {contract.contractor?.name || 'Not assigned'}
                </span>
              </div>
            ) : null}
            {contract.milestones && contract.milestones.length > 0 ? (
              <div>
                <span className="text-sm font-medium text-neutral-700">Milestones:</span>
                <span className="ml-2 text-sm text-neutral-900">{contract.milestones.length} defined</span>
              </div>
            ) : null}
          </div>
        </section>

        {/* Prompt 2.8: Security Testing */}
        <section className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-red-900">Security Testing</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const [access, signature, audit, encryption, gdpr] = await Promise.all([
                      api.testDocumentAccess(contract.id),
                      api.testSignatureFraudPrevention(contract.id),
                      api.testAuditLogCompleteness(contract.id),
                      api.testDataEncryption(contract.id),
                      api.testGDPRCompliance(contract.id),
                    ])
                    alert(
                      `Security Test Results:\n\n` +
                        `Access: ${access.hasAccess ? '✓' : '✗'} ${access.reason}\n` +
                        `Signature Security: ${signature.isValid ? '✓' : '✗'} (Risk: ${signature.riskLevel})\n` +
                        `Audit Logs: ${audit.isComplete ? '✓' : '✗'} (${audit.totalLogs} logs)\n` +
                        `Encryption: ${encryption.encryptionAtRest ? '✓' : '✗'}\n` +
                        `GDPR: ${gdpr.isCompliant ? '✓' : '✗'}\n\n` +
                        `Check console for detailed results.`
                    )
                    console.log('Security Test Results:', { access, signature, audit, encryption, gdpr })
                  } catch (e: unknown) {
                    alert(e instanceof Error ? e.message : 'Failed to run security tests')
                  }
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Run Security Tests
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm text-red-800">
            Security testing validates document access permissions, signature fraud prevention, audit log completeness, encryption, and GDPR/CCPA compliance.
          </p>
        </section>

        {/* Prompt 2.7: Legal Compliance Testing */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">Legal Compliance</h2>
            <button
              type="button"
              onClick={handleCheckCompliance}
              disabled={checkingCompliance}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {checkingCompliance ? 'Checking...' : 'Check Compliance'}
            </button>
          </div>
          {compliance ? (
            <div className="mt-4 space-y-4">
              <div
                className={`rounded-lg border p-4 ${
                  compliance.isValid
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${compliance.isValid ? 'text-green-700' : 'text-red-700'}`}>
                    {compliance.isValid ? '✓' : '✗'}
                  </span>
                  <span className={`font-medium ${compliance.isValid ? 'text-green-900' : 'text-red-900'}`}>
                    {compliance.isValid ? 'Contract is compliant' : 'Compliance issues found'}
                  </span>
                </div>
                {compliance.errors.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-900">Errors:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1 text-sm text-red-800">
                      {compliance.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {compliance.warnings.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-amber-900">Warnings:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1 text-sm text-amber-800">
                      {compliance.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">Required Disclosures for {compliance.complianceInfo.state}:</p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-blue-800">
                  {compliance.requiredDisclosures.map((disclosure, idx) => (
                    <li key={idx}>{disclosure}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <p className="text-sm font-medium text-purple-900">Statutory Language:</p>
                <div className="mt-2 rounded border border-purple-300 bg-white p-3 text-xs font-mono text-purple-800 whitespace-pre-wrap">
                  {compliance.complianceInfo.statutoryLanguage.trim()}
                </div>
                <div className="mt-3 flex gap-2">
                  {contract.status === 'DRAFT' ? (
                    <button
                      type="button"
                      onClick={() => handleAddStatutoryLanguage(true)}
                      className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
                    >
                      Add to Contract
                    </button>
                  ) : null}
                </div>
              </div>

              {retention ? (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-sm font-medium text-neutral-900">Document Retention:</p>
                  <p className="mt-1 text-sm text-neutral-700">
                    Required retention: <strong>{retention.retentionYears} years</strong>
                  </p>
                  {retention.expiresAt ? (
                    <p className="mt-1 text-sm text-neutral-700">
                      Retention expires: <strong>{new Date(retention.expiresAt).toLocaleDateString()}</strong>
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-neutral-700">
                    Status: <strong className={retention.shouldRetain ? 'text-green-700' : 'text-amber-700'}>
                      {retention.shouldRetain ? 'Retain document' : 'Retention period expired'}
                    </strong>
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-neutral-600">Click &quot;Check Compliance&quot; to validate this contract against state requirements</p>
          )}
        </section>

        {/* Contract Terms Preview */}
        {contract.terms ? (
          <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Contract Terms</h2>
            <div
              className="mt-4 max-h-96 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm"
              dangerouslySetInnerHTML={{ __html: contract.terms }}
            />
          </section>
        ) : null}

        {/* Actions */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {contract.status === 'DRAFT' ? (
              <button
                type="button"
                onClick={handleSendForSignature}
                disabled={sending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send for Signature'}
              </button>
            ) : null}
            {isSent && !isSigned ? (
              <button
                type="button"
                onClick={handleRefresh}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Refresh Status
              </button>
            ) : null}
            {contract.status === 'DRAFT' || contract.status === 'SENT' ? (
              <button
                type="button"
                onClick={async () => {
                  const reason = prompt('Please provide a reason for cancelling this contract:')
                  if (reason) {
                    try {
                      await api.cancelContract(contract.id, reason)
                      alert('Contract cancelled successfully')
                      loadData()
                    } catch (e: unknown) {
                      alert(e instanceof Error ? e.message : 'Failed to cancel contract')
                    }
                  }
                }}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Cancel Contract
              </button>
            ) : null}
            {(contract.status === 'SIGNED' || contract.status === 'ACTIVE') && contract.status !== 'ARCHIVED' ? (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Archive this contract? It will be moved to archived status.')) {
                    try {
                      await api.archiveContract(contract.id)
                      alert('Contract archived successfully')
                      loadData()
                    } catch (e: unknown) {
                      alert(e instanceof Error ? e.message : 'Failed to archive contract')
                    }
                  }
                }}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Archive Contract
              </button>
            ) : null}
            {isSigned ? (
              <button
                type="button"
                onClick={handleDownloadSigned}
                disabled={downloading}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {downloading ? 'Downloading...' : 'Download Signed Contract'}
              </button>
            ) : null}
            <Link
              href={`/owner/projects/${params.id}`}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Back to Project
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
