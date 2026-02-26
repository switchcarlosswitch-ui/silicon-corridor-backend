const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const BREVO_KEY = process.env.BREVO_API_KEY;
const PORT = process.env.PORT || 3000;

app.post('/api/send-invitation', async (req, res) => {
    const { name, email, token, expiry, inviteUrl } = req.body;

    if (!name || !email || !token) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { 
                name: 'Silicon Corridor Ventures', 
                email: 'noreply@siliconcorridorventures.com' 
            },
            to: [{ email, name }],
            subject: 'You are invited to the Silicon Corridor Ventures Investor Portal',
            htmlContent: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:linear-gradient(135deg,#6B3FA0,#4AABCF,#3BBFAD);padding:2rem;border-radius:12px 12px 0 0;text-align:center;">
                    <h1 style="color:white;margin:0;font-size:1.5rem;">Silicon Corridor Ventures</h1>
                    <p style="color:rgba(255,255,255,0.9);margin:0.5rem 0 0;font-size:0.9rem;">Investor Portal Invitation</p>
                </div>
                <div style="padding:2rem;background:#f7f8fc;border-radius:0 0 12px 12px;">
                    <h2 style="color:#1e293b;">Welcome, ${name}!</h2>
                    <p style="color:#64748b;">You have been invited to join the Silicon Corridor Ventures Investor Portal — your gateway to exclusive investment opportunities.</p>
                    <div style="text-align:center;margin:2rem 0;">
                        <a href="${inviteUrl}" style="background:linear-gradient(135deg,#6B3FA0,#4AABCF);color:white;padding:1rem 2.5rem;border-radius:8px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">Accept Invitation →</a>
                    </div>
                    <p style="color:#94a3b8;font-size:0.8rem;">This invitation expires in ${expiry} days. If you did not expect this email, please ignore it.</p>
                </div>
            </div>`
        }, {
            headers: { 'api-key': BREVO_KEY }
        });

        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Brevo error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to send email',
            details: error.response?.data?.message || error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});