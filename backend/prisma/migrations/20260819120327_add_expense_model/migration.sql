/*
  Warnings:

  - A unique constraint covering the columns `[EntraID_ObjectID]` on the table `Administrator` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
DROP INDEX [Administrator_EntraID_ObjectID_key] ON [dbo].[Administrator];

-- CreateTable
CREATE TABLE [dbo].[Expense] (
    [ExpenseID] INT NOT NULL IDENTITY(1,1),
    [CondominiumID] INT NOT NULL,
    [Category] NVARCHAR(50) NOT NULL,
    [Amount] DECIMAL(18,2) NOT NULL,
    [Description] NVARCHAR(255),
    [ExpenseDate] DATETIME2 NOT NULL CONSTRAINT [Expense_ExpenseDate_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [Expense_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Expense_pkey] PRIMARY KEY CLUSTERED ([ExpenseID])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Expense_CondominiumID_idx] ON [dbo].[Expense]([CondominiumID]);

-- CreateIndex
CREATE UNIQUE NONCLUSTERED INDEX [Administrator_EntraID_ObjectID_key] ON [dbo].[Administrator]([EntraID_ObjectID]) WHERE (EntraID_ObjectID IS NOT NULL);

-- AddForeignKey
ALTER TABLE [dbo].[Expense] ADD CONSTRAINT [Expense_CondominiumID_fkey] FOREIGN KEY ([CondominiumID]) REFERENCES [dbo].[Condominium]([CondominiumID]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
