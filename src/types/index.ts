export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

export interface TimeSlotDisplay {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface CandidateWithAvailability {
  id: string;
  email: string;
  phone: string;
  name: string | null;
  status: string;
  currentWindow: {
    id: string;
    weekStart: string;
    weekEnd: string;
    status: string;
    submittedAt: string | null;
    timeSlots: TimeSlotDisplay[];
  } | null;
}

export interface DayAvailability {
  date: string;
  dayName: string;
  slots: { startTime: string; endTime: string }[];
  totalHours: number;
  isValid: boolean;
  isLocked: boolean;
}
