import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse form data
    const formData = await request.formData()
    
    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const jobTitle = formData.get('jobTitle') as string
    const department = formData.get('department') as string
    const linkedinUrl = formData.get('linkedinUrl') as string
    const portfolioUrl = formData.get('portfolioUrl') as string
    const currentCompany = formData.get('currentCompany') as string
    const currentRole = formData.get('currentRole') as string
    const experienceYears = formData.get('experienceYears') as string
    const expectedSalary = formData.get('expectedSalary') as string
    const noticePeriod = formData.get('noticePeriod') as string
    const location = formData.get('location') as string
    const willingToRelocate = formData.get('willingToRelocate') === 'true'
    const howDidYouHear = formData.get('howDidYouHear') as string
    const coverLetter = formData.get('coverLetter') as string
    const resume = formData.get('resume') as File | null

    // Validate required fields
    if (!fullName || !email || !phone || !jobTitle) {
      return NextResponse.json(
        { error: 'Please fill in all required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    let resumeUrl = null

    // Handle resume upload if provided
    if (resume && resume.size > 0) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      
      if (!allowedTypes.includes(resume.type)) {
        return NextResponse.json(
          { error: 'Please upload a PDF or Word document' },
          { status: 400 }
        )
      }

      // Validate file size (5MB max)
      if (resume.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size should be less than 5MB' },
          { status: 400 }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const sanitizedName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '_')
      const extension = resume.name.split('.').pop()
      const fileName = `${sanitizedName}_${timestamp}.${extension}`

      // Convert File to ArrayBuffer then to Buffer for upload
      const arrayBuffer = await resume.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, buffer, {
          contentType: resume.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Resume upload error:', uploadError)
        // Continue without resume if upload fails
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(uploadData.path)
        
        resumeUrl = urlData.publicUrl
      }
    }

    // Check for existing application with same email and job
    const { data: existingApplication } = await supabase
      .from('job_applications')
      .select('id')
      .eq('email', email)
      .eq('job_title', jobTitle)
      .single()

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this position. We will get back to you soon!' },
        { status: 400 }
      )
    }

    // Insert application into database
    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        full_name: fullName,
        email: email,
        phone: phone,
        job_title: jobTitle,
        department: department,
        linkedin_url: linkedinUrl || null,
        portfolio_url: portfolioUrl || null,
        current_company: currentCompany || null,
        current_role: currentRole || null,
        experience_years: experienceYears || null,
        expected_salary: expectedSalary || null,
        notice_period: noticePeriod || null,
        location: location || null,
        willing_to_relocate: willingToRelocate,
        how_did_you_hear: howDidYouHear || null,
        cover_letter: coverLetter || null,
        resume_url: resumeUrl,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to submit application. Please try again.' },
        { status: 500 }
      )
    }

    // TODO: Send confirmation email to applicant
    // TODO: Send notification to HR team

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully!',
      applicationId: data.id
    })

  } catch (error) {
    console.error('Application submission error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    )
  }
}

// GET endpoint to check application status (optional)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const applicationId = searchParams.get('id')

  if (!email && !applicationId) {
    return NextResponse.json(
      { error: 'Email or application ID required' },
      { status: 400 }
    )
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let query = supabase
      .from('job_applications')
      .select('id, job_title, status, created_at')
    
    if (applicationId) {
      query = query.eq('id', applicationId)
    } else if (email) {
      query = query.eq('email', email)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ applications: data })
  } catch (error) {
    console.error('Error fetching application:', error)
    return NextResponse.json(
      { error: 'Failed to fetch application status' },
      { status: 500 }
    )
  }
}
