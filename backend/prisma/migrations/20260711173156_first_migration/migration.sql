BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Administrator] (
    [AdministratorID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Administrator_AdministratorID_df] DEFAULT newid(),
    [EntraID_ObjectID] NVARCHAR(255),
    [FirstName] NVARCHAR(100) NOT NULL,
    [LastName] NVARCHAR(100) NOT NULL,
    [Email] NVARCHAR(255) NOT NULL,
    [PasswordHash] NVARCHAR(255),
    [RegistrationDate] DATETIME2 NOT NULL CONSTRAINT [Administrator_RegistrationDate_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Administrator_pkey] PRIMARY KEY CLUSTERED ([AdministratorID]),
    CONSTRAINT [Administrator_EntraID_ObjectID_key] UNIQUE NONCLUSTERED ([EntraID_ObjectID]),
    CONSTRAINT [Administrator_Email_key] UNIQUE NONCLUSTERED ([Email])
);

-- CreateTable
CREATE TABLE [dbo].[Condominium] (
    [CondominiumID] INT NOT NULL IDENTITY(1,1),
    [AdministratorID] UNIQUEIDENTIFIER NOT NULL,
    [Name] NVARCHAR(150) NOT NULL,
    CONSTRAINT [Condominium_pkey] PRIMARY KEY CLUSTERED ([CondominiumID])
);

-- AddForeignKey
ALTER TABLE [dbo].[Condominium] ADD CONSTRAINT [Condominium_AdministratorID_fkey] FOREIGN KEY ([AdministratorID]) REFERENCES [dbo].[Administrator]([AdministratorID]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
