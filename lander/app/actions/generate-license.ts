"use server";

import { PRIVATE_KEY } from "@/lib/keys";
import { createClient } from "@/lib/supabase-server";
import crypto from "crypto";

export async function generateLicenseAction(data: {
  organization: string;
  tier: string;
  features: string[];
  maxUsers: number;
  validityDays: number;
}) {
  try {
    const issuedAt = new Date().toISOString();
    const validUntil = new Date(Date.now() + data.validityDays * 86400000).toISOString();
    const licenseId = `lic_${crypto.randomBytes(8).toString("hex")}`;

    const payload = {
      id: licenseId,
      organization: data.organization,
      tier: data.tier,
      features: data.features,
      maxUsers: data.maxUsers,
      validUntil,
      issuedAt,
    };

    // Canonical JSON string for signing (ensure consistent key order if needed, but JSON.stringify is usually sufficient if verification parses it identically)
    const signedPayloadStr = JSON.stringify(payload);

    const sign = crypto.createSign("SHA256");
    sign.update(signedPayloadStr);
    sign.end();

    const signature = sign.sign({
      key: PRIVATE_KEY,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN, // Use max salt length for PSS
    });

    const signatureB64 = signature.toString("base64");

    const finalLicense = {
      signedPayload: signedPayloadStr, // Include the string that was signed to avoid JSON parsing discrepancies
      signature: signatureB64,
      ...payload, // Include raw fields for easy reading by humans if needed, though verification uses signedPayload
    };

    // Return the base64 encoded license file content
    const licenseFileContent = Buffer.from(JSON.stringify(finalLicense)).toString("base64");

    // Save to Supabase
    const supabase = await createClient();
    const { error } = await supabase.from('licenses').insert({
      id: licenseId,
      organization: data.organization,
      tier: data.tier,
      features: data.features,
      max_users: data.maxUsers,
      valid_until: validUntil,
      issued_at: issuedAt,
      revoked: false,
      active: true,
      raw_license: licenseFileContent
    });

    if (error) {
       console.error("Failed to persist license:", error);
       return { success: false, error: "Database error: " + error.message };
    }

    return { success: true, license: licenseFileContent };
  } catch (error) {
    console.error("License generation failed:", error);
    return { success: false, error: "Failed to generate license" };
  }
}
