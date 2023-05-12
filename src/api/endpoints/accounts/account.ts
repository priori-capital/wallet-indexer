import { idb } from "@/common/db";
import { logger } from "@/common/logger";
import { Request, ResponseToolkit, RouteOptions } from "@hapi/hapi";
import axios from "axios";
import Joi from "joi";
import moment from "moment";
import jwt from "jsonwebtoken";
import { config } from "@/config/index";
import { WebhookEventTypes } from "@/common/webhook";

export interface RegisterAppDto {
  name: string;
  email: string;
  webhookUrl: string;
  webhookAuthKey: string;
}

export const registerApp: RouteOptions = {
  validate: {
    payload: Joi.object({
      name: Joi.string().min(3).required(),
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .required(),
      webhookUrl: Joi.string().uri().required(),
      webhookAuthKey: Joi.string().min(8).required(),
    }),
  },
  auth: "webhook_server",
  handler: async (request: Request, h) => {
    const data = request.payload as RegisterAppDto;

    try {
      const isValidWebhook = await validateWebhook(data.webhookUrl, data.webhookAuthKey);
      if (isValidWebhook) {
        const account = await idb.oneOrNone(`
          INSERT INTO accounts (name, email, webhook_url, webhook_auth_key)
          VALUES('${data.name}', '${data.email}', '${data.webhookUrl}', '${data.webhookAuthKey}')
          RETURNING id
        `);

        if (account?.id) {
          const secretKey = jwt.sign({ id: account.id }, config.jwtSecret, {
            issuer: "iss:indexer",
          });
          await idb.none(
            `UPDATE accounts SET secret_key = '${secretKey}' WHERE id = ${account.id}`
          );

          const respData = { id: account.id, name: data.name, secretKey: secretKey };
          return h.response({ statusCode: 200, data: respData, message: "Ok" }).code(200);
        }

        return h.response({ statusCode: 500, message: "Something went wrong." }).code(500);
      }

      return h.response({ statusCode: 400, message: "Webhook URL is not valid." }).code(400);
    } catch (error) {
      logger.error(`register-app`, `Handler failure: ${error}`);
      throw error;
    }
  },
};

export const updateApp: RouteOptions = {
  validate: {
    payload: Joi.object({
      name: Joi.string().min(3).required(),
      webhookUrl: Joi.string().uri().required(),
      webhookAuthKey: Joi.string().min(8).required(),
    }),
  },
  auth: "webhook_client_auth",
  handler: async (request: Request, h: ResponseToolkit) => {
    try {
      const data = request.payload as RegisterAppDto;
      const accountId = request.auth.credentials.id;

      const isValidWebhook = await validateWebhook(data.webhookUrl, data.webhookAuthKey);
      if (isValidWebhook) {
        await idb.none(`
          UPDATE accounts SET 
            name = '${data.name}', 
            webhook_url = '${data.webhookUrl}', 
            webhook_auth_key = '${data.webhookAuthKey}'
          WHERE id = ${accountId}
        `);

        return h.response({ statusCode: 200, data, message: "Ok" }).code(200);
      }

      return h.response({ statusCode: 400, message: "Webhook URL is not valid." }).code(400);
    } catch (error) {
      logger.error(`register-app`, `Handler failure: ${error}`);
      throw error;
    }
  },
};

async function validateWebhook(url: string, authKey: string): Promise<boolean> {
  try {
    const payload = {
      event: WebhookEventTypes.HEALTH_CHECK,
      timestamp: moment().format("YYYY-MM-DD HH:MM:SS"),
      data: null,
    };
    const resp = await axios.post(url, payload, {
      headers: { Authorization: authKey },
    });
    return resp.status === 200;
  } catch (err) {
    return false;
  }
}
