'use server'

import { createClient } from '@/lib/supabase'
import { Resend } from 'resend'
import { ContactEmailTemplate } from '@/lib/emails/contact-template'

const resendApiKey = process.env.RESEND_API_KEY || process.env.NEXT_RESEND_API_KEY;
const resend = new Resend(resendApiKey)

export async function submitContact(formData: {
  name: string
  email: string
  phone: string
  organization: string
  role: string
  useCase: string
  sector: string
  budget: string
}) {
  const supabase = createClient()
  
  // Insert into DB
  const { error: dbError } = await supabase
    .from('leads')
    .insert([
      {
        first_name: formData.name.split(' ')[0],
        last_name: formData.name.split(' ').slice(1).join(' '),
        work_email: formData.email,
        phone: formData.phone,
        company_name: formData.organization,
        role: formData.role,
        message: formData.useCase,
        sector: formData.sector,
        // budget: formData.budget // Add column if needed
      }
    ])

  if (dbError) {
    console.error('DB Error:', dbError)
    // Don't fail the user request if it's just DB logging, but maybe we should?
    // User requested "implement emails", so prioritize that.
  }

  // Send Email
  try {
    if (!resendApiKey) {
        console.warn('Resend API Key is missing');
        return { success: true, warning: 'Email configuration missing' };
    }

    const { data: emailData, error } = await resend.emails.send({
      from: 'Fortress <onboarding@fortress-stack.tech>',
      to: [formData.email], // Send to the person applying
      subject: 'Welcome to Fortress - Application Received',
      html: ContactEmailTemplate({
        name: formData.name,
        organization: formData.organization,
        role: formData.role,
        sector: formData.sector,
        budget: formData.budget
      })
    })

    if (error) {
      console.error('Email Error:', error)
      return { success: true, warning: 'Email functionality limited' } 
    }

    return { success: true }
  } catch (error) {
    console.error('Email Exception:', error)
    return { success: true, warning: 'Email failed' }
  }
}
