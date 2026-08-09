export async function marketingDripHandler() {
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase-server')
    const { buildDripEmail } = await import('@/lib/marketing/email-templates')
    const { sendMarketingEmail } = await import('@/lib/marketing/resend')

    const supabase = getSupabaseAdmin()
    const now = new Date().toISOString()

    const { data: due, error } = await supabase
      .from('marketing_drip_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('send_at', now)
      .limit(50)

    if (error) {
      console.error(`  [marketing-drip] Error: ${error.message}`)
      return
    }

    let sent = 0
    for (const item of due ?? []) {
      const { subject, html } = (await buildDripEmail(item.sequence_step, {
        name: item.name ?? '',
        email: item.email,
      })) as any
      const ok = await sendMarketingEmail({ to: item.email, subject, html })
      if (ok) sent++
    }

    console.log(`  [marketing-drip] Sent ${sent}/${due?.length ?? 0} emails`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`  [marketing-drip] Error: ${msg}`)
  }
}
