'use server'

import { createClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
        budget: formData.budget // Need to add column first
      }
    ])

  if (dbError) {
    console.error('DB Error:', dbError)
    return { success: false, error: dbError.message }
  }

  // Send Email
  try {
    const { error } = await resend.emails.send({
      from: 'Fortress <onboarding@resend.dev>',
      to: [formData.email],
      subject: 'Welcome to Fortress - Application Received',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Application Received</h1>
          <p>Hi ${formData.name},</p>
          <p>Thanks for your interest in Fortress. We have received your application with the following details:</p>
          <ul>
            <li><strong>Organization:</strong> ${formData.organization}</li>
            <li><strong>Role:</strong> ${formData.role}</li>
            <li><strong>Sector:</strong> ${formData.sector}</li>
            <li><strong>Budget Range:</strong> ${formData.budget}</li>
          </ul>
          <p>Our team will review your application and get back to you shortly.</p>
          <p>Best regards,<br>The Fortress Team</p>
        </div>
      `
    })

    if (error) {
      console.error('Email Error:', error)
      return { success: true, warning: 'Email functionality limited' } // Still success for user
    }

    return { success: true }
  } catch (error) {
    console.error('Email Exception:', error)
    return { success: true, warning: 'Email failed' }
  }
}
