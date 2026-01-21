import axios from "axios";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  try {
    console.log("Function started");

    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;

    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error("Missing email environment variables");
    }

    // 🔁 Replace with YOUR ThingSpeak Channel ID
    const CHANNEL_ID = "3099976";

    const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=1`;
    const response = await axios.get(url);

    const lastEntry = response.data.feeds[0];
    const lastTime = new Date(lastEntry.created_at).getTime();
    const now = Date.now();

    const diffMinutes = (now - lastTime) / 60000;

    console.log("Last update minutes ago:", diffMinutes);

    if (diffMinutes < 5) {
      return res.status(200).json({
        status: "OK",
        message: "Data is updating normally"
      });
    }

    // 📧 Send email alert
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: EMAIL_USER,
      to: EMAIL_USER,
      subject: "🚨 ThingSpeak Alert",
      text: `No data received for ${Math.floor(diffMinutes)} minutes`
    });

    return res.status(200).json({
      status: "ALERT_SENT",
      minutes: Math.floor(diffMinutes)
    });

  } catch (error) {
    console.error("ERROR:", error.message);
    return res.status(500).json({
      status: "ERROR",
      message: error.message
    });
  }
}

