/*
  Warnings:

  - A unique constraint covering the columns `[EntraID_ObjectID]` on the table `Administrator` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
DROP INDEX [Administrator_EntraID_ObjectID_key] ON [dbo].[Administrator];

-- CreateIndex
CREATE UNIQUE NONCLUSTERED INDEX [Administrator_EntraID_ObjectID_key] ON [dbo].[Administrator]([EntraID_ObjectID]) WHERE (EntraID_ObjectID IS NOT NULL);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Condominium_AdministratorID_idx] ON [dbo].[Condominium]([AdministratorID]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
