const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// ── Environment variables ──────────────────────────────────
const BREVO_KEY              = process.env.BREVO_API_KEY;
const SUPABASE_URL           = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORT                   = process.env.PORT || 3000;
const SENDER_EMAIL           = 'noreply@siliconcorridorventures.com';
const SENDER_NAME            = 'Silicon Corridor Ventures';

// ── Supabase ADMIN client (service role — bypasses RLS) ───
// This key never leaves the server. It is NOT the anon key.
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Health check (Railway uses this to confirm service is up)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Silicon Corridor Ventures Backend' });
});

// ============================================================
// POST /api/send-invitation
// Sends a branded investor invitation email via Brevo
// ============================================================
app.post('/api/send-invitation', async (req, res) => {
    const { name, email, token, expiry, inviteUrl } = req.body;

    if (!name || !email || !token) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { name: SENDER_NAME, email: SENDER_EMAIL },
            to: [{ email, name }],
            subject: 'You are invited to the Silicon Corridor Ventures Investor Portal',
            htmlContent: `
<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
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
        <p style="color:#94a3b8;font-size:0.8rem;text-align:center;">This invitation expires in ${expiry} days. If you did not expect this email please ignore it.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:1.5rem 0;">
        <p style="color:#94a3b8;font-size:0.75rem;text-align:center;">© ${new Date().getFullYear()} Silicon Corridor Ventures. All rights reserved.</p>
    </div>
</div>`
        }, {
            headers: { 'api-key': BREVO_KEY }
        });

        res.json({ success: true, message: 'Invitation email sent' });

    } catch (error) {
        console.error('Brevo invitation error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to send invitation email',
            details: error.response?.data?.message || error.message
        });
    }
});

// ============================================================
// POST /api/send-password-reset
// Sends a branded password reset email via Brevo
// Called by the frontend after storing the token in Supabase
// ============================================================
app.post('/api/send-password-reset', async (req, res) => {
    const { name, email, token, resetUrl } = req.body;

    if (!name || !email || !token || !resetUrl) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { name: SENDER_NAME, email: SENDER_EMAIL },
            to: [{ email, name }],
            subject: 'Reset Your Silicon Corridor Ventures Password',
            htmlContent: `
<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#6B3FA0,#4AABCF,#3BBFAD);padding:2rem;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:white;margin:0;font-size:1.5rem;">Silicon Corridor Ventures</h1>
        <p style="color:rgba(255,255,255,0.9);margin:0.5rem 0 0;font-size:0.9rem;">Investor Portal — Password Reset</p>
    </div>
    <div style="padding:2rem;background:#f7f8fc;border-radius:0 0 12px 12px;">
        <h2 style="color:#1e293b;">Hello, ${name}</h2>
        <p style="color:#64748b;">We received a request to reset the password for your Silicon Corridor Ventures Investor Portal account.</p>
        <p style="color:#64748b;">Click the button below to create a new password. This link is valid for <strong>1 hour</strong>.</p>
        <div style="text-align:center;margin:2rem 0;">
            <a href="${resetUrl}" style="background:linear-gradient(135deg,#6B3FA0,#4AABCF);color:white;padding:1rem 2.5rem;border-radius:8px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">Reset My Password →</a>
        </div>
        <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:1rem;margin:1.5rem 0;">
            <p style="color:#92400e;margin:0;font-size:0.85rem;">⚠️ If you did not request a password reset, please ignore this email. Your password will not change.</p>
        </div>
        <p style="color:#94a3b8;font-size:0.8rem;text-align:center;">For security, this link expires in 1 hour and can only be used once.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:1.5rem 0;">
        <p style="color:#94a3b8;font-size:0.75rem;text-align:center;">© ${new Date().getFullYear()} Silicon Corridor Ventures. All rights reserved.</p>
    </div>
</div>`
        }, {
            headers: { 'api-key': BREVO_KEY }
        });

        res.json({ success: true, message: 'Password reset email sent' });

    } catch (error) {
        console.error('Brevo reset email error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to send reset email',
            details: error.response?.data?.message || error.message
        });
    }
});

// ============================================================
// POST /api/reset-password
// 1. Validates the reset token from the password_resets table
// 2. Finds the user by email in the profiles table
// 3. Updates the password via Supabase Admin API
// 4. Marks the token as used so it cannot be reused
// The service role key never touches the browser — server only
// ============================================================
app.post('/api/reset-password', async (req, res) => {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        // ── Step 1: Validate token ─────────────────────────
        const { data: resetRecord, error: tokenError } = await supabaseAdmin
            .from('password_resets')
            .select('*')
            .eq('token', token)
            .eq('email', email)
            .eq('used', false)
            .single();

        if (tokenError || !resetRecord) {
            return res.status(400).json({ error: 'Invalid or already used reset link. Please request a new one.' });
        }

        if (new Date(resetRecord.expires_at) < new Date()) {
            return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });
        }

        // ── Step 2: Get user ID from profiles table ────────
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({ error: 'No account found for this email address.' });
        }

        // ── Step 3: Update password via Admin API ──────────
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            profile.id,
            { password: newPassword }
        );

        if (updateError) throw updateError;

        // ── Step 4: Mark token as used ─────────────────────
        await supabaseAdmin
            .from('password_resets')
            .update({
                used:    true,
                used_at: new Date().toISOString()
            })
            .eq('token', token);

        console.log(`Password reset successful for: ${email}`);
        res.json({ success: true, message: 'Password updated successfully' });

    } catch (error) {
        console.error('Reset password error:', error.message);
        res.status(500).json({
            error: 'Failed to reset password',
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Silicon Corridor Backend running on port ${PORT}`);
});
