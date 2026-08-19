/*
  Warnings:

  - A unique constraint covering the columns `[EntraID_ObjectID]` on the table `Administrator` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
DROP INDEX [Administrator_EntraID_ObjectID_key] ON [dbo].[Administrator];

-- CreateTable
CREATE TABLE [dbo].[Tenant] (
    [TenantID] INT NOT NULL IDENTITY(1,1),
    [CondominiumID] INT NOT NULL,
    [FirstName] NVARCHAR(100) NOT NULL,
    [LastName] NVARCHAR(100) NOT NULL,
    [Email] NVARCHAR(255),
    [Phone] NVARCHAR(50),
    [ApartmentNumber] NVARCHAR(150) NOT NULL,
    [RegistrationDate] DATETIME2 NOT NULL CONSTRAINT [Tenant_RegistrationDate_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Tenant_pkey] PRIMARY KEY CLUSTERED ([TenantID])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Tenant_CondominiumID_idx] ON [dbo].[Tenant]([CondominiumID]);

-- CreateIndex
CREATE UNIQUE NONCLUSTERED INDEX [Administrator_EntraID_ObjectID_key] ON [dbo].[Administrator]([EntraID_ObjectID]) WHERE (EntraID_ObjectID IS NOT NULL);

-- AddForeignKey
ALTER TABLE [dbo].[Tenant] ADD CONSTRAINT [Tenant_CondominiumID_fkey] FOREIGN KEY ([CondominiumID]) REFERENCES [dbo].[Condominium]([CondominiumID]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
