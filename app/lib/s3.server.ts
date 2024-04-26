import { S3Client } from "@aws-sdk/client-s3";

const credentials = {
  accessKeyId: process.env.S3_ACCESS_KEY_ID!,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
};

// Create an S3 service client object.
export const s3Client = new S3Client({
  endpoint: process.env.S3_END_POINT,
  credentials: credentials,
  region: process.env.S3_REGION,
});
