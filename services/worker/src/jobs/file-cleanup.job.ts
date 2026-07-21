/**
 * File Cleanup Job
 * Removes old/incomplete file uploads and orphaned files
 */

// Import Prisma client
// Note: Adjust import path based on your package structure
let prismaAny: any
try {
  const db = require('@kealee/database')
  prismaAny = db.prisma || db.prismaAny || db.default
} catch (error) {
  // Fallback: import directly if package not available
  const { PrismaClient } = require('@prisma/client')
  prismaAny = new PrismaClient()
}
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import type { CronJobResult } from '../types/cron.types'

const BUCKET_NAME = process.env.S3_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'kealee-uploads'
const CLEANUP_AGE_DAYS = parseInt(process.env.FILE_CLEANUP_AGE_DAYS || '30') // Files older than 30 days
const INCOMPLETE_UPLOAD_AGE_HOURS = parseInt(process.env.INCOMPLETE_UPLOAD_AGE_HOURS || '24') // Incomplete uploads older than 24 hours

function getS3Client() {
  const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT
  const region = process.env.S3_REGION || process.env.R2_REGION || 'us-east-1'
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('S3/R2 credentials not configured')
  }

  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: endpoint ? true : false,
  })
}

/**
 * Clean up incomplete file uploads
 */
async function cleanupIncompleteUploads() {
  const cutoffDate = new Date()
  cutoffDate.setHours(cutoffDate.getHours() - INCOMPLETE_UPLOAD_AGE_HOURS)

  // Find incomplete uploads older than cutoff
  const incompleteFiles = await prismaAny.file.findMany({
    where: {
      status: 'UPLOADING',
      createdAt: {
        lt: cutoffDate,
      },
    },
    take: 100, // Process in batches
  })

  console.log(`Found ${incompleteFiles.length} incomplete uploads to cleanup`)

  const s3 = getS3Client()
  let deletedCount = 0

  for (const file of incompleteFiles) {
    try {
      // Delete from S3/R2
      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: file.key,
        })
      )

      // Delete from database
      await prismaAny.file.delete({
        where: { id: file.id },
      })

      deletedCount++
    } catch (error: any) {
      console.error(`Failed to delete incomplete file ${file.id}:`, error.message)
    }
  }

  console.log(`✅ Cleaned up ${deletedCount} incomplete file uploads`)
  return { deletedCount }
}

/**
 * Clean up orphaned files (files in S3 but not in database)
 */
async function cleanupOrphanedFiles() {
  const s3 = getS3Client()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_AGE_DAYS)

  let continuationToken: string | undefined
  let orphanedCount = 0
  let totalChecked = 0

  do {
    try {
      // List objects in bucket
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: 'uploads/',
        ContinuationToken: continuationToken,
      })

      const response = await s3.send(listCommand)

      if (!response.Contents || response.Contents.length === 0) {
        break
      }

      for (const object of response.Contents) {
        if (!object.Key || !object.LastModified) continue

        totalChecked++

        // Skip if file is too recent
        if (object.LastModified > cutoffDate) {
          continue
        }

        // Check if file exists in database
        const file = await prismaAny.file.findFirst({
          where: { key: object.Key },
        })

        if (!file) {
          // Orphaned file - delete it
          try {
            await s3.send(
              new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: object.Key,
              })
            )
            orphanedCount++
          } catch (error: any) {
            console.error(`Failed to delete orphaned file ${object.Key}:`, error.message)
          }
        }
      }

      continuationToken = response.NextContinuationToken
    } catch (error: any) {
      console.error('Error listing S3 objects:', error.message)
      break
    }
  } while (continuationToken)

  console.log(`✅ Cleaned up ${orphanedCount} orphaned files (checked ${totalChecked} files)`)
  return { orphanedCount, totalChecked }
}

/**
 * Clean up old files marked for deletion
 */
async function cleanupDeletedFiles() {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 7) // Keep deleted files for 7 days

  // Find files marked as deleted
  const deletedFiles = await prismaAny.file.findMany({
    where: {
      status: 'DELETED',
      updatedAt: {
        lt: cutoffDate,
      },
    },
    take: 100,
  })

  console.log(`Found ${deletedFiles.length} deleted files to remove`)

  const s3 = getS3Client()
  let deletedCount = 0

  for (const file of deletedFiles) {
    try {
      // Delete from S3/R2
      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: file.key,
        })
      )

      // Delete from database
      await prismaAny.file.delete({
        where: { id: file.id },
      })

      deletedCount++
    } catch (error: any) {
      console.error(`Failed to delete file ${file.id}:`, error.message)
    }
  }

  console.log(`✅ Cleaned up ${deletedCount} deleted files`)
  return { deletedCount }
}

/**
 * Execute file cleanup job
 */
export async function executeFileCleanup(): Promise<CronJobResult> {
  const startTime = Date.now()

  try {
    const [incompleteResult, orphanedResult, deletedResult] = await Promise.all([
      cleanupIncompleteUploads(),
      cleanupOrphanedFiles(),
      cleanupDeletedFiles(),
    ])

    const duration = Date.now() - startTime

    console.log(`✅ File cleanup job completed in ${duration}ms`)

    return {
      success: true,
      jobType: 'file_cleanup',
      executedAt: new Date(),
      duration,
      result: {
        incomplete: incompleteResult.deletedCount,
        orphaned: orphanedResult.orphanedCount,
        deleted: deletedResult.deletedCount,
      },
    }
  } catch (error: any) {
    console.error('❌ File cleanup job failed:', error)
    return {
      success: false,
      jobType: 'file_cleanup',
      executedAt: new Date(),
      duration: Date.now() - startTime,
      error: error.message || 'File cleanup failed',
    }
  }
}
