import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import PDFDocument from "pdfkit";
import { Writable } from "stream";

dotenv.config();

// Helper to generate PDF in memory
async function generateGuidelinesPDF(name: string): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    const stream = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      },
      final(callback) {
        resolve(Buffer.concat(chunks));
        callback();
      }
    });

    doc.pipe(stream);

    // Header
    doc.fillColor("#0056B3").fontSize(20).text("THIAGARAJAR COLLEGE OF ENGINEERING", { align: "center" });
    doc.fillColor("#444").fontSize(12).text("Department of Civil Engineering - Madurai", { align: "center" });
    doc.moveDown();
    doc.rect(50, doc.y, 500, 2).fill("#0056B3");
    doc.moveDown(2);

    // Title
    doc.fillColor("#000").fontSize(16).text("TECHNICAL GUIDELINES: UPV REBAR INFLUENCE IN RCC", { underline: true });
    doc.moveDown();

    doc.fontSize(11).fillColor("#333");
    doc.text(`Prepared for: ${name}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Content
    doc.fillColor("#0056B3").fontSize(14).text("1. Evaluation Principle", { stroke: true });
    doc.fillColor("#333").fontSize(11).text("Rebar influence is evaluated by comparing the pulse velocity in Plain Cement Concrete (PCC) and Reinforced Cement Concrete (RCC). By testing across different rebar configurations, we quantify the 'steel-bridge' effect to ensure the diagnostic result reflects the true quality of the concrete matrix, not the reinforcement.", { lineGap: 4 });
    doc.moveDown(1.5);

    doc.fillColor("#0056B3").fontSize(14).text("2. Perpendicular Orientation", { stroke: true });
    doc.fillColor("#333").fontSize(11).text("- Correction Factor: A fundamental correction factor of 0.9 is utilized in the calculation logic.", { lineGap: 4 });
    doc.text("- K-Factor Integration: The influence is refined by the ratio of bar diameter to total path length, ensuring the traversal through steel is neutralized.", { lineGap: 4 });
    doc.moveDown(1.5);

    doc.fillColor("#0056B3").fontSize(14).text("3. Parallel Orientation", { stroke: true });
    doc.fillColor("#333").fontSize(11).text("- Influence Zone: The tool evaluates whether the rebar is within a critical proximity (a) to the signal path.", { lineGap: 4 });
    doc.text("- Comparative Logic: If influence is confirmed, the RCC measurement is adjusted back to its equivalent PCC velocity using standard deviation algorithms.", { lineGap: 4 });
    doc.moveDown(1.5);

    doc.fillColor("#0056B3").fontSize(14).text("4. Diagnostic Criteria (IS 516 : Part 5)", { stroke: true });
    doc.fillColor("#333").fontSize(11).text("- Excellent: > 4.5 km/sec", { lineGap: 2 });
    doc.text("- Good: 3.5 - 4.5 km/sec", { lineGap: 2 });
    doc.text("- Medium: 3.0 - 3.5 km/sec", { lineGap: 2 });
    doc.text("- Doubtful: < 3.0 km/sec (Requires investigative action)", { lineGap: 2 });
    doc.moveDown(3);

    // Footer / Support Section
    doc.rect(50, doc.y, 500, 1).fill("#EEEEEE");
    doc.moveDown(1.5);
    doc.fontSize(11).fillColor("#0056B3").text("LABORATORY SUPPORT CONTACTS", { align: "center", characterSpacing: 1 });
    doc.moveDown(0.8);
    doc.fontSize(10).fillColor("#555").text("Thiagarajar College of Engineering | Civil Engineering Lab", { align: "center" });
    doc.moveDown(0.5);
    doc.fillColor("#0056B3").text("anandarao242004@gmail.com", { align: "center", underline: true });
    doc.moveDown(0.3);
    doc.text("anandarao@student.tce.edu", { align: "center", underline: true });

    doc.end();
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route to send welcome email with PDF guidelines
  app.post("/api/welcome-email", async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Email credentials not configured. Skipping email sending.");
        return res.json({ 
          success: true, 
          message: "User logged in, but guidelines were not sent due to missing credentials." 
        });
      }

      const pdfBuffer = await generateGuidelinesPDF(name);

      const mailOptions = {
        from: `"TCE Civil Engineering Lab" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "UPV Analysis Tool for Reinforced Concrete",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0056B3; padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase;">UPV Analysis Tool for Reinforced Concrete</h1>
            </div>
            <div style="padding: 40px; line-height: 1.6; color: #444;">
              <h2 style="color: #0056B3; margin-top: 0;">Protocol Established, ${name}!</h2>
              <p>Your access to the <strong>UPV Analysis Tool</strong> at Thiagarajar College of Engineering has been verified.</p>
              <p>Attached to this email, you will find a professional <strong>Technical Guidelines PDF</strong>. This document outlines the mathematical correction models used for rebar influence, ensuring your NDT measurements meet IS 516 Part 5 standards.</p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #0056B3; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; font-weight: bold; color: #0056B3;">Why wait?</p>
                <p style="margin: 5px 0 0;">Launch the tool now to start high-precision diagnostic analysis on your RCC elements.</p>
              </div>

              <p style="margin-top: 30px;">For laboratory support or research collaboration, please contact:</p>
              <p style="font-size: 14px; color: #666;">
                <strong>Primary:</strong> anandarao242004@gmail.com<br>
                <strong>Internal:</strong> anandarao@student.tce.edu
              </p>
            </div>
            <div style="background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #888;">
              <p style="margin: 0;">© 2026 Thiagarajar College of Engineering, Madurai</p>
              <p style="margin: 5px 0 0;">Department of Civil Engineering | Lab Version 2.4.0</p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: "UPV_Technical_Guidelines_TCE.pdf",
            content: pdfBuffer,
          }
        ]
      };

      await transporter.sendMail(mailOptions);
      console.log(`Guidelines email sent to ${email}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send guidelines email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only start listening if not running on Vercel
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

export const appPromise = startServer();
export default appPromise;
