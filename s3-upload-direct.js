#!/usr/bin/env node

/**
 * Direct AWS S3 upload using Signature Version 4
 * No AWS CLI or SDK required
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');

const AWS_KEY = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET = 'kealee-hero-videos';
const S3_REGION = 'us-east-1';

const videos = {
  'kitchen-seedance-8sec': 'https://replicate.delivery/xezq/nPPaGJpAIIqfXqD1BROVRK8zC24yGnitwjM9h3I2e8XAoeqtA/tmp918wegji.mp4',
  'addition-seedance-8sec': 'https://replicate.delivery/xezq/nzDLyAy4dDYTKBMbzXES4ufa4pjsVRSfp4c088JhPupppeqtA/tmpxd4angyk.mp4',
  'garden-seedance-8sec': 'https://replicate.delivery/xezq/nWHCayy5BzLVLBSXzxYHlX3T9xBBcPdOw8ahoBnt1FveVvaLA/tmp8af2hnud.mp4',
  'kitchen-grok-15sec': 'https://replicate.delivery/xezq/jhHpAZi5iY59KZ43Ve97mcE2laoZfeSRIf94K2yw6bCMS9VbB/tmpdcant39j.mp4',
  'addition-grok-15sec': 'https://replicate.delivery/xezq/QfzXmwSpzU2IKifjG6I0JvCQYpiVpZ3zg4YpNZ8GQkufweVbB/tmpzxtam51k.mp4',
};

const s3Keys = {
  'kitchen-seedance-8sec': 'hero-videos/kitchen-transformation-seedance-8sec.mp4',
  'addition-seedance-8sec': 'hero-videos/addition-construction-seedance-8sec.mp4',
  'garden-seedance-8sec': 'hero-videos/garden-landscape-seedance-8sec.mp4',
  'kitchen-grok-15sec': 'construction-videos/kitchen-remodel-grok-15sec.mp4',
  'addition-grok-15sec': 'construction-videos/addition-grok-15sec.mp4',
};

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const chunks = [];

    protocol.get(url, (res) => {
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function sign(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest();
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = sign('AWS4' + key, dateStamp);
  const kRegion = sign(kDate, regionName);
  const kService = sign(kRegion, serviceName);
  const kSigning = sign(kService, 'aws4_request');
  return kSigning;
}

async function uploadToS3(videoName, fileData, s3Key) {
  const host = `${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;
  const amzdate = new Date().toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  const datestamp = amzdate.slice(0, 8);
  const payload_hash = crypto.createHash('sha256').update(fileData).digest('hex');

  const canonical_uri = '/' + s3Key;
  const canonical_querystring = '';
  const canonical_headers = `host:${host}\nx-amz-content-sha256:${payload_hash}\nx-amz-date:${amzdate}\n`;
  const signed_headers = 'host;x-amz-content-sha256;x-amz-date';

  const canonical_request = `PUT\n${canonical_uri}\n${canonical_querystring}\n${canonical_headers}\n${signed_headers}\n${payload_hash}`;
  const canonical_request_hash = crypto.createHash('sha256').update(canonical_request).digest('hex');

  const string_to_sign = `AWS4-HMAC-SHA256\n${amzdate}\n${datestamp}/${S3_REGION}/s3/aws4_request\n${canonical_request_hash}`;
  const signature_key = getSignatureKey(AWS_SECRET, datestamp, S3_REGION, 's3');
  const signature = crypto.createHmac('sha256', signature_key).update(string_to_sign).digest('hex');

  const authorization_header = `AWS4-HMAC-SHA256 Credential=${AWS_KEY}/${datestamp}/${S3_REGION}/s3/aws4_request, SignedHeaders=${signed_headers}, Signature=${signature}`;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      path: canonical_uri,
      method: 'PUT',
      headers: {
        'Content-Length': fileData.length,
        'Content-Type': 'video/mp4',
        'x-amz-date': amzdate,
        'x-amz-content-sha256': payload_hash,
        'Authorization': authorization_header,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers });
      });
    });

    req.on('error', reject);
    req.write(fileData);
    req.end();
  });
}

async function main() {
  console.log('\n╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('║' + '  📦 BACKUP VIDEOS TO AWS S3 (Direct Upload)  '.padEnd(68) + '║');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('╚' + '═'.repeat(68) + '╝\n');

  if (!AWS_KEY || !AWS_SECRET) {
    console.log('❌ AWS credentials not set');
    console.log('   Set: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  console.log(`📦 Bucket: ${S3_BUCKET}`);
  console.log(`🌍 Region: ${S3_REGION}\n`);

  const results = {};
  let successCount = 0;

  for (const [videoName, videoUrl] of Object.entries(videos)) {
    const s3Key = s3Keys[videoName];
    console.log(`📹 ${videoName}`);

    try {
      // Download
      console.log(`   ⬇️  Downloading...`);
      const fileData = await downloadFile(videoUrl);
      const sizeMB = (fileData.length / 1024 / 1024).toFixed(2);
      console.log(`   ✓ ${sizeMB}MB`);

      // Upload
      console.log(`   ⬆️  Uploading to S3...`);
      const result = await uploadToS3(videoName, fileData, s3Key);

      if (result.status === 200) {
        const s3Url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
        console.log(`   ✅ ${s3Url}`);
        results[videoName] = s3Url;
        successCount++;
      } else {
        console.log(`   ❌ S3 Upload failed (${result.status})`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message.substring(0, 100)}`);
    }
    console.log('');
  }

  console.log('═'.repeat(70));
  console.log(`✅ Backed up ${successCount}/${Object.keys(videos).length} videos to S3\n`);

  for (const [name, url] of Object.entries(results)) {
    console.log(`${name.replace(/-/g, ' ').toUpperCase()}`);
    console.log(`  ${url}\n`);
  }

  return successCount === Object.keys(videos).length;
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
