BEGIN TRY

BEGIN TRAN;

-- Drop default constraint on DueDate column before dropping column in SQL Server
ALTER TABLE [dbo].[Due] DROP CONSTRAINT [Due_DueDate_df];

-- Drop DueDate column
ALTER TABLE [dbo].[Due] DROP COLUMN [DueDate];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
