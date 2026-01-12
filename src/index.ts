import { config } from "./config/env";
import { logger } from "./application/logging";
import { webApp } from "./application/server";

const app = webApp

app.listen(config.APP_PORT, () => {
  logger.info(`🚀 Server running on port ${config.APP_PORT}`);
});
