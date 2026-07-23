import app from "./app";
import { logger } from "@middleware/loggerMW";
import { SV_PORT } from "@utils/envVariables";

app.listen(SV_PORT, () => {
	logger.info(`Express is running on port ${SV_PORT}`);
});
