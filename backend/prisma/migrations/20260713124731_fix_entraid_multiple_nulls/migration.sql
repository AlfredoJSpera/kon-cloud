/*
  Warnings:

  - A unique constraint covering the columns `[EntraID_ObjectID]` on the table `Administrator` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
ALTER TABLE [dbo].[Administrator] DROP CONSTRAINT [Administrator_EntraID_ObjectID_key];

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
