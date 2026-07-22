import { BlobServiceClient } from "@azure/storage-blob";

const blobService = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
const containerClient = blobService.getContainerClient(
  process.env.AZURE_STORAGE_CONTAINER
);

// file: multer-ийн memory buffer, originalname, mimetype
export async function uploadToBlob(file) {
  const ext = file.originalname.split(".").pop();
  const blobName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  return blockBlobClient.url; // public URL, DB-д хадгална
}