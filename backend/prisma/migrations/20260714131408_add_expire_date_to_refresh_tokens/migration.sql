/*
  Warnings:

  - A unique constraint covering the columns `[EntraID_ObjectID]` on the table `Administrator` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expiresAt` to the `RefreshToken` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
DROP INDEX [Administrator_EntraID_ObjectID_key] ON [dbo].[Administrator];

-- AlterTable
ALTER TABLE [dbo].[RefreshToken] ADD [expiresAt] DATETIME2 NOT NULL;

-- CreateIndex
CREATE UNIQUE NONCLUSTERED INDEX [Administrator_EntraID_ObjectID_key] ON [dbo].[Administrator]([EntraID_ObjectID]) WHERE (EntraID_ObjectID IS NOT NULL);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
