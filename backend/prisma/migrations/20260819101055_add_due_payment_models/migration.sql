/*
  Warnings:

  - A unique constraint covering the columns `[EntraID_ObjectID]` on the table `Administrator` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
DROP INDEX [Administrator_EntraID_ObjectID_key] ON [dbo].[Administrator];

-- CreateTable
CREATE TABLE [dbo].[Due] (
    [DueID] INT NOT NULL IDENTITY(1,1),
    [TenantID] INT NOT NULL,
    [Amount] DECIMAL(18,2) NOT NULL,
    [Reason] NVARCHAR(255) NOT NULL,
    [DueDate] DATETIME2 NOT NULL CONSTRAINT [Due_DueDate_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [Due_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Due_pkey] PRIMARY KEY CLUSTERED ([DueID])
);

-- CreateTable
CREATE TABLE [dbo].[Payment] (
    [PaymentID] INT NOT NULL IDENTITY(1,1),
    [TenantID] INT NOT NULL,
    [DueID] INT,
    [Amount] DECIMAL(18,2) NOT NULL,
    [PaymentDate] DATETIME2 NOT NULL CONSTRAINT [Payment_PaymentDate_df] DEFAULT CURRENT_TIMESTAMP,
    [Notes] NVARCHAR(255),
    CONSTRAINT [Payment_pkey] PRIMARY KEY CLUSTERED ([PaymentID])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Due_TenantID_idx] ON [dbo].[Due]([TenantID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Payment_TenantID_idx] ON [dbo].[Payment]([TenantID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Payment_DueID_idx] ON [dbo].[Payment]([DueID]);

-- CreateIndex
CREATE UNIQUE NONCLUSTERED INDEX [Administrator_EntraID_ObjectID_key] ON [dbo].[Administrator]([EntraID_ObjectID]) WHERE (EntraID_ObjectID IS NOT NULL);

-- AddForeignKey
ALTER TABLE [dbo].[Due] ADD CONSTRAINT [Due_TenantID_fkey] FOREIGN KEY ([TenantID]) REFERENCES [dbo].[Tenant]([TenantID]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Payment] ADD CONSTRAINT [Payment_TenantID_fkey] FOREIGN KEY ([TenantID]) REFERENCES [dbo].[Tenant]([TenantID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Payment] ADD CONSTRAINT [Payment_DueID_fkey] FOREIGN KEY ([DueID]) REFERENCES [dbo].[Due]([DueID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
