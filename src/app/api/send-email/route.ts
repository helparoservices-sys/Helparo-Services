import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, html, template, variables } = body

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject' },
        { status: 400 }
      )
    }

    let emailHtml = html

    // If template is provided, load and process it
    if (template && !html) {
      const templatePath = path.join(process.cwd(), 'supabase', 'email-templates', `${template}.html`)
      
      try {
        emailHtml = fs.readFileSync(templatePath, 'utf-8')
        
        // Replace variables in template
        if (variables) {
          Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g')
            emailHtml = emailHtml.replace(regex, variables[key])
          })
        }
      } catch (err) {
        console.error('Template loading error:', err)
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }
    }

    if (!emailHtml) {
      return NextResponse.json(
        { error: 'No email content provided (html or template required)' },
        { status: 400 }
      )
    }

    // Create transporter using credentials from .env.local
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // use TLS
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Send email
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'Helparo'}" <${process.env.FROM_EMAIL || process.env.SMTP_USERNAME}>`,
      to,
      subject,
      html: emailHtml,
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Send email error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
