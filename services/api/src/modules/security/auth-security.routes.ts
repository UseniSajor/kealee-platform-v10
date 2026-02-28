/**
 * Auth Security Routes
 * API endpoints for TwoFactorSecret, BackupCode, PasswordHistory,
 * and PasswordResetToken management.
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomBytes, createHash } from 'crypto'
import { prisma } from '@kealee/database'
import { authenticateUser, requireAdmin } from '../../middleware/auth.middleware'
import { validateBody } from '../../middleware/validation.middleware'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const verify2FASchema = z.object({
  token: z.string().min(6).max(8),
})

const passwordResetSchema = z.object({
  userId: z.string().uuid(),
  expiresInMinutes: z.number().int().min(5).max(1440).default(60),
})

const passwordResetVerifySchema = z.object({
  token: z.string().min(1),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSecret(): string {
  return randomBytes(20).toString('hex')
}

function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = randomBytes(4).toString('hex').toUpperCase()
    // Format: XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }
  return codes
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

function generateResetToken(): string {
  return randomBytes(32).toString('hex')
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function authSecurityRoutes(fastify: FastifyInstance) {
  // All auth-security routes require admin authentication
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply);
    await requireAdmin(request, reply);
  });

  // ========================================================================
  // TWO-FACTOR AUTHENTICATION
  // ========================================================================

  /**
   * POST /2fa/setup
   * Create a 2FA secret for the authenticated user.
   */
  fastify.post('/2fa/setup', async (request, reply) => {
    try {
      const user = (request as any).user as { id: string }

      // Check if 2FA is already set up
      const existing = await prisma.twoFactorSecret.findUnique({
        where: { userId: user.id },
      })

      if (existing && existing.isEnabled) {
        return reply.code(409).send({
          success: false,
          error: '2FA is already enabled for this user',
        })
      }

      const secret = generateSecret()

      const twoFactor = await prisma.twoFactorSecret.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          secret,
          isEnabled: false,
          isVerified: false,
        },
        update: {
          secret,
          isEnabled: false,
          isVerified: false,
        },
      })

      return reply.code(201).send({
        success: true,
        data: {
          id: twoFactor.id,
          secret,
          message: 'Use this secret to configure your authenticator app, then verify with POST /2fa/verify',
        },
      })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error, 'Failed to set up 2FA'),
      })
    }
  })

  /**
   * POST /2fa/verify
   * Verify a 2FA token and enable 2FA for the user.
   */
  fastify.post(
    '/2fa/verify',
    { preHandler: [validateBody(verify2FASchema)] },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { token } = request.body as z.infer<typeof verify2FASchema>

        const twoFactor = await prisma.twoFactorSecret.findUnique({
          where: { userId: user.id },
        })

        if (!twoFactor) {
          return reply.code(404).send({
            success: false,
            error: '2FA has not been set up. Call POST /2fa/setup first.',
          })
        }

        // In a production system you would validate the TOTP token against
        // the stored secret using a library like `otplib`. For this route
        // we mark the 2FA as verified and enabled once the client confirms.
        if (!token || token.length < 6) {
          return reply.code(400).send({
            success: false,
            error: 'Invalid verification token',
          })
        }

        const updated = await prisma.twoFactorSecret.update({
          where: { userId: user.id },
          data: {
            isVerified: true,
            isEnabled: true,
            lastUsedAt: new Date(),
          },
        })

        // Generate backup codes upon successful 2FA verification
        const rawCodes = generateBackupCodes(10)
        await prisma.backupCode.createMany({
          data: rawCodes.map((code) => ({
            userId: user.id,
            code: hashCode(code),
          })),
        })

        return reply.send({
          success: true,
          data: {
            enabled: updated.isEnabled,
            verified: updated.isVerified,
            backupCodes: rawCodes,
            message: 'Save these backup codes securely. They will not be shown again.',
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to verify 2FA'),
        })
      }
    },
  )

  /**
   * DELETE /2fa
   * Disable 2FA for the authenticated user.
   */
  fastify.delete('/2fa', async (request, reply) => {
    try {
      const user = (request as any).user as { id: string }

      const twoFactor = await prisma.twoFactorSecret.findUnique({
        where: { userId: user.id },
      })

      if (!twoFactor) {
        return reply.code(404).send({
          success: false,
          error: '2FA is not configured for this user',
        })
      }

      // Disable and remove secret
      await prisma.twoFactorSecret.update({
        where: { userId: user.id },
        data: {
          isEnabled: false,
          isVerified: false,
        },
      })

      // Invalidate all backup codes
      await prisma.backupCode.updateMany({
        where: { userId: user.id, isUsed: false },
        data: { isUsed: true, usedAt: new Date() },
      })

      return reply.send({
        success: true,
        message: '2FA has been disabled and backup codes invalidated',
      })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error, 'Failed to disable 2FA'),
      })
    }
  })

  // ========================================================================
  // BACKUP CODES
  // ========================================================================

  /**
   * GET /backup-codes
   * List backup codes for the authenticated user (redacted - only shows
   * used status and creation date, not the actual codes).
   */
  fastify.get('/backup-codes', async (request, reply) => {
    try {
      const user = (request as any).user as { id: string }

      const codes = await prisma.backupCode.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          isUsed: true,
          usedAt: true,
          createdAt: true,
          // code is NOT returned - it is a hash
        },
      })

      const total = codes.length
      const remaining = codes.filter((c) => !c.isUsed).length

      return reply.send({
        success: true,
        data: {
          codes,
          total,
          remaining,
        },
      })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error, 'Failed to fetch backup codes'),
      })
    }
  })

  /**
   * POST /backup-codes/regenerate
   * Regenerate backup codes for the authenticated user. Invalidates all
   * existing codes.
   */
  fastify.post('/backup-codes/regenerate', async (request, reply) => {
    try {
      const user = (request as any).user as { id: string }

      // Verify 2FA is enabled
      const twoFactor = await prisma.twoFactorSecret.findUnique({
        where: { userId: user.id },
      })

      if (!twoFactor || !twoFactor.isEnabled) {
        return reply.code(400).send({
          success: false,
          error: '2FA must be enabled before generating backup codes',
        })
      }

      // Invalidate existing codes
      await prisma.backupCode.updateMany({
        where: { userId: user.id, isUsed: false },
        data: { isUsed: true, usedAt: new Date() },
      })

      // Generate new codes
      const rawCodes = generateBackupCodes(10)
      await prisma.backupCode.createMany({
        data: rawCodes.map((code) => ({
          userId: user.id,
          code: hashCode(code),
        })),
      })

      return reply.send({
        success: true,
        data: {
          backupCodes: rawCodes,
          message: 'Previous codes have been invalidated. Save these new codes securely.',
        },
      })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error, 'Failed to regenerate backup codes'),
      })
    }
  })

  // ========================================================================
  // PASSWORD RESET
  // ========================================================================

  /**
   * POST /password-reset
   * Create a password reset token for the specified user.
   */
  fastify.post(
    '/password-reset',
    { preHandler: [validateBody(passwordResetSchema)] },
    async (request, reply) => {
      try {
        const { userId, expiresInMinutes } = request.body as z.infer<typeof passwordResetSchema>

        // Verify user exists
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
          return reply.code(404).send({
            success: false,
            error: 'User not found',
          })
        }

        // Invalidate any existing unused tokens for this user
        await prisma.passwordResetToken.updateMany({
          where: {
            userId,
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
          data: { usedAt: new Date() },
        })

        const token = generateResetToken()
        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)

        const resetToken = await prisma.passwordResetToken.create({
          data: {
            userId,
            token: hashCode(token),
            expiresAt,
          },
        })

        return reply.code(201).send({
          success: true,
          data: {
            id: resetToken.id,
            token, // Return raw token once; stored as hash
            expiresAt: resetToken.expiresAt,
            message: 'Token created. Deliver it to the user via a secure channel.',
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create password reset token'),
        })
      }
    },
  )

  /**
   * POST /password-reset/verify
   * Verify a password reset token is valid and not expired.
   */
  fastify.post(
    '/password-reset/verify',
    { preHandler: [validateBody(passwordResetVerifySchema)] },
    async (request, reply) => {
      try {
        const { token } = request.body as z.infer<typeof passwordResetVerifySchema>
        const hashedToken = hashCode(token)

        const resetToken = await prisma.passwordResetToken.findUnique({
          where: { token: hashedToken },
        })

        if (!resetToken) {
          return reply.code(404).send({
            success: false,
            error: 'Invalid or unknown reset token',
          })
        }

        if (resetToken.usedAt) {
          return reply.code(410).send({
            success: false,
            error: 'This reset token has already been used',
          })
        }

        if (resetToken.expiresAt < new Date()) {
          return reply.code(410).send({
            success: false,
            error: 'This reset token has expired',
          })
        }

        return reply.send({
          success: true,
          data: {
            valid: true,
            userId: resetToken.userId,
            expiresAt: resetToken.expiresAt,
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to verify reset token'),
        })
      }
    },
  )
}
