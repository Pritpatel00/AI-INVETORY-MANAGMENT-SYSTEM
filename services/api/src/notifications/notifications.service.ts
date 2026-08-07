import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { EmailDeliveryStatus, ReorderStatus } from "@prisma/client";
import { Queue, Worker, type ConnectionOptions, type Job } from "bullmq";
import * as nodemailer from "nodemailer";

import { PrismaService } from "../prisma/prisma.service";

const queueName = "reorder-supplier-email";

@Injectable()
export class NotificationQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private queue: Queue<{ draftId: string }> | null = null;
  private worker: Worker<{ draftId: string }> | null = null;
  private readonly connection: ConnectionOptions = {
    host: process.env.VALKEY_HOST ?? "127.0.0.1",
    port: Number(process.env.VALKEY_PORT ?? 6379),
    maxRetriesPerRequest: null,
  };
  private readonly transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "127.0.0.1",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_SECURE === "true",
  });

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const queue = new Queue<{ draftId: string }>(queueName, {
      connection: this.connection,
    });
    const worker = new Worker<{ draftId: string }>(
      queueName,
      (job) => this.deliverReorderEmail(job),
      {
        connection: this.connection,
        concurrency: 2,
      },
    );
    worker.on("error", () => undefined);
    worker.on("failed", () => undefined);

    try {
      await Promise.race([
        queue.waitUntilReady(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Notification queue connection timed out.")),
            5_000,
          ),
        ),
      ]);
      this.queue = queue;
      this.worker = worker;
      const queuedDrafts = await this.prisma.reorderDraft.findMany({
        where: { emailStatus: EmailDeliveryStatus.QUEUED },
        select: { id: true },
      });
      for (const draft of queuedDrafts) {
        await this.enqueueReorderEmail(draft.id);
      }
    } catch {
      await worker.close(true).catch(() => undefined);
      await queue.close().catch(() => undefined);
    }
  }

  async onModuleDestroy() {
    await this.worker?.close(true).catch(() => undefined);
    await this.queue?.close().catch(() => undefined);
  }

  async enqueueReorderEmail(draftId: string, retry = false) {
    if (!this.queue) {
      throw new ServiceUnavailableException(
        "The notification queue is unavailable. Start Valkey and retry.",
      );
    }
    const draft = await this.prisma.reorderDraft.findUnique({
      where: { id: draftId },
      select: { status: true, emailStatus: true },
    });
    if (!draft) {
      throw new NotFoundException("Reorder draft not found.");
    }
    if (draft.status !== ReorderStatus.APPROVED) {
      throw new ConflictException(
        "Only approved reorder drafts can have their supplier email queued.",
      );
    }
    if (draft.emailStatus === EmailDeliveryStatus.SENT && !retry) {
      throw new ConflictException(
        "The supplier email for this draft was already sent.",
      );
    }

    // Mark the draft as queued so the delivery worker knows to send it, then
    // add the job. A previously failed delivery is requeued for retry.
    const queuedDraft = await this.prisma.reorderDraft.update({
      where: { id: draftId },
      data: {
        emailStatus: EmailDeliveryStatus.QUEUED,
        emailQueuedAt: new Date(),
        emailError: null,
      },
    });

    const jobId = `reorder-${draftId}`;
    const existing = await this.queue.getJob(jobId);
    if (existing) {
      const state = await existing.getState();
      if (state === "failed" && retry) {
        await existing.retry();
        return queuedDraft;
      }
      if (state === "completed") {
        await existing.remove();
      } else {
        return queuedDraft;
      }
    }
    await this.queue.add(
      "send-reorder-email",
      { draftId },
      {
        jobId,
        attempts: 3,
        backoff: { type: "exponential", delay: 1_000 },
        removeOnComplete: { age: 3_600 },
        removeOnFail: false,
      },
    );
    return queuedDraft;
  }

  private async deliverReorderEmail(job: Job<{ draftId: string }>) {
    const draft = await this.prisma.reorderDraft.findUnique({
      where: { id: job.data.draftId },
      include: { product: true, location: true },
    });
    if (!draft) return;
    if (draft.status !== ReorderStatus.APPROVED) return;
    if (
      draft.emailStatus !== EmailDeliveryStatus.QUEUED &&
      draft.emailStatus !== EmailDeliveryStatus.FAILED
    ) {
      return;
    }
    if (!draft.product.supplierEmail) {
      throw new Error("The approved supplier email is missing.");
    }

    try {
      await this.transporter.sendMail({
        from:
          process.env.SMTP_FROM ??
          "Nirka Inventory <inventory@nirka.local>",
        to: draft.product.supplierEmail,
        subject: `Purchase order request: ${draft.product.name}`,
        text: [
          `Supplier: ${draft.product.supplierName ?? "Approved supplier"}`,
          `Product: ${draft.product.name} (${draft.product.sku})`,
          `Warehouse location: ${draft.location.name}`,
          `Current available stock: ${draft.currentStock}`,
          `Safety stock: ${draft.safetyStock}`,
          `Requested quantity: ${draft.suggestedQuantity}`,
          `Draft reference: PO-${draft.id.slice(0, 8).toUpperCase()}`,
          "",
          "This message was approved by an authorized Nirka inventory manager.",
        ].join("\n"),
      });
      await this.prisma.reorderDraft.update({
        where: { id: draft.id },
        data: {
          status: ReorderStatus.SENT,
          activeKey: null,
          emailStatus: EmailDeliveryStatus.SENT,
          emailSentAt: new Date(),
          emailAttempts: { increment: 1 },
          emailError: null,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message.slice(0, 500) : "SMTP failed.";
      await this.prisma.reorderDraft.update({
        where: { id: draft.id },
        data: {
          emailStatus: EmailDeliveryStatus.FAILED,
          emailAttempts: { increment: 1 },
          emailError: message,
        },
      });
      throw error;
    }
  }
}
