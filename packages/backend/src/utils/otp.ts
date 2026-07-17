import crypto from "crypto";

const OTP_LENGTH = 6;

export function generateOTP(length: number = OTP_LENGTH): string {
  const digits = "0123456789";
  let otp = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % 10];
  }
  return otp;
}

export function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function verifyOTP(otp: string, hash: string): boolean {
  if (!otp || !hash) return false;
  return crypto.timingSafeEqual(Buffer.from(hashOTP(otp)), Buffer.from(hash));
}

export interface OtpChannel {
  email?: string;
  phone?: string;
}

export function sendOTP(otp: string, channel: OtpChannel): void {
  // Mock implementation — replace with SMS/email provider integration.
  if (channel.email) {
    console.log(`[OTP] Sending OTP ${otp} to email ${channel.email}`);
  }
  if (channel.phone) {
    console.log(`[OTP] Sending OTP ${otp} to phone ${channel.phone}`);
  }
  if (!channel.email && !channel.phone) {
    console.log(`[OTP] Generated OTP ${otp} (no delivery channel provided)`);
  }
}
