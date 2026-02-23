'use server';

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const adminEmail = process.env.ADMIN_EMAIL || 'admin@fortress.tech'; 

// Initialize Supabase Admin client for secure server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type ContactFormData = {
  name: string;
  email: string;
  phone: string;
  organization: string;
  role: string;
  useCase: string;
  sector: string;
};

export async function submitContact(formData: ContactFormData) {
  try {
    // 1. Send Email Notification via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Fortress Sales <onboarding@resend.dev>', // Update with verified domain
      to: adminEmail,
      subject: `New Sales Inquiry: ${formData.organization}`,
      html: `
        <h1>New Lead via Contact Form</h1>
        <p><strong>Name:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Phone:</strong> ${formData.phone}</p>
        <p><strong>Organization:</strong> ${formData.organization}</p>
        <p><strong>Role:</strong> ${formData.role}</p>
        <p><strong>Sector:</strong> ${formData.sector}</p>
        <p><strong>Use Case:</strong></p>
        <p>${formData.useCase}</p>
        <hr />
        <p><em>Sent via Fortress Landing Page</em></p>
      `
    });

    if (emailError) {
      console.error('Resend Error:', emailError);
      // We might want to continue to DB insertion even if email fails, or throw.
      // For now, log it.
    }

    // 2. Insert into Supabase (Admin Backend)
    const nameParts = formData.name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    const { error: dbError } = await supabase.from('leads').insert({
      first_name: firstName,
      last_name: lastName,
      work_email: formData.email,
      company_name: formData.organization,
      role: formData.role,
      phone: formData.phone,
      sector: formData.sector,
      message: formData.useCase,
      status: 'new',
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error('Supabase Error:', dbError);
      return { success: false, error: 'Database insertion failed' };
    }

    return { success: true };

  } catch (error) {
    console.error('Submission Error:', error);
    return { success: false, error: 'Internal server error' };
  }
}
