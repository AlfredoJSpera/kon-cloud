import "dotenv/config";
import chalk from "chalk";
import pino from "pino";
import { pinoHttp } from "pino-http";
import { SV_LOG_LEVEL } from "@utils/envVariables";

export const logger = pino({
	level: SV_LOG_LEVEL,
	customLevels: {
		http: 25,
	},
	transport: {
		target: "pino-pretty",
		options: {
			customLevels: "http:25",
			useOnlyCustomProps: false,
			customColors: {
				default: "white",
				60: "bgRed", // fatal
				50: "red", // error
				40: "yellow", // warn
				30: "green", // info
				25: "cyan", // http
				20: "blue", // debug
				10: "gray", // trace
				message: "reset",
				greyMessage: "gray",
			},
			colorize: true,
			translateTime: "SYS:standard",
			ignore: "pid,hostname,req,res,responseTime",
		},
	},
});

export const loggerHttp = pinoHttp({
	logger,
	useLevel: "http",
	customSuccessMessage: (req, res, responseTime) => {
		const status = res.statusCode;
		let statusColor = chalk.bgWhite;

		if (status >= 200 && status < 300) {
			statusColor = chalk.bgGreen;
		} else if (status >= 300 && status < 400) {
			statusColor = chalk.bgYellow;
		} else if (status >= 400 && status < 600) {
			statusColor = chalk.bgRed;
		}

		return `${chalk.bold(req.method)} ${chalk.underline(req.url)} ${statusColor(res.statusCode)} - ${responseTime}ms`;
	},
});
