import chalk from "chalk";
import pino from "pino";
import { pinoHttp } from "pino-http";

export const logger = pino({
	level: process.env.LOG_LEVEL || "info",
	transport: {
		target: "pino-pretty",
		options: {
			customColors: {
				default: "white",
				60: "bgRed", // fatal
				50: "red", // error
				40: "yellow", // warn
				30: "green", // info
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
	useLevel: "debug",
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
