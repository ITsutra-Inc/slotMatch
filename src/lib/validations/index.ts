import { z } from "zod";

export const createCandidateSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().default(""),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

export const timeSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:MM"),
});

export const submitAvailabilitySchema = z.object({
  slots: z.array(timeSlotSchema).min(1, "At least one time slot is required"),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  scopes: z.array(z.string()).optional(),
  expiresInDays: z.number().positive().optional(),
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type TimeSlotInput = z.infer<typeof timeSlotSchema>;
export type SubmitAvailabilityInput = z.infer<typeof submitAvailabilitySchema>;
export const updateScheduleSchema = z.object({
  enabled: z.boolean(),
  requestDays: z.array(z.number().int().min(0).max(6)).min(1, "Select at least one day"),
  requestHour: z.number().int().min(0).max(23),
  requestMinute: z.number().int().min(0).max(59),
  reminderIntervalHours: z.number().int().min(1).max(12),
  reminderStartHour: z.number().int().min(0).max(23),
  reminderEndHour: z.number().int().min(0).max(23),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
