import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Media upload service.
 * In production, this generates S3 presigned URLs.
 * This stub provides the interface.
 */
export class MediaService {
  async getPresignedUploadUrl(
    userId: string,
    fileType: string,
    fileName: string
  ) {
    const mediaId = uuidv4();
    const key = `uploads/${userId}/${mediaId}/${fileName}`;

    // In production: generate S3 presigned URL
    // const command = new PutObjectCommand({
    //   Bucket: config.aws.s3Bucket,
    //   Key: key,
    //   ContentType: fileType,
    // });
    // const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    const presignedUrl = `${config.aws.cdnBaseUrl}/upload/${key}`;

    return {
      mediaId,
      presignedUrl,
      key,
      cdnUrl: `${config.aws.cdnBaseUrl}/${key}`,
    };
  }

  async confirmUpload(mediaId: string, key: string) {
    // In production: verify the file exists in S3
    // const headCommand = new HeadObjectCommand({
    //   Bucket: config.aws.s3Bucket,
    //   Key: key,
    // });
    // await s3Client.send(headCommand);

    return {
      mediaId,
      cdnUrl: `${config.aws.cdnBaseUrl}/${key}`,
    };
  }

  async deleteMedia(key: string) {
    // In production: delete from S3
    // const command = new DeleteObjectCommand({
    //   Bucket: config.aws.s3Bucket,
    //   Key: key,
    // });
    // await s3Client.send(command);

    console.log(`[MEDIA] Deleted: ${key}`);
  }
}

export const mediaService = new MediaService();
