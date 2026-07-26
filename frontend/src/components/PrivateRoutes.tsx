import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Flex, Spinner, VStack } from "@chakra-ui/react";
import { useAuth } from "@/hooks/useAuth";

interface PrivateRoutesProps {
	children?: ReactNode;
}

/**
 * Route guard that requires user to be authenticated.
 * Displays loading spinner while session restoration is in progress.
 * Redirects to `/login` if unauthenticated.
 */
export function PrivateRoutes({ children }: PrivateRoutesProps) {
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

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	// Redirect to the correct protected page
	return children ? <>{children}</> : <Outlet />;
}
