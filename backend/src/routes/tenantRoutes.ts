import { Router } from "express";
import { prisma } from "@lib/prisma";
import { catchError } from "@middleware/errorHandlerMW";
import { authenticateToken } from "@middleware/authenticateTokenMW";
import {
	ITenantCreateInput,
	ITenantOutput,
	ITenantUpdateInput,
} from "@interfaces/tenant";
import {
	KonIncorrectFieldTypeError,
	KonMissingRequiredFieldsError,
	KonNotFoundError,
	KonTenantAlreadyExistsError,
} from "@errors/validationErrors";
import { KonAccessDeniedError } from "@errors/authenticationErrors";
import { KonApiContract } from "@utils/apiContract";

const router = Router();

// Helper to validate email format without ReDoS vulnerability
const isValidEmail = (email: string): boolean => {
	if (!email || email.length > 254) return false;
	const atIndex = email.indexOf("@");
	if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) return false;
	const local = email.slice(0, atIndex);
	const domain = email.slice(atIndex + 1);
	if (!local || !domain || local.includes(" ") || domain.includes(" "))
		return false;
	const dotIndex = domain.lastIndexOf(".");
	if (dotIndex <= 0 || dotIndex === domain.length - 1) return false;
	return true;
};

type ListTenantsApiContract = KonApiContract<
	never,
	ITenantOutput[],
	never,
	{ condominiumId?: string }
>;
router.get(
	"/",
	authenticateToken,
	catchError(
		async (
			req: ListTenantsApiContract["Req"],
			res: ListTenantsApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const condoIdStr = req.query.condominiumId;

			if (!condoIdStr) {
				throw new KonMissingRequiredFieldsError(
					"Missing required query parameter: condominiumId.",
				);
			}

			const condoId = parseInt(condoIdStr as string, 10);
			if (isNaN(condoId)) {
				throw new KonIncorrectFieldTypeError(
					"condominiumId must be a valid number.",
				);
			}

			// Verify condominium existence and ownership
			const condominium = await prisma.condominium.findUnique({
				where: { CondominiumID: condoId },
			});

			if (!condominium) {
				throw new KonNotFoundError("Condominium not found.");
			}

			if (condominium.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			const tenants = await prisma.tenant.findMany({
				where: { CondominiumID: condoId },
				orderBy: { RegistrationDate: "desc" },
			});

			const result: ITenantOutput[] = tenants.map((t) => ({
				tenantId: t.TenantID,
				condominiumId: t.CondominiumID,
				firstName: t.FirstName,
				lastName: t.LastName,
				...(t.Email ? { email: t.Email } : {}),
				...(t.Phone ? { phone: t.Phone } : {}),
				apartmentNumber: t.ApartmentNumber,
				registrationDate: t.RegistrationDate.toISOString(),
			}));

			res.status(200).json(result);
		},
	),
);

type CreateTenantApiContract = KonApiContract<
	ITenantCreateInput,
	ITenantOutput
>;
router.post(
	"/",
	authenticateToken,
	catchError(
		async (
			req: CreateTenantApiContract["Req"],
			res: CreateTenantApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const {
				condominiumId,
				firstName,
				lastName,
				email,
				phone,
				apartmentNumber,
			} = req.body;

			if (
				condominiumId === undefined ||
				!firstName ||
				!lastName ||
				!apartmentNumber
			) {
				throw new KonMissingRequiredFieldsError(
					"First name, last name, apartment number, and condominium ID are required.",
				);
			}

			const trimmedEmail =
				typeof email === "string" ? email.trim() : undefined;
			const trimmedPhone =
				typeof phone === "string" ? phone.trim() : undefined;

			if (
				typeof condominiumId !== "number" ||
				typeof firstName !== "string" ||
				typeof lastName !== "string" ||
				typeof apartmentNumber !== "string" ||
				(email !== undefined && typeof email !== "string") ||
				(phone !== undefined && typeof phone !== "string")
			) {
				throw new KonIncorrectFieldTypeError();
			}

			if (trimmedEmail && !isValidEmail(trimmedEmail)) {
				throw new KonIncorrectFieldTypeError("Invalid email format.");
			}

			const condoId = condominiumId;
			const condominium = await prisma.condominium.findUnique({
				where: { CondominiumID: condoId },
			});

			if (!condominium) {
				throw new KonNotFoundError("Condominium not found.");
			}

			if (condominium.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			// Duplicate check within condominium
			const trimmedFirstName = firstName.trim();
			const trimmedLastName = lastName.trim();
			const trimmedApartmentNumber = apartmentNumber.trim();

			// Search for duplicate email or duplicate (firstName + lastName + apartmentNumber)
			const duplicateConditions: Record<string, unknown>[] = [
				{
					FirstName: trimmedFirstName,
					LastName: trimmedLastName,
					ApartmentNumber: trimmedApartmentNumber,
				},
			];

			if (trimmedEmail) {
				duplicateConditions.push({ Email: trimmedEmail });
			}

			const existingDuplicate = await prisma.tenant.findFirst({
				where: {
					CondominiumID: condoId,
					OR: duplicateConditions,
				},
			});

			if (existingDuplicate) {
				throw new KonTenantAlreadyExistsError();
			}

			const created = await prisma.tenant.create({
				data: {
					CondominiumID: condoId,
					FirstName: trimmedFirstName,
					LastName: trimmedLastName,
					Email: trimmedEmail || null,
					Phone: trimmedPhone || null,
					ApartmentNumber: trimmedApartmentNumber,
				},
			});

			res.status(201).json({
				tenantId: created.TenantID,
				condominiumId: created.CondominiumID,
				firstName: created.FirstName,
				lastName: created.LastName,
				...(created.Email ? { email: created.Email } : {}),
				...(created.Phone ? { phone: created.Phone } : {}),
				apartmentNumber: created.ApartmentNumber,
				registrationDate: created.RegistrationDate.toISOString(),
			});
		},
	),
);

type GetTenantApiContract = KonApiContract<
	never,
	ITenantOutput,
	{ id: string }
>;
router.get(
	"/:id",
	authenticateToken,
	catchError(
		async (
			req: GetTenantApiContract["Req"],
			res: GetTenantApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const tenantId = parseInt(req.params.id, 10);

			if (isNaN(tenantId)) {
				throw new KonNotFoundError();
			}

			const tenant = await prisma.tenant.findUnique({
				where: { TenantID: tenantId },
				include: { Condominium: true },
			});

			if (!tenant) {
				throw new KonNotFoundError();
			}

			if (tenant.Condominium.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			res.status(200).json({
				tenantId: tenant.TenantID,
				condominiumId: tenant.CondominiumID,
				firstName: tenant.FirstName,
				lastName: tenant.LastName,
				...(tenant.Email ? { email: tenant.Email } : {}),
				...(tenant.Phone ? { phone: tenant.Phone } : {}),
				apartmentNumber: tenant.ApartmentNumber,
				registrationDate: tenant.RegistrationDate.toISOString(),
			});
		},
	),
);

type UpdateTenantApiContract = KonApiContract<
	ITenantUpdateInput,
	ITenantOutput,
	{ id: string }
>;
router.put(
	"/:id",
	authenticateToken,
	catchError(
		async (
			req: UpdateTenantApiContract["Req"],
			res: UpdateTenantApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const tenantId = parseInt(req.params.id, 10);

			if (isNaN(tenantId)) {
				throw new KonNotFoundError();
			}

			const existing = await prisma.tenant.findUnique({
				where: { TenantID: tenantId },
				include: { Condominium: true },
			});

			if (!existing) {
				throw new KonNotFoundError();
			}

			if (existing.Condominium.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			const { firstName, lastName, email, phone, apartmentNumber } =
				req.body;

			if (
				(firstName !== undefined && typeof firstName !== "string") ||
				(lastName !== undefined && typeof lastName !== "string") ||
				(apartmentNumber !== undefined &&
					typeof apartmentNumber !== "string") ||
				(email !== undefined && typeof email !== "string") ||
				(phone !== undefined && typeof phone !== "string")
			) {
				throw new KonIncorrectFieldTypeError();
			}

			const newFirstName =
				firstName !== undefined ? firstName.trim() : existing.FirstName;
			const newLastName =
				lastName !== undefined ? lastName.trim() : existing.LastName;
			const newApartmentNumber =
				apartmentNumber !== undefined
					? apartmentNumber.trim()
					: existing.ApartmentNumber;
			const newEmail =
				email !== undefined
					? typeof email === "string" && email.trim().length > 0
						? email.trim()
						: null
					: existing.Email;
			const newPhone =
				phone !== undefined
					? typeof phone === "string" && phone.trim().length > 0
						? phone.trim()
						: null
					: existing.Phone;

			if (!newFirstName || !newLastName || !newApartmentNumber) {
				throw new KonMissingRequiredFieldsError(
					"First name, last name, and apartment number cannot be empty.",
				);
			}

			if (newEmail && !isValidEmail(newEmail)) {
				throw new KonIncorrectFieldTypeError("Invalid email format.");
			}

			// Duplicate check excluding self
			const duplicateConditions: Record<string, unknown>[] = [
				{
					FirstName: newFirstName,
					LastName: newLastName,
					ApartmentNumber: newApartmentNumber,
				},
			];

			if (newEmail) {
				duplicateConditions.push({ Email: newEmail });
			}

			const existingDuplicate = await prisma.tenant.findFirst({
				where: {
					CondominiumID: existing.CondominiumID,
					NOT: { TenantID: tenantId },
					OR: duplicateConditions,
				},
			});

			if (existingDuplicate) {
				throw new KonTenantAlreadyExistsError();
			}

			const updated = await prisma.tenant.update({
				where: { TenantID: tenantId },
				data: {
					FirstName: newFirstName,
					LastName: newLastName,
					Email: newEmail,
					Phone: newPhone,
					ApartmentNumber: newApartmentNumber,
				},
			});

			res.status(200).json({
				tenantId: updated.TenantID,
				condominiumId: updated.CondominiumID,
				firstName: updated.FirstName,
				lastName: updated.LastName,
				...(updated.Email ? { email: updated.Email } : {}),
				...(updated.Phone ? { phone: updated.Phone } : {}),
				apartmentNumber: updated.ApartmentNumber,
				registrationDate: updated.RegistrationDate.toISOString(),
			});
		},
	),
);

type DeleteTenantApiContract = KonApiContract<
	never,
	{ message: string },
	{ id: string }
>;
router.delete(
	"/:id",
	authenticateToken,
	catchError(
		async (
			req: DeleteTenantApiContract["Req"],
			res: DeleteTenantApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const tenantId = parseInt(req.params.id, 10);

			if (isNaN(tenantId)) {
				throw new KonNotFoundError();
			}

			const existing = await prisma.tenant.findUnique({
				where: { TenantID: tenantId },
				include: { Condominium: true },
			});

			if (!existing) {
				throw new KonNotFoundError();
			}

			if (existing.Condominium.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			await prisma.$transaction(async (tx) => {
				await tx.payment.deleteMany({
					where: { TenantID: tenantId },
				});
				await tx.due.deleteMany({
					where: { TenantID: tenantId },
				});
				await tx.tenant.delete({
					where: { TenantID: tenantId },
				});
			});

			res.status(200).json({
				message: "Tenant deleted successfully",
			});
		},
	),
);

export default router;
