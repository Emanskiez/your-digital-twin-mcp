import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { name, contact, message } = await request.json();

    // Validate input
    if (!name || !contact || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Create transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: "dizonm628@gmail.com",
      subject: `Portfolio Contact: Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px;">New Portfolio Contact Message</h2>
          
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong style="color: #333;">Name:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong style="color: #333;">Contact Info:</strong> ${contact}</p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #333;"><strong>Message:</strong></p>
            <p style="margin: 10px 0 0 0; color: #555; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px;">
            <p>This message was sent from your Digital Twin Portfolio contact form.</p>
            <p>Sent on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      text: `
New Portfolio Contact Message

Name: ${name}
Contact: ${contact}

Message:
${message}

Sent on: ${new Date().toLocaleString()}
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
