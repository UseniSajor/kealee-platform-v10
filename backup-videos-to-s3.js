#!/usr/bin/env node

/**
 * Backup all generated videos to AWS S3
 * Downloads from Replicate CDN and uploads to S3
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const AWS_KEY = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET = 'kealee-hero-videos';
const S3_REGION = 'us-east-1';

const videos = {
  'kitchen-seedance-8sec': {
    url: 'https://replicate.delivery/xezq/nPPaGJpAIIqfXqD1BROVRK8zC24yGnitwjM9h3I2e8XAoeqtA/tmp918wegji.mp4',
    key: 'hero-videos/kitchen-transformation-seedance-8sec.mp4',
    type: 'Seedance 2.0 (8 sec)',
  },
  'addition-seedance-8sec': {
    url: 'https://replicate.delivery/xezq/nzDLyAy4dDYTKBMbzXES4ufa4pjsVRSfp4c088JhPupppeqtA/tmpxd4angyk.mp4',
    key: 'hero-videos/addition-construction-seedance-8sec.mp4',
    type: 'Seedance 2.0 (8 sec)',
  },
  'garden-seedance-8sec': {
    url: 'https://replicate.delivery/xezq/nWHCayy5BzLVLBSXzxYHlX3T9xBBcPdOw8ahoBnt1FveVvaLA/tmp8af2hnud.mp4',
    key: 'hero-videos/garden-landscape-seedance-8sec.mp4',
    type: 'Seedance 2.0 (8 sec)',
  },
  'kitchen-grok-15sec': {
    url: 'https://replicate.delivery/xezq/jhHpAZi5iY59KZ43Ve97mcE2laoZfeSRIf94K2yw6bCMS9VbB/tmpdcant39j.mp4',
    key: 'construction-videos/kitchen-remodel-grok-15sec.mp4',
    type: 'Grok Imagine (15 sec)',
  },
  'addition-grok-15sec': {
    url: 'https://replicate.delivery/xezq/QfzXmwSpzU2IKifjG6I0JvCQYpiVpZ3zg4YpNZ8GQkufweVbB/tmpzxtam51k.mp4',
    key: 'construction-videos/addition-grok-15sec.mp4',
    type: 'Grok Imagine (15 sec)',
  },
};

function downloadVideo(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const data = [];

    protocol.get(url, (res) => {
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

function s3Request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`,
      path: '/' + path,
      method,
      headers: {
        'Host': `${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`,
        ...headers,
      },
    };

    // Sign request with AWS Signature Version 4
    const timestamp = new Date().toISOString().replace(/[:-]/g, '').split('.')[0];
    const datestamp = timestamp.slice(0, 8);

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: responseData });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function signS3Request(method, bucketName, key, body, contentType) {
  // Simplified S3 upload using AWS CLI compatible approach
  // For production, use AWS SDK
  return {
    bucket: bucketName,
    key: key,
    contentType: contentType,
  };
}

async function uploadToS3(videoName, videoData, s3Key) {
  console.log(`   Uploading to S3: ${s3Key}`);

  // For MVP: use AWS CLI (requires credentials in environment)
  const { execSync } = require('child_process');

  try {
    // Write to temp file
    const tempFile = `/tmp/${videoName}.mp4`;
    fs.writeFileSync(tempFile, videoData);

    // Upload using AWS CLI
    const cmd = `aws s3 cp "${tempFile}" "s3://${S3_BUCKET}/${s3Key}" --region ${S3_REGION} --acl public-read`;
    execSync(cmd, { stdio: 'pipe' });

    // Clean up
    fs.unlinkSync(tempFile);

    return true;
  } catch (error) {
    console.log(`   ⚠️  Upload failed: ${error.message.substring(0, 100)}`);
    return false;
  }
}

async function backupVideosToS3() {
  console.log('\n╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('║' + '  📦 BACKUP VIDEOS TO AWS S3  '.padEnd(68) + '║');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('╚' + '═'.repeat(68) + '╝\n');

  if (!AWS_KEY || !AWS_SECRET) {
    console.log('❌ AWS credentials not set in environment');
    console.log('   Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    return false;
  }

  console.log(`📦 Bucket: ${S3_BUCKET}`);
  console.log(`🌍 Region: ${S3_REGION}\n`);

  const results = {};
  let successCount = 0;

  for (const [name, config] of Object.entries(videos)) {
    console.log(`\n📹 ${name} (${config.type})`);
    console.log(`   URL: ${config.url.substring(0, 70)}...`);

    try {
      // Download from Replicate CDN
      console.log('   ⬇️  Downloading from Replicate...');
      const videoData = await downloadVideo(config.url);
      console.log(`   ✓ Downloaded: ${(videoData.length / 1024 / 1024).toFixed(2)}MB`);

      // Upload to S3
      console.log('   ⬆️  Uploading to S3...');
      const success = await uploadToS3(name, videoData, config.key);

      if (success) {
        const s3Url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${config.key}`;
        console.log(`   ✅ S3 URL: ${s3Url}`);
        results[name] = s3Url;
        successCount++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message.substring(0, 150)}`);
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📊 S3 BACKUP SUMMARY');
  console.log('═'.repeat(70));
  console.log(`\n✅ Successfully backed up ${successCount}/${Object.keys(videos).length} videos\n`);

  for (const [name, url] of Object.entries(results)) {
    console.log(`${name}`);
    console.log(`  ${url}\n`);
  }

  return successCount > 0;
}

backupVideosToS3().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
