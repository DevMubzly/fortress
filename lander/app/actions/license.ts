'use server';

import { PRIVATE_KEY } from '@/lib/keys';
import crypto from 'crypto';

export async function generateLicenseAction(data: any) {
  try {
    const payload = {
      ...data,
      issuedAt: new Date().toISOString(),
      id: crypto.randomUUID(),
    };

    const payloadString = JSON.stringify(payload);
    
    // Sign the payload
    const sign = crypto.createSign('SHA256');
    sign.update(payloadString);
    sign.end();
    
    // Ensure we have a valid key format, usually simple replace helps if key format is messy from generation
    const cleanKey = PRIVATE_KEY.trim();
    
    const signature = sign.sign({ key: cleanKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING }, 'base64');

    // Combine payload and signature
    const licenseData = {
      payload,
      signature,
      signedPayload: payloadString // Ensure verify can use exact string
    };

    // Base64 encode the whole thing to create the license key
    const licenseKey = Buffer.from(JSON.stringify(licenseData)).toString('base64');
    
    return { success: true, licenseKey, licenseId: payload.id };
  } catch (error: any) {
    console.error("License generation error:", error);
    return { success: false, error: error.message };
  }
}
