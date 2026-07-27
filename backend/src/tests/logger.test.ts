import "./testHelpers";
import { logger } from "@middleware/loggerMW";

describe("Logger HTTP Level", () => {
	it("has http method defined on logger mock", () => {
		expect(typeof logger.http).toBe("function");
	});
});
