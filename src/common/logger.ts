import winston, { createLogger, transports } from "winston";
import winstoner from "@newrelic/winston-enricher";
import { getServiceName } from "@/config/network";

import { networkInterfaces } from "os";

/* eslint-disable @typescript-eslint/no-explicit-any */
const nets: any = networkInterfaces();
/* eslint-disable @typescript-eslint/no-explicit-any */
const results: any = {};

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    if (net.family === "IPv4" && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);
    }
  }
}

const log = (level: "error" | "info" | "warn") => {
  const service = getServiceName();
  const nrWinston = winstoner(winston);
  const logger = createLogger({
    levels: {
      fatal: 0,
      error: 1,
      warn: 2,
      info: 3,
      trace: 4,
      debug: 5,
    },
    exitOnError: false,
    format: nrWinston(),
    transports: [
      process.env.DATADOG_API_KEY
        ? new transports.Http({
            host: "http-intake.logs.datadoghq.com",
            path: `/api/v2/logs?dd-api-key=${process.env.DATADOG_API_KEY}&ddsource=nodejs&service=${service}`,
            ssl: true,
          })
        : // Fallback to logging to standard output
          new winston.transports.Console(),
    ],
  });

  return (component: string, message: string) =>
    logger.log(level, message, {
      component,
      version: process.env.npm_package_version,
      networkInterfaces: results,
      railwaySnapshotId: process.env.RAILWAY_SNAPSHOT_ID,
    });
};

export const logger = {
  error: log("error"),
  info: log("info"),
  warn: log("warn"),
};
