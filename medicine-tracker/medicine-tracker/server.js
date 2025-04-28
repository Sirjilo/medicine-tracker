// CARGA DE MÓDULOS
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const axios = require('axios');
const cron = require('node-cron');
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.static('public')); // para servir index.html, styles.css, script.js

// BASE TEMPORAL DE RECORDATORIOS (en memoria)
const reminders = [];

// Configurar transporte de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true, // 💬 Mostrar más info
  logger: true // 💬 Mostrar más logs
});

// Ruta para buscar medicina
app.get('/search', async (req, res) => {
  const { name } = req.query;
  try {
    const response = await axios.get(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:${name}&limit=1`);
    res.json(response.data.results);
  } catch (error) {
    console.error('Error fetching medicine info:', error);
    res.status(500).json({ message: 'Error fetching medicine info' });
  }
});

// Ruta para registrar recordatorio
app.post('/reminder', (req, res) => {
  const { medicineNameReminder, email, expiry } = req.body;
  if (!medicineNameReminder || !email || !expiry) {
    return res.status(400).send('Missing medicine name, email, or expiry date.');
  }

  reminders.push({ medicineNameReminder, email, expiry });
  console.log(`✅ Recordatorio guardado para ${medicineNameReminder} - Expiración: ${expiry}`);

  res.send('✅ Reminder set successfully!');
});

// Tarea CRON: Revisar recordatorios CADA MINUTO
cron.schedule('* * * * *', () => {
  console.log('⏰ Cron running at', new Date().toLocaleString());
  const today = new Date();

  reminders.forEach((reminder) => {
    const expiryDate = new Date(reminder.expiry);
    const twoDaysBefore = new Date(expiryDate);
    twoDaysBefore.setDate(expiryDate.getDate() - 2);
    const oneDayBefore = new Date(expiryDate);
    oneDayBefore.setDate(expiryDate.getDate() - 1);

    console.log(`🔎 Checking reminder for ${reminder.email} - Expiry: ${reminder.expiry}`);
    console.log(`📅 2 days before: ${twoDaysBefore.toDateString()} | 1 day before: ${oneDayBefore.toDateString()}`);

    // Verificar si es el día 2 antes de la expiración
    if (today.toDateString() === twoDaysBefore.toDateString()) {
      console.log('✅ Sending EARLY reminder email (2 days before)...');
      const earlyMailOptions = {
        from: process.env.EMAIL_USER,
        to: reminder.email,
        subject: `📢 Medicine Expiration Reminder (2 days left)`,
        text: `Hello! Your medicine, ${reminder.medicineNameReminder}, will expire in 2 days (${reminder.expiry}). Please check it.`
      };

      transporter.sendMail(earlyMailOptions, (error, info) => {
        if (error) {
          console.error('❌ Error sending early reminder:', error);
        } else {
          console.log(`✅ Early reminder email sent to ${reminder.email}: ${info.response}`);
        }
      });
    }

    // Verificar si es el día 1 antes de la expiración
    if (today.toDateString() === oneDayBefore.toDateString()) {
      console.log('⚠️ Sending URGENT reminder email (1 day before)...');
      const urgentMailOptions = {
        from: process.env.EMAIL_USER,
        to: reminder.email,
        subject: `⚠️ URGENT: Medicine Expiring Tomorrow!`,
        text: `Hello! Your medicine, ${reminder.medicineNameReminder}, is expiring TOMORROW (${reminder.expiry}). Please act soon!`
      };

      transporter.sendMail(urgentMailOptions, (error, info) => {
        if (error) {
          console.error('❌ Error sending urgent reminder:', error);
        } else {
          console.log(`✅ Urgent reminder email sent to ${reminder.email}: ${info.response}`);
        }
      });
    }
  });
});

// INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
