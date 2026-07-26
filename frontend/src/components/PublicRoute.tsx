import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Flex, Spinner, VStack } from "@chakra-ui/react";
import { useAuth } from "@/hooks/useAuth";

interface PublicRoutesProps {
	children?: ReactNode;
}

/**
 * Route guard for guest-only pages (like login and register).
 * Displays loading spinner while session restoration is in progress.
 * Redirects authenticated users to the dashboard (`/`).
 */
export function PublicRoutes({ children }: PublicRoutesProps) {
	const { user, isSessionRestoring } = useAuth();

	if (isSessionRestoring) {
		return (
			<Flex minH="100vh" align="center" justify="center">
				<VStack gap="3">
					<Spinner size="xl" color="blue.500" />
				</VStack>
			</Flex>
		);
	}

	if (user) {
		return <Navigate to="/" replace />;
	}

	// Redirect to the correct public page
	return children ? <>{children}</> : <Outlet />;
}
