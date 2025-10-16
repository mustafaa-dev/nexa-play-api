import { Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailProvider {
  constructor(private readonly configService: ConfigService) {}

  private getSubject(): string {
    return this.configService.get<string>('NATS_EMAIL_SUBJECT', 'emails.send');
  }

  private getQueue(): string {
    return this.configService.get<string>('NATS_EMAIL_QUEUE', 'email-workers');
  }

  private getFromAddress(): string {
    const from = this.configService.get('SMTP_FROM', 'noreply@example.com');
    return `"MegaSender" <${from}>`;
  }

  /**
   * Send a verification code email to a user
   * @param email The recipient's email address
   * @param code The verification code to send
   * @returns Promise with the result of the operation
   */
  async sendVerificationCode(email: string, code: string): Promise<{ success: boolean }> {
    const payload = {
      to: email,
      from: this.getFromAddress(),
      subject: `Your MegaSender Verification Code`,
      text: `Your verification code is: ${code}. It will expire in 10 minutes.`,
      html: `
        <!doctype html>
<html
  lang="en"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <!--[if mso]>
      <style>
        table {
          border-collapse: collapse;
          border-spacing: 0;
          border: 0;
          margin: 0;
        }
        div,
        td {
          padding: 0;
        }
        div {
          margin: 0 !important;
        }
      </style>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
    <![endif]-->
    <style>
      /* Reset styles */
      table,
      td,
      div,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6,
      p {
        font-family: 'Poppins', sans-serif;
      }

      /* Responsive styles */
      @media screen and (max-width: 600px) {
        .email-container {
          width: 100% !important;
        }
        .content-wrapper {
          padding: 20px 15px !important;
        }
        .otp-code {
          font-size: 32px !important;
          padding: 20px !important;
        }
        .header-text {
          font-size: 24px !important;
        }
        .mobile-center {
          text-align: center !important;
        }
        .mobile-padding {
          padding: 15px !important;
        }
      }

      @media screen and (max-width: 480px) {
        .otp-code {
          font-size: 28px !important;
          padding: 15px !important;
        }
        .content-text {
          font-size: 14px !important;
        }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f4f4">
    <div
      style="
        display: none;
        font-size: 1px;
        color: #fefefe;
        line-height: 1px;
        max-height: 0px;
        max-width: 0px;
        opacity: 0;
        overflow: hidden;
      "
    >
      Your verification code is ready. Complete your account setup now.
    </div>

    <table
      role="presentation"
      cellspacing="0"
      cellpadding="0"
      border="0"
      width="100%"
      style="background-color: #f4f4f4"
    >
      <tr>
        <td style="padding: 20px 0">
          <!-- Main Email Container -->
          <table
            class="email-container"
            role="presentation"
            cellspacing="0"
            cellpadding="0"
            border="0"
            width="600"
            style="
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            "
          >
            <!-- Header -->
            <tr>
              <td style="padding: 20px; text-align: center; border-radius: 8px 8px 0 0">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="text-align: center">
                      <!-- Logo placeholder - replace with actual logo -->
                      <img src="https://app-dev.megasender.org/logo.svg" alt="MegaSender Logo" />

                      <span
                        class="header-text"
                        style="
                          margin: 0;
                          color: #09090b;
                          font-size: 28px;
                          font-weight: 600;
                          line-height: 1.2;
                        "
                      >
                        MegaSender
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td class="content-wrapper" style="padding: 40px 30px">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="text-align: center; padding-bottom: 30px">
                      <h2
                        style="
                          margin: 0 0 15px;
                          color: #333333;
                          font-size: 22px;
                          font-weight: 600;
                          line-height: 1.3;
                        "
                      >
                        Enter this verification code
                      </h2>
                      <p
                        class="content-text"
                        style="margin: 0; color: #666666; font-size: 16px; line-height: 1.5"
                      >
                        We received a request to verify your email address. Use the code below to
                        complete the verification process.
                      </p>
                    </td>
                  </tr>

                  <!-- OTP Code -->
                  <tr>
                    <td style="text-align: center; padding: 20px 0">
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="margin: 0 auto"
                      >
                        <tr>
                          <td
                            class="otp-code"
                            style="
                              background-color: #f8f9fa;
                              border: 2px dashed #7467f1;
                              border-radius: 8px;
                              padding: 25px 40px;
                              text-align: center;
                            "
                          >
                            <span
                              style="
                                font-family: 'Courier New', monospace;
                                font-size: 36px;
                                font-weight: bold;
                                color: #7467f1;
                                letter-spacing: 8px;
                              "
                            >
                              ${code}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Instructions -->
                  <tr>
                    <td style="text-align: center; padding: 20px 0">
                      <p
                        class="content-text"
                        style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600"
                      >
                        This code will expire in 10 minutes
                      </p>
                      <p
                        class="content-text"
                        style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5"
                      >
                        If you didn't request this verification code, please ignore this email or
                        contact our support team if you have concerns.
                      </p>
                    </td>
                  </tr>

                  <!-- Security Notice -->
                  <tr>
                    <td
                      style="
                        background-color: #fff3cd;
                        border: 1px solid #ffeaa7;
                        border-radius: 6px;
                        padding: 10px;
                        margin-top: 30px;
                      "
                    >
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        width="100%"
                      >
                        <tr>
                          <td style="text-align: center">
                            <div
                              style="
                                width: 24px;
                                height: 24px;
                                background-color: #f1c40f;
                                border-radius: 50%;
                                margin: 0 auto 10px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                color: white;
                              "
                            >
                              !
                            </div>
                            <p style="margin: 0; color: #856404; font-size: 14px; font-weight: 600">
                              Security Reminder
                            </p>
                            <p
                              style="
                                margin: 5px 0 0;
                                color: #856404;
                                font-size: 13px;
                                line-height: 1.4;
                              "
                            >
                              Never share this code with anyone. Our team will never ask for your
                              verification code.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  background-color: #f8f9fa;
                  padding: 30px;
                  text-align: center;
                  border-radius: 0 0 8px 8px;
                  border-top: 1px solid #e9ecef;
                "
              >
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="text-align: center">
                      <p style="margin: 0 0 10px; color: #666666; font-size: 14px">
                        Need help?
                        <a
                          href="mailto:support@megasender.org"
                          style="color: #7467f1; text-decoration: none"
                          >Contact Support</a
                        >
                      </p>
                      <p
                        style="margin: 0 0 15px; color: #999999; font-size: 12px; line-height: 1.4"
                      >
                        © 2025 MegaSender. All rights reserved.<br />
                        Cairo, Egypt
                      </p>

                      <!-- Social Links -->
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="margin: 15px auto 0"
                      >
                        <tr>
                          <td style="padding: 0 5px">
                            <a
                              href="#"
                              style="
                                display: inline-block;
                                width: 32px;
                                height: 32px;
                                background-color: #7467f1;
                                border-radius: 50%;
                                text-align: center;
                                line-height: 32px;
                                color: white;
                                text-decoration: none;
                                font-size: 14px;
                              "
                              >f</a
                            >
                          </td>
                          <td style="padding: 0 5px">
                            <a
                              href="#"
                              style="
                                display: inline-block;
                                width: 32px;
                                height: 32px;
                                background-color: #7467f1;
                                border-radius: 50%;
                                text-align: center;
                                line-height: 32px;
                                color: white;
                                text-decoration: none;
                                font-size: 14px;
                              "
                              >t</a
                            >
                          </td>
                          <td style="padding: 0 5px">
                            <a
                              href="#"
                              style="
                                display: inline-block;
                                width: 32px;
                                height: 32px;
                                background-color: #7467f1;
                                border-radius: 50%;
                                text-align: center;
                                line-height: 32px;
                                color: white;
                                text-decoration: none;
                                font-size: 14px;
                              "
                              >in</a
                            >
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
      `,
      type: 'verification_code',
      metadata: { queue: this.getQueue() },
    };
    // await this.eventBus.publish(this.getSubject(), 'emails.verification', payload, undefined, {
    //   messageType: MessageType.MESSAGE_TYPE_EMAIL_SEND,
    //   priority: Priority.PRIORITY_NORMAL,
    //   source: 'master-service',
    //   headers: { 'x-queue-group': this.getQueue() },
    // });

    // Fire-and-forget semantics
    return { success: true };
  }

  /**
   * Send a password reset email to a user
   * @param email The recipient's email address
   * @param resetToken The password reset token
   * @returns Promise with the result of the operation
   */
  async sendPasswordResetEmail(email: string, code: number): Promise<{ success: boolean }> {
    const payload = {
      to: email,
      from: this.getFromAddress(),
      subject: `Your MegaSender Password Reset Code`,
      text: `Your verification code is: ${code}. It will expire in 10 minutes.`,
      html: `
        <!doctype html>
<html
  lang="en"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <!--[if mso]>
      <style>
        table {
          border-collapse: collapse;
          border-spacing: 0;
          border: 0;
          margin: 0;
        }
        div,
        td {
          padding: 0;
        }
        div {
          margin: 0 !important;
        }
      </style>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
    <![endif]-->
    <style>
      /* Reset styles */
      table,
      td,
      div,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6,
      p {
        font-family: 'Poppins', sans-serif;
      }

      /* Responsive styles */
      @media screen and (max-width: 600px) {
        .email-container {
          width: 100% !important;
        }
        .content-wrapper {
          padding: 20px 15px !important;
        }
        .otp-code {
          font-size: 32px !important;
          padding: 20px !important;
        }
        .header-text {
          font-size: 24px !important;
        }
        .mobile-center {
          text-align: center !important;
        }
        .mobile-padding {
          padding: 15px !important;
        }
      }

      @media screen and (max-width: 480px) {
        .otp-code {
          font-size: 28px !important;
          padding: 15px !important;
        }
        .content-text {
          font-size: 14px !important;
        }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f4f4">
    <div
      style="
        display: none;
        font-size: 1px;
        color: #fefefe;
        line-height: 1px;
        max-height: 0px;
        max-width: 0px;
        opacity: 0;
        overflow: hidden;
      "
    >
      Your password reset code is ready. Use it to reset your password.
    </div>

    <table
      role="presentation"
      cellspacing="0"
      cellpadding="0"
      border="0"
      width="100%"
      style="background-color: #f4f4f4"
    >
      <tr>
        <td style="padding: 20px 0">
          <!-- Main Email Container -->
          <table
            class="email-container"
            role="presentation"
            cellspacing="0"
            cellpadding="0"
            border="0"
            width="600"
            style="
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            "
          >
            <!-- Header -->
            <tr>
              <td style="padding: 20px; text-align: center; border-radius: 8px 8px 0 0">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="text-align: center">
                      <!-- Logo placeholder - replace with actual logo -->
                      <img src="https://app-dev.megasender.org/logo.svg" alt="MegaSender Logo" />

                      <span
                        class="header-text"
                        style="
                          margin: 0;
                          color: #09090b;
                          font-size: 28px;
                          font-weight: 600;
                          line-height: 1.2;
                        "
                      >
                        MegaSender
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td class="content-wrapper" style="padding: 40px 30px">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="text-align: center; padding-bottom: 30px">
                      <h2
                        style="
                          margin: 0 0 15px;
                          color: #333333;
                          font-size: 22px;
                          font-weight: 600;
                          line-height: 1.3;
                        "
                      >
                        Enter this password reset code
                      </h2>
                      <p
                        class="content-text"
                        style="margin: 0; color: #666666; font-size: 16px; line-height: 1.5"
                      >
                        We received a request to reset your password. Use the code below to
                        complete the verification process.
                      </p>
                    </td>
                  </tr>

                  <!-- OTP Code -->
                  <tr>
                    <td style="text-align: center; padding: 20px 0">
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="margin: 0 auto"
                      >
                        <tr>
                          <td
                            class="otp-code"
                            style="
                              background-color: #f8f9fa;
                              border: 2px dashed #7467f1;
                              border-radius: 8px;
                              padding: 25px 40px;
                              text-align: center;
                            "
                          >
                            <span
                              style="
                                font-family: 'Courier New', monospace;
                                font-size: 36px;
                                font-weight: bold;
                                color: #7467f1;
                                letter-spacing: 8px;
                              "
                            >
                              ${code}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Instructions -->
                  <tr>
                    <td style="text-align: center; padding: 20px 0">
                      <p
                        class="content-text"
                        style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600"
                      >
                        This code will expire in 10 minutes
                      </p>
                      <p
                        class="content-text"
                        style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5"
                      >
                        If you didn't request this password reset code, please ignore this email or
                        contact our support team if you have concerns.
                      </p>
                    </td>
                  </tr>

                  <!-- Security Notice -->
                  <tr>
                    <td
                      style="
                        background-color: #fff3cd;
                        border: 1px solid #ffeaa7;
                        border-radius: 6px;
                        padding: 10px;
                        margin-top: 30px;
                      "
                    >
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        width="100%"
                      >
                        <tr>
                          <td style="text-align: center">
                            <div
                              style="
                                width: 24px;
                                height: 24px;
                                background-color: #f1c40f;
                                border-radius: 50%;
                                margin: 0 auto 10px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                color: white;
                              "
                            >
                              !
                            </div>
                            <p style="margin: 0; color: #856404; font-size: 14px; font-weight: 600">
                              Security Reminder
                            </p>
                            <p
                              style="
                                margin: 5px 0 0;
                                color: #856404;
                                font-size: 13px;
                                line-height: 1.4;
                              "
                            >
                              Never share this code with anyone. Our team will never ask for your
                              password reset code.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  background-color: #f8f9fa;
                  padding: 30px;
                  text-align: center;
                  border-radius: 0 0 8px 8px;
                  border-top: 1px solid #e9ecef;
                "
              >
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="text-align: center">
                      <p style="margin: 0 0 10px; color: #666666; font-size: 14px">
                        Need help?
                        <a
                          href="mailto:support@megasender.org"
                          style="color: #7467f1; text-decoration: none"
                          >Contact Support</a
                        >
                      </p>
                      <p
                        style="margin: 0 0 15px; color: #999999; font-size: 12px; line-height: 1.4"
                      >
                        © 2025 MegaSender. All rights reserved.<br />
                        Cairo, Egypt
                      </p>

                      <!-- Social Links -->
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="margin: 15px auto 0"
                      >
                        <tr>
                          <td style="padding: 0 5px">
                            <a
                              href="#"
                              style="
                                display: inline-block;
                                width: 32px;
                                height: 32px;
                                background-color: #7467f1;
                                border-radius: 50%;
                                text-align: center;
                                line-height: 32px;
                                color: white;
                                text-decoration: none;
                                font-size: 14px;
                              "
                              >f</a
                            >
                          </td>
                          <td style="padding: 0 5px">
                            <a
                              href="#"
                              style="
                                display: inline-block;
                                width: 32px;
                                height: 32px;
                                background-color: #7467f1;
                                border-radius: 50%;
                                text-align: center;
                                line-height: 32px;
                                color: white;
                                text-decoration: none;
                                font-size: 14px;
                              "
                              >t</a
                            >
                          </td>
                          <td style="padding: 0 5px">
                            <a
                              href="#"
                              style="
                                display: inline-block;
                                width: 32px;
                                height: 32px;
                                background-color: #7467f1;
                                border-radius: 50%;
                                text-align: center;
                                line-height: 32px;
                                color: white;
                                text-decoration: none;
                                font-size: 14px;
                              "
                              >in</a
                            >
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
      `,
      type: 'password_reset',
      metadata: { queue: this.getQueue() },
    };
    // await this.eventBus.publish(this.getSubject(), 'emails.password_reset', payload, undefined, {
    //   messageType: MessageType.MESSAGE_TYPE_EMAIL_SEND,
    //   priority: Priority.PRIORITY_NORMAL,
    //   source: 'master-service',
    //   headers: { 'x-queue-group': this.getQueue() },
    // });

    // Fire-and-forget semantics
    return { success: true };
  }

  /**
   * Send a welcome email to a new user
   * @param email The recipient's email address
   * @param firstName The user's first name
   * @returns Promise with the result of the operation
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<{ success: boolean }> {
    const loginLink = this.configService.get('FRONTEND_BASE_URL', 'https://example.com');

    const payload = {
      to: email,
      from: this.getFromAddress(),
      subject: `Welcome to MegaSender!`,
      text: `Hi ${firstName}, welcome to MegaSender! We're excited to have you on board.`,
      html: `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Welcome to MegaSender</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!--[if mso]>
  <style>
    table { border-collapse: collapse; border-spacing: 0; border: 0; margin: 0; }
    div, td { padding: 0; }
    div { margin: 0 !important; }
  </style>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    table, td, div, h1, h2, h3, h4, h5, h6, p { font-family: 'Poppins', sans-serif; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .content-wrapper { padding: 20px 15px !important; }
      .header-text { font-size: 24px !important; }
      .content-text { font-size: 14px !important; }
      .cta-button { padding: 10px 20px !important; font-size: 14px !important; }
      .mobile-center { text-align: center !important; }
      .mobile-padding { padding: 15px !important; }
      img { width: 100% !important; height: auto !important; }
    }
    @media screen and (max-width: 480px) {
      .content-text { font-size: 13px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Welcome to MegaSender! Get started with your account today.
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 20px 0;">
        <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center">
                    <!-- Logo placeholder - replace with actual logo -->
                    <img src="https://app-dev.megasender.org/logo.svg" alt="MegaSender Logo" />

                    <span
                      class="header-text"
                      style="
                        margin: 0;
                        color: #09090b;
                        font-size: 28px;
                        font-weight: 600;
                        line-height: 1.2;
                      "
                    >
                      MegaSender
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td class="content-wrapper" style="padding: 40px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-bottom: 30px;">
                    <h2 style="margin: 0 0 15px; color: #333333; font-size: 22px; font-weight: 600; line-height: 1.3;">Welcome to MegaSender!</h2>
                    <p class="content-text" style="margin: 0; color: #666666; font-size: 16px; line-height: 1.5;">
                      Dear  ${firstName}, We're thrilled to have you on board. Start exploring our platform to send messages, and connect with your audience like never before.
                    </p>
                  </td>
                </tr>
                <!-- Call to Action -->
                <tr>
                  <td style="text-align: center; padding: 20px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td>
                          <a href="https://app-dev.megasender.org" class="cta-button" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #7467f1; text-decoration: none; border-radius: 6px;">Get Started</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                      Need help? <a href="mailto:support@megasender.org" style="color: #7467f1; text-decoration: none;">Contact Support</a>
                    </p>
                    <p style="margin: 0 0 15px; color: #999999; font-size: 12px; line-height: 1.4;">
                      © 2025 MegaSender. All rights reserved.<br>Cairo, Egypt
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 15px auto 0;">
                      <tr>
                        <td style="padding: 0 5px;">
                          <a href="#" style="display: inline-block; width: 32px; height: 32px; background-color: #7467f1; border-radius: 50%; text-align: center; line-height: 32px; color: white; text-decoration: none; font-size: 14px;">f</a>
                        </td>
                        <td style="padding: 0 5px;">
                          <a href="#" style="display: inline-block; width: 32px; height: 32px; background-color: #7467f1; border-radius: 50%; text-align: center; line-height: 32px; color: white; text-decoration: none; font-size: 14px;">t</a>
                        </td>
                        <td style="padding: 0 5px;">
                          <a href="#" style="display: inline-block; width: 32px; height: 32px; background-color: #7467f1; border-radius: 50%; text-align: center; line-height: 32px; color: white; text-decoration: none; font-size: 14px;">in</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      type: 'welcome',
      metadata: { queue: this.getQueue() },
    };

    // await this.eventBus.publish(this.getSubject(), 'emails.welcome', payload, undefined, {
    //   messageType: MessageType.MESSAGE_TYPE_EMAIL_SEND,
    //   priority: Priority.PRIORITY_LOW,
    //   source: 'master-service',
    //   headers: { 'x-queue-group': this.getQueue() },
    // });

    return { success: true };
  }
}
