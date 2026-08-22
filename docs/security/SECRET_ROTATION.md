# Credential rotation and Git-history remediation

The tracked secret files were removed from the working tree on 2026-08-20. Treat every credential ever stored in them as compromised.

## Rotation order

1. GitHub/Cursor token; revoke before creating a replacement.
2. Stripe secret and webhook signing secrets; overlap webhook secrets during rollout.
3. Supabase database password, secret/service-role key, and legacy anon key where supported.
4. Clerk, Resend, OpenAI, Anthropic, Replicate, AWS, Sentry, and internal signing/session secrets.
5. Update Railway, Vercel, and GitHub Actions environment stores; redeploy; verify; revoke overlap keys.

## History remediation

After rotation and a clean clone backup, use `git filter-repo` to remove the exact former paths from all refs, force-push coordinated branches/tags, invalidate open clones, and require every contributor to clone again. Do not rewrite history before revocation: history removal does not invalidate credentials.

Required evidence for completion: provider revocation timestamps, successful production smoke tests with replacements, a full-history gitleaks pass, and branch protection preventing future secret-bearing pushes.
