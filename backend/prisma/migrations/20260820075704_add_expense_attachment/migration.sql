/*
  Warnings:

  - A unique constraint covering the columns `[EntraID_ObjectID]` on the table `Administrator` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
DROP INDEX [Administrator_EntraID_ObjectID_key] ON [dbo].[Administrator];

-- CreateTable
CREATE TABLE [dbo].[ExpenseAttachment] (
    [AttachmentID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ExpenseAttachment_AttachmentID_df] DEFAULT newid(),
    [ExpenseID] INT NOT NULL,
    [FileName] NVARCHAR(255) NOT NULL,
    [BlobName] NVARCHAR(255) NOT NULL,
    [FileSize] INT NOT NULL,
    [MimeType] NVARCHAR(100) NOT NULL,
    [UploadedAt] DATETIME2 NOT NULL CONSTRAINT [ExpenseAttachment_UploadedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ExpenseAttachment_pkey] PRIMARY KEY CLUSTERED ([AttachmentID])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ExpenseAttachment_ExpenseID_idx] ON [dbo].[ExpenseAttachment]([ExpenseID]);

-- CreateIndex
CREATE UNIQUE NONCLUSTERED INDEX [Administrator_EntraID_ObjectID_key] ON [dbo].[Administrator]([EntraID_ObjectID]) WHERE (EntraID_ObjectID IS NOT NULL);

-- AddForeignKey
ALTER TABLE [dbo].[ExpenseAttachment] ADD CONSTRAINT [ExpenseAttachment_ExpenseID_fkey] FOREIGN KEY ([ExpenseID]) REFERENCES [dbo].[Expense]([ExpenseID]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
