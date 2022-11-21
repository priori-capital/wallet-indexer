import "@/pubsub/channels";

// Import and subscribe to the following events
import { logger } from "@/common/logger";
import { redisSubscriber } from "@/common/redis";
import { config } from "@/config/index";
import { ApiKeyUpdatedEvent } from "@/pubsub/api-key-updated-event";
import { channels } from "@/pubsub/channels";
import { RateLimitUpdatedEvent } from "@/pubsub/rate-limit-updated-event";
import "@/pubsub/sources-updated-event";
import { SourcesUpdatedEvent } from "@/pubsub/sources-updated-event";
import _ from "lodash";

// Subscribe to all channels defined in the channels enum
redisSubscriber.subscribe(_.values(channels), (err, count) => {
  if (err) {
    logger.error("pubsub", `Failed to subscribe ${err.message}`);
  }

  logger.info("pubsub", `${config.railwayStaticUrl} subscribed to ${count} channels`);
});

redisSubscriber.on("message", async (channel, message) => {
  logger.info("pubsub", `Received message on channel ${channel}, message = ${message}`);

  switch (channel) {
    case channels.sourcesUpdated:
      await SourcesUpdatedEvent.handleEvent(message);
      break;

    case channels.apiKeyUpdated:
      await ApiKeyUpdatedEvent.handleEvent(message);
      break;

    case channels.rateLimitRuleUpdated:
      await RateLimitUpdatedEvent.handleEvent(message);
      break;
  }
});
