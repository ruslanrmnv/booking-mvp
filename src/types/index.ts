export type Service = {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;    // cents
};

export type TimeSlot = {
  time: string;     // "HH:MM"
  available: boolean;
};

export type Booking = {
  id: string;
  customerName: string;
  customerEmail: string;
  email: string;
  phone?: string | null;  // optional, nullable text column
  serviceId: string;
  date: string;       // "YYYY-MM-DD"
  time: string;       // "HH:MM"
  booking_time: string; // ISO timestamptz, e.g. "2026-06-18T10:00:00"
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
};
