import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

let containerClientInstance: ContainerClient | null = null;

function getContainerClient(): ContainerClient {
	if (containerClientInstance) {
		return containerClientInstance;
	}

	const connectionString =
		process.env.AZURE_STORAGE_CONNECTION_STRING ||
		"DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=YourAccountKey==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;";
	const containerName =
		process.env.AZURE_STORAGE_CONTAINER_NAME || "expense-attachments";

	const blobServiceClient =
		BlobServiceClient.fromConnectionString(connectionString);
	containerClientInstance =
		blobServiceClient.getContainerClient(containerName);
	return containerClientInstance;
}

export const storageService = {
	async ensureContainerExists(): Promise<void> {
		const client = getContainerClient();
		await client.createIfNotExists();
	},

	async uploadAttachment(
		blobName: string,
		buffer: Buffer,
		mimeType: string,
	): Promise<void> {
		const client = getContainerClient();
		await client.createIfNotExists();
		const blockBlobClient = client.getBlockBlobClient(blobName);
		await blockBlobClient.uploadData(buffer, {
			blobHTTPHeaders: { blobContentType: mimeType },
		});
	},

	async downloadAttachmentStream(
		blobName: string,
	): Promise<{
		stream: NodeJS.ReadableStream | undefined;
		contentType?: string;
	}> {
		const client = getContainerClient();
		const blockBlobClient = client.getBlockBlobClient(blobName);
		const downloadResponse = await blockBlobClient.download(0);
		return {
			stream: downloadResponse.readableStreamBody as
				| NodeJS.ReadableStream
				| undefined,
			contentType: downloadResponse.contentType,
		};
	},

	async deleteAttachment(blobName: string): Promise<void> {
		const client = getContainerClient();
		const blockBlobClient = client.getBlockBlobClient(blobName);
		await blockBlobClient.deleteIfExists();
	},
};
