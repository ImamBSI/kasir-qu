import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | undefined;

function getStorageConfig() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const bucket = process.env.NEON_OBJECT_STORAGE_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  const missing = [
    ["AWS_ENDPOINT_URL_S3", endpoint],
    ["NEON_OBJECT_STORAGE_BUCKET", bucket],
    ["AWS_ACCESS_KEY_ID", accessKeyId],
    ["AWS_SECRET_ACCESS_KEY", secretAccessKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Object storage belum dikonfigurasi: ${missing.join(", ")}.`);
  }

  return {
    endpoint: endpoint!,
    bucket: bucket!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
  };
}

function getS3Client() {
  const config = getStorageConfig();
  if (!client) {
    client = new S3Client({
      endpoint: config.endpoint,
      region: process.env.AWS_REGION || "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return { client, bucket: config.bucket };
}

export async function uploadProductImage(
  key: string,
  body: Buffer,
  contentType: string,
) {
  const { client: s3, bucket } = getS3Client();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "private, max-age=3600",
    }),
  );
}

export async function getProductImageSignedUrl(key: string) {
  const { client: s3, bucket } = getS3Client();
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 3600 },
  );
}

export async function deleteProductImage(key: string) {
  const { client: s3, bucket } = getS3Client();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
