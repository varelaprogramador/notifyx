import { type NextRequest, NextResponse } from "next/server";
import {
  getAutomationByPath,
  executeWebhookAutomation,
} from "@/app/actions/automation-actions";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string } }
) {
  const path = params.path;

  try {
    logger.info(`Webhook received for path: ${path}`);

    // Get the automation by path
    const automation = await getAutomationByPath(path);

    if (!automation) {
      logger.warn(`No automation found for path: ${path}`);
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Check if the automation is active
    const isActive =
      automation.is_active !== undefined
        ? automation.is_active
        : automation.active !== undefined
        ? automation.active
        : false;

    if (!isActive) {
      logger.warn(`Automation for path ${path} is inactive`);
      return NextResponse.json(
        { error: "Webhook is inactive" },
        { status: 403 }
      );
    }

    // Verify secret if provided
    const secret =
      automation.trigger_config?.secret || automation.config?.secret;

    if (secret) {
      const providedSecret = request.headers.get("x-webhook-secret");

      if (providedSecret !== secret) {
        logger.warn(`Invalid secret provided for path: ${path}`);
        return NextResponse.json(
          { error: "Invalid webhook secret" },
          { status: 401 }
        );
      }
    }

    // Parse the payload
    const payload = await request.json();

    // Execute the automation
    const result = await executeWebhookAutomation(automation, payload);

    if (result.success) {
      return NextResponse.json(
        { message: result.message, details: result.details },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: result.message, details: result.details },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error(`Error processing webhook for path ${path}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
