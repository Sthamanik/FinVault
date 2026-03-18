import { Queue } from "bullmq";
import bullmqConnection from "@config/bullmq.config.js";

export interface ContactNewJobData {
  type: "contact.new";
  to: string; // admin email
  payload: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  };
}

export interface ApplicationNewJobData {
  type: "application.new";
  payload: {
    applicantName: string;
    applicantEmail: string;
    phone?: string;
    jobTitle: string;
    jobId: string;
    coverLetter?: string;
  };
}

export interface ApplicationStatusJobData {
  type: "application.status_changed";
  payload: {
    applicantName: string;
    applicantEmail: string;
    jobTitle: string;
    oldStatus: string;
    newStatus: string;
    applicationId: string;
  };
}

export type EmailJobData =
  | ContactNewJobData
  | ApplicationNewJobData
  | ApplicationStatusJobData;


const emailQueue = new Queue<EmailJobData>("email", {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,                          
    backoff: { type: "exponential", delay: 5000 }, 
    removeOnComplete: { count: 100 },     
    removeOnFail: { count: 200 },         
  },
});


export const enqueueContactNotification = async (
  data: ContactNewJobData["payload"]
) => {
  await emailQueue.add("contact.new", {
    type: "contact.new",
    to: process.env.ADMIN_EMAIL!,
    payload: data,
  });
};

export const enqueueApplicationNotification = async (
  data: ApplicationNewJobData["payload"]
) => {
  await emailQueue.add("application.new", {
    type: "application.new",
    payload: data,
  });
};

export const enqueueApplicationStatusNotification = async (
  data: ApplicationStatusJobData["payload"]
) => {
  await emailQueue.add("application.status_changed", {
    type: "application.status_changed",
    payload: data,
  });
};

export default emailQueue;