import { Worker, Job } from "bullmq";
import bullmqConnection from "@config/bullmq.config.js";
import transporter from "@config/mailer.config.js";
import logger from "@utils/logger.utils.js";
import { EmailJobData } from "@queues/email.queue.js";
import { contactNewTemplate } from "@templates/email/newContact.email";
import {
  applicationNewAdminTemplate,
  applicationConfirmationTemplate,
} from "@templates/email/newApplication.email.js";
import { applicationStatusTemplate } from "@templates/email/applicationStatus.email.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const SMTP_FROM = `"FinVault" <${process.env.SMTP_USER}>`;

const processEmailJob = async (job: Job<EmailJobData>) => {
  const { data } = job;

  switch (data.type) {
    // New contact inquiry then notify admin
    case "contact.new": {
      const template = contactNewTemplate(data.payload);
      await transporter.sendMail({
        from: SMTP_FROM,
        to: ADMIN_EMAIL,
        subject: template.subject,
        html: template.html,
      });
      logger.info(`[email.worker] contact.new sent to admin`);
      break;
    }

    // New application then notify admin + confirm to applicant 
    case "application.new": {
      const adminTemplate = applicationNewAdminTemplate(data.payload);
      const confirmTemplate = applicationConfirmationTemplate({
        applicantName: data.payload.applicantName,
        jobTitle: data.payload.jobTitle,
      });

      await Promise.all([
        transporter.sendMail({
          from: SMTP_FROM,
          to: ADMIN_EMAIL,
          subject: adminTemplate.subject,
          html: adminTemplate.html,
        }),
        transporter.sendMail({
          from: SMTP_FROM,
          to: data.payload.applicantEmail,
          subject: confirmTemplate.subject,
          html: confirmTemplate.html,
        }),
      ]);
      logger.info(
        `[email.worker] application.new — admin notified, confirmation sent to ${data.payload.applicantEmail}`
      );
      break;
    }

    // Application status changed then notify applicant
    case "application.status_changed": {
      const template = applicationStatusTemplate(data.payload);
      await transporter.sendMail({
        from: SMTP_FROM,
        to: data.payload.applicantEmail,
        subject: template.subject,
        html: template.html,
      });
      logger.info(
        `[email.worker] application.status_changed — admin notified (${data.payload.oldStatus} → ${data.payload.newStatus})`
      );
      break;
    }

    default:
      logger.warn(`[email.worker] Unknown job type received`);
  }
};

// Worker 

const emailWorker = new Worker<EmailJobData>("email", processEmailJob, {
  connection: bullmqConnection,
  concurrency: 5, // process up to 5 email jobs in parallel
});

emailWorker.on("completed", (job) => {
  logger.info(`[email.worker] Job ${job.id} (${job.name}) completed`);
});

emailWorker.on("failed", (job, err) => {
  logger.error(
    `[email.worker] Job ${job?.id} (${job?.name}) failed — attempt ${job?.attemptsMade}: ${err.message}`
  );
});

emailWorker.on("error", (err) => {
  logger.error(`[email.worker] Worker error: ${err.message}`);
});

export default emailWorker;