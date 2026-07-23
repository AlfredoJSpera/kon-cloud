import {
	Badge,
	Box,
	Button,
	Code,
	Flex,
	Heading,
	HStack,
	Icon,
	Input,
	Separator,
	SimpleGrid,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useContext, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
	LuCheck,
	LuX,
	LuRefreshCw,
	LuUserCheck,
	LuKey,
	LuShieldCheck,
	LuLogOut,
	LuLogIn,
	LuTrash2,
	LuZap,
} from "react-icons/lu";
import { AuthContext } from "@/contexts/AuthContext";
import { api, getCsrfToken, setAccessToken } from "@/api/apiClient";
import { Field } from "@/components/chakraui/field";
import { PasswordInput } from "@/components/chakraui/password-input";

interface LogEntry {
	id: number;
	time: string;
	type: "info" | "success" | "error" | "warn";
	action: string;
	details: string;
}

export function AuthTestPage() {
	const authCtx = useContext(AuthContext);
	const [email, setEmail] = useState("mario.rossi@example.com");
	const [password, setPassword] = useState("PasswordSicura123!");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [logs, setLogs] = useState<LogEntry[]>([]);

	const addLog = (
		action: string,
		details: string,
		type: LogEntry["type"] = "info",
	) => {
		setLogs((prev) => [
			{
				id: Date.now() + Math.random(),
				time: new Date().toLocaleTimeString(),
				action,
				details,
				type,
			},
			...prev,
		]);
	};

	const handleLogin = async () => {
		if (!authCtx) return;
		setIsSubmitting(true);
		addLog(
			"POST /auth/login",
			`Attempting login with email: ${email}`,
			"info",
		);

		try {
			await authCtx.login({ email, password });
			const csrf = getCsrfToken();
			addLog(
				"Login Success",
				`Received token and profile. CSRF Cookie: ${csrf || "None"}`,
				"success",
			);
		} catch (err: any) {
			addLog(
				"Login Error",
				err.response?.data?.message || err.message,
				"error",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleFetchMe = async () => {
		addLog(
			"GET /administrators/me",
			"Sending request with Authorization Bearer header...",
			"info",
		);
		try {
			const res = await api.get("/administrators/me");
			addLog(
				"Fetch /administrators/me Success",
				JSON.stringify(res.data, null, 2),
				"success",
			);
		} catch (err: any) {
			addLog(
				"Fetch /administrators/me Error",
				err.response?.data?.message || err.message,
				"error",
			);
		}
	};

	const handleRefreshToken = async () => {
		const csrf = getCsrfToken();
		addLog(
			"GET /auth/refresh-token",
			`Sending request using refreshToken httpOnly cookie & x-csrf-token header (${csrf || "missing"})...`,
			"info",
		);
		try {
			const res = await api.get<{ accessToken: string }>(
				"/auth/refresh-token",
			);
			addLog(
				"Token Refresh Success",
				`New accessToken: ${res.data.accessToken.substring(0, 20)}...`,
				"success",
			);
		} catch (err: any) {
			addLog(
				"Token Refresh Error",
				err.response?.data?.message || err.message,
				"error",
			);
		}
	};

	const handleSimulate401AndRefresh = async () => {
		addLog(
			"Simulate 401 Interception",
			"Corrupting token in memory to 'invalid_expired_token' and calling GET /administrators/me...",
			"warn",
		);
		setAccessToken("invalid_expired_token");

		try {
			const res = await api.get("/administrators/me");
			addLog(
				"401 Interception & Refresh Success!",
				`axios-auth-refresh automatically intercepted 401, refreshed access token via /auth/refresh-token, and re-fetched /administrators/me! Output:\n${JSON.stringify(res.data, null, 2)}`,
				"success",
			);
		} catch (err: any) {
			addLog(
				"401 Interception Failed",
				err.response?.data?.message || err.message,
				"error",
			);
		}
	};

	const handleLogout = async () => {
		if (authCtx) {
			await authCtx.logout();
			setAccessToken(undefined);
			addLog(
				"Logout",
				"Cleared cookies, access token, and administrator profile on server & client.",
				"info",
			);
		}
	};

	const csrfToken = getCsrfToken();

	return (
		<Box
			minH="100vh"
			bg="gray.950"
			color="gray.100"
			p={{ base: "4", md: "8" }}
		>
			<Stack gap="6" maxW="1200px" mx="auto">
				{/* Top Bar Header */}
				<Flex
					justify="space-between"
					align="center"
					wrap="wrap"
					gap="4"
				>
					<Box>
						<HStack gap="3">
							<Heading size="xl">Auth Testing Lab</Heading>
							<Badge
								colorPalette={authCtx?.token ? "green" : "red"}
								variant="solid"
								size="lg"
							>
								{authCtx?.token
									? "Authenticated"
									: "Unauthenticated"}
							</Badge>
							{authCtx?.isLoading && (
								<Badge colorPalette="blue" variant="outline">
									Loading...
								</Badge>
							)}
						</HStack>
						<Text fontSize="sm" color="gray.400" mt="1">
							Test login, token interceptors, CSRF cookie
							handling, `/administrators/me`, and automatic 401
							token refresh.
						</Text>
					</Box>

					<HStack gap="2">
						<Button variant="outline" size="sm" asChild>
							<RouterLink to="/login">Login Page</RouterLink>
						</Button>
						<Button variant="outline" size="sm" asChild>
							<RouterLink to="/register">
								Register Page
							</RouterLink>
						</Button>
						<Button variant="outline" size="sm" asChild>
							<RouterLink to="/dashboard">Dashboard</RouterLink>
						</Button>
					</HStack>
				</Flex>

				<Separator borderColor="gray.800" />

				{/* State Cards Grid */}
				<SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
					{/* Card 1: Access Token */}
					<Box
						borderWidth="1px"
						borderColor="gray.800"
						p="4"
						borderRadius="md"
						bg="gray.900"
					>
						<HStack justify="space-between" mb="2">
							<Text
								fontSize="xs"
								fontWeight="bold"
								color="gray.400"
								textTransform="uppercase"
							>
								Access Token
							</Text>
							<Icon as={LuKey} color="yellow.400" />
						</HStack>
						{authCtx?.token ? (
							<Stack gap="1">
								<Badge colorPalette="green" w="fit-content">
									Present
								</Badge>
								<Code
									fontSize="xs"
									p="2"
									borderRadius="sm"
									wordBreak="break-all"
									maxH="80px"
									overflowY="auto"
								>
									{authCtx.token}
								</Code>
							</Stack>
						) : (
							<Text fontSize="sm" color="gray.500">
								No access token in state
							</Text>
						)}
					</Box>

					{/* Card 2: CSRF Cookie */}
					<Box
						borderWidth="1px"
						borderColor="gray.800"
						p="4"
						borderRadius="md"
						bg="gray.900"
					>
						<HStack justify="space-between" mb="2">
							<Text
								fontSize="xs"
								fontWeight="bold"
								color="gray.400"
								textTransform="uppercase"
							>
								CSRF Token Cookie
							</Text>
							<Icon as={LuShieldCheck} color="cyan.400" />
						</HStack>
						{csrfToken ? (
							<Stack gap="1">
								<Badge colorPalette="cyan" w="fit-content">
									httpOnly=false
								</Badge>
								<Code
									fontSize="xs"
									p="2"
									borderRadius="sm"
									wordBreak="break-all"
									maxH="80px"
									overflowY="auto"
								>
									{csrfToken}
								</Code>
							</Stack>
						) : (
							<Text fontSize="sm" color="gray.500">
								No CSRF token cookie found in document.cookie
							</Text>
						)}
					</Box>

					{/* Card 3: Administrator Profile */}
					<Box
						borderWidth="1px"
						borderColor="gray.800"
						p="4"
						borderRadius="md"
						bg="gray.900"
					>
						<HStack justify="space-between" mb="2">
							<Text
								fontSize="xs"
								fontWeight="bold"
								color="gray.400"
								textTransform="uppercase"
							>
								Current Profile (`/administrators/me`)
							</Text>
							<Icon as={LuUserCheck} color="purple.400" />
						</HStack>
						{authCtx?.profile ? (
							<Stack gap="1">
								<Text fontSize="sm" fontWeight="bold">
									{authCtx.profile.firstName}{" "}
									{authCtx.profile.lastName}
								</Text>
								<Text fontSize="xs" color="gray.400">
									{authCtx.profile.email}
								</Text>
								<Text fontSize="xs" color="gray.500">
									ID: {authCtx.profile.administratorId} |
									Condominiums:{" "}
									{authCtx.profile.condominiums?.length ?? 0}
								</Text>
							</Stack>
						) : (
							<Text fontSize="sm" color="gray.500">
								No profile loaded
							</Text>
						)}
					</Box>
				</SimpleGrid>

				{/* Actions and Logs Split */}
				<SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
					{/* Left: Test Controls */}
					<Stack gap="4">
						{/* Form Box: Login Credentials */}
						<Box
							borderWidth="1px"
							borderColor="gray.800"
							p="5"
							borderRadius="md"
							bg="gray.900"
						>
							<Heading size="sm" mb="4">
								1. Test Login (`POST /auth/login`)
							</Heading>
							<Stack gap="3">
								<Field label="Email">
									<Input
										size="sm"
										value={email}
										onChange={(e) =>
											setEmail(e.target.value)
										}
										placeholder="mario.rossi@example.com"
									/>
								</Field>
								<Field label="Password">
									<PasswordInput
										size="sm"
										value={password}
										onChange={(e) =>
											setPassword(e.target.value)
										}
										placeholder="PasswordSicura123!"
									/>
								</Field>
								<Button
									size="sm"
									colorPalette="blue"
									loading={isSubmitting}
									onClick={handleLogin}
								>
									<Icon as={LuLogIn} /> Submit Login
								</Button>
							</Stack>
						</Box>

						{/* Interceptor Actions Box */}
						<Box
							borderWidth="1px"
							borderColor="gray.800"
							p="5"
							borderRadius="md"
							bg="gray.900"
						>
							<Heading size="sm" mb="4">
								2. Test Interceptors & Endpoints
							</Heading>
							<Stack gap="3">
								<Button
									size="sm"
									variant="outline"
									justifyContent="start"
									onClick={handleFetchMe}
								>
									<Icon as={LuUserCheck} color="purple.400" />
									GET /administrators/me (Auto attach Bearer
									token)
								</Button>

								<Button
									size="sm"
									variant="outline"
									justifyContent="start"
									onClick={handleRefreshToken}
								>
									<Icon as={LuRefreshCw} color="cyan.400" />
									GET /auth/refresh-token (Send httpOnly
									cookie + CSRF header)
								</Button>

								<Button
									size="sm"
									colorPalette="yellow"
									variant="subtle"
									justifyContent="start"
									onClick={handleSimulate401AndRefresh}
								>
									<Icon as={LuZap} color="yellow.400" />
									Simulate Invalid Token & Auto 401 Intercept
									Refresh
								</Button>

								<Button
									size="sm"
									colorPalette="red"
									variant="outline"
									justifyContent="start"
									onClick={handleLogout}
								>
									<Icon as={LuLogOut} />
									Logout (Clear State)
								</Button>
							</Stack>
						</Box>
					</Stack>

					{/* Right: Live Request / Interceptor Log */}
					<Box
						borderWidth="1px"
						borderColor="gray.800"
						p="5"
						borderRadius="md"
						bg="gray.900"
						display="flex"
						flexDirection="column"
						maxH="520px"
					>
						<Flex justify="space-between" align="center" mb="3">
							<HStack gap="2">
								<Heading size="sm">
									Live Console / Interceptor Logs
								</Heading>
								<Badge variant="subtle" colorPalette="gray">
									{logs.length} entries
								</Badge>
							</HStack>
							{logs.length > 0 && (
								<Button
									size="xs"
									variant="ghost"
									colorPalette="gray"
									onClick={() => setLogs([])}
								>
									<Icon as={LuTrash2} /> Clear
								</Button>
							)}
						</Flex>

						<Box
							flex="1"
							overflowY="auto"
							bg="black"
							p="3"
							borderRadius="sm"
							fontFamily="mono"
							fontSize="xs"
							borderWidth="1px"
							borderColor="gray.800"
						>
							{logs.length === 0 ? (
								<Text color="gray.600" fontStyle="italic">
									No actions performed yet. Click any button
									on the left to see requests and interceptors
									in action.
								</Text>
							) : (
								<Stack gap="2">
									{logs.map((log) => (
										<Box
											key={log.id}
											p="2"
											borderRadius="xs"
											borderLeftWidth="3px"
											borderLeftColor={
												log.type === "success"
													? "green.400"
													: log.type === "error"
														? "red.400"
														: log.type === "warn"
															? "yellow.400"
															: "blue.400"
											}
											bg="gray.950"
										>
											<HStack
												justify="space-between"
												mb="1"
											>
												<HStack gap="1.5">
													<Icon
														as={
															log.type ===
															"success"
																? LuCheck
																: log.type ===
																	  "error"
																	? LuX
																	: LuRefreshCw
														}
														color={
															log.type ===
															"success"
																? "green.400"
																: log.type ===
																	  "error"
																	? "red.400"
																	: log.type ===
																		  "warn"
																		? "yellow.400"
																		: "blue.400"
														}
													/>
													<Text
														fontWeight="bold"
														color="gray.200"
													>
														[{log.action}]
													</Text>
												</HStack>
												<Text
													color="gray.500"
													fontSize="10px"
												>
													{log.time}
												</Text>
											</HStack>
											<Text
												whiteSpace="pre-wrap"
												color="gray.300"
											>
												{log.details}
											</Text>
										</Box>
									))}
								</Stack>
							)}
						</Box>
					</Box>
				</SimpleGrid>
			</Stack>
		</Box>
	);
}
