/*
  Warnings:

  - A unique constraint covering the columns `[EntraID_ObjectID]` on the table `Administrator` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
DROP INDEX [Administrator_EntraID_ObjectID_key] ON [dbo].[Administrator];

-- CreateTable
CREATE TABLE [dbo].[RefreshToken] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [RefreshToken_id_df] DEFAULT newid(),
    [token] NVARCHAR(500) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [RefreshToken_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [administratorId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [RefreshToken_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [RefreshToken_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateIndex
CREATE UNIQUE NONCLUSTERED INDEX [Administrator_EntraID_ObjectID_key] ON [dbo].[Administrator]([EntraID_ObjectID]) WHERE (EntraID_ObjectID IS NOT NULL);

-- AddForeignKey
ALTER TABLE [dbo].[RefreshToken] ADD CONSTRAINT [RefreshToken_administratorId_fkey] FOREIGN KEY ([administratorId]) REFERENCES [dbo].[Administrator]([AdministratorID]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
