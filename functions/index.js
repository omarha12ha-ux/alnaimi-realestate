/**
 * Firebase Cloud Functions - Automatic Viewing Email Reminder (24-Hour Lead)
 * 
 * This Cloud Function is scheduled to run periodically (e.g., every hour).
 * It queries appointments scheduled for the next day, checks if the user requested
 * an email reminder (emailReminder === true) and hasn't yet received one (reminderSent !== true),
 * then triggers a professional email using Nodemailer.
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Configure Nodemailer with your preferred SMTP service (e.g., Gmail, SendGrid, Mailgun)
// For security, build this using Firebase Environment Variables or Google Secret Manager
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL || "your-agency-email@gmail.com",
    pass: process.env.SMTP_PASSWORD || "your-app-specific-password",
  },
});

exports.sendEmailAppointmentReminder = onSchedule("0 * * * *", async (event) => {
  const db = admin.firestore();
  
  // Get current date time and tomorrow's date
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  
  const tomorrowStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD format
  
  logger.info(`Checking appointments with email reminders for date: ${tomorrowStr}`);

  try {
    // Query appointments where date is tomorrow, emailReminder is enabled, and reminder is not yet sent
    const appointmentsRef = db.collection("appointments");
    const snapshot = await appointmentsRef
      .where("date", "==", tomorrowStr)
      .where("emailReminder", "==", true)
      .get();

    if (snapshot.empty) {
      logger.info("No appointments require reminders for tomorrow.");
      return null;
    }

    const emailPromises = [];

    for (const doc of snapshot.docs) {
      const appData = doc.data();
      
      // Double check to avoid duplicate sends
      if (appData.reminderSent === true) {
        continue;
      }

      logger.info(`Preparing reminder email for: ${appData.clientName} (${appData.clientEmail})`);

      // Retrieve optional property details if present
      let propertyTitle = "معاينة عقارية";
      let propertyLocation = "مقر الشركة الرئيسي";
      
      if (appData.propertyId) {
        const propDoc = await db.collection("properties").doc(appData.propertyId).get();
        if (propDoc.exists) {
          propertyTitle = propDoc.data().title;
          propertyLocation = propDoc.data().location;
        }
      } else if (appData.serviceTitle) {
        propertyTitle = appData.serviceTitle;
      }

      // Design gorgeous Islamic/Syrian style Arabic email template
      const emailHtml = `
        <div style="direction: rtl; text-align: right; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e7ec; border-radius: 16px; background-color: #fbfbf9; color: #1a2e40;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #c9a054;">
            <h2 style="color: #1a2e40; margin: 0; font-size: 24px; font-weight: bold;">أوج العقارية | Al-Ouj Real Estate</h2>
            <p style="color: #c9a054; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">تذكير بموعد المعاينة</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <p style="font-size: 16px; line-height: 1.6;">مرحباً <strong>${appData.clientName}</strong>،</p>
            <p style="font-size: 15px; line-height: 1.6; color: #4a5568;">نود تذكيركم بموعد المعاينة العقارية المحجوز مسبقاً بعد 24 ساعة من الآن. تفاصيل الموعد كالتالي:</p>
            
            <div style="background-color: #ffffff; border-right: 4px solid #c9a054; border-radius: 8px; padding: 20px; margin: 25px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #1a2e40; width: 120px;">العقار / الخدمة:</td>
                  <td style="padding: 6px 0; color: #4a5568;">${propertyTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #1a2e40;">التاريخ:</td>
                  <td style="padding: 6px 0; color: #4a5568; font-family: monospace; font-size: 14px;">${appData.date}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #1a2e40;">الوقت:</td>
                  <td style="padding: 6px 0; color: #c9a054; font-weight: bold;">${appData.time}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #1a2e40;">الموقع:</td>
                  <td style="padding: 6px 0; color: #4a5568;">${propertyLocation}</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #718096; background-color: #f7fafc; padding: 15px; border-radius: 8px; border: 1px dashed #e2e8f0;">
              * يرجى الحضور قبل الموعد بـ 10 دقائق لضمان سير المعاينة بسلاسة. إذا كنت ترغب في تعديل أو إلغاء الموعد، يرجى القيام بزيارة حسابكم على منصة أوج العقارية.
            </p>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e1e7ec; font-size: 11px; color: #a0aec0; line-height: 1.8;">
            <p style="margin: 0;">هذا البريد تم إرساله بشكل تلقائي من قبل خوادم أوج العقارية.</p>
            <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} شركة أوج للخدمات والتطوير العقاري - دمشق، سوريا.</p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: '"أوج العقارية" <no-reply@alouj-realestate.com>',
        to: appData.clientEmail,
        subject: `تذكير بموعد معاينة عقاركم لدى أوج العقارية: ${propertyTitle}`,
        html: emailHtml,
      };

      // Send the email and update state in Firestore synchronously
      const sendPromise = transporter.sendMail(mailOptions)
        .then(async () => {
          await doc.ref.update({
            reminderSent: true,
            reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          logger.info(`Successfully sent reminder to ${appData.clientEmail}`);
        })
        .catch((err) => {
          logger.error(`Failed to send email to ${appData.clientEmail}:`, err);
        });

      emailPromises.push(sendPromise);
    }

    await Promise.all(emailPromises);
    logger.info("All scheduled reminders processed successfully.");
  } catch (error) {
    logger.error("Error running sendEmailAppointmentReminder cloud function:", error);
  }
  return null;
});
