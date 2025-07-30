// Preview email templates by generating HTML files
// Usage: node test/preview-email-templates.js

import { TemplateEngine } from '../utils/template-engine.js';
import { formatDateForEmail } from '../utils/functions.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function previewEmailTemplates() {
    console.log('🎨 Generating Email Template Previews...\n');

    // Create preview directory
    const previewDir = join(__dirname, 'email-previews');
    try {
        mkdirSync(previewDir, { recursive: true });
    } catch (err) {
        // Directory might already exist
    }

    // Sample session data for preview
    const sampleData = {
        appName: 'Supportly - support made easy',
        customerName: 'Alice Johnson',
        customerEmail: 'alice.johnson@example.com',
        agentName: 'Michael Chen',
        agentEmail: 'michael.chen@supportly.com',
        sessionId: 'SESS-98765',
        subject: 'Payment Processing Error',
        category: 'Billing & Payments',
        description: 'Customer experiencing issues with credit card payment processing during checkout',
        sessionDate: formatDateForEmail(new Date()),
        summary: 'Successfully resolved payment processing issue. The problem was caused by an expired SSL certificate on the payment gateway. Customer was guided through using an alternative payment method while the technical team resolved the certificate issue. Payment completed successfully using PayPal. Recommended checking payment gateway status page for future issues.',
        transcripts: [
            {
                speakerName: 'Alice Johnson',
                transcript: 'Hi, I\'m trying to make a payment but it keeps failing at checkout.',
                timestamp: formatDateForEmail(new Date(Date.now() - 900000))
            },
            {
                speakerName: 'Michael Chen',
                transcript: 'I\'m sorry to hear about the payment issue. Let me check our payment system status. Can you tell me which payment method you\'re trying to use?',
                timestamp: formatDateForEmail(new Date(Date.now() - 880000))
            },
            {
                speakerName: 'Alice Johnson',
                transcript: 'I\'m using my Visa credit card ending in 4532. It worked fine last month.',
                timestamp: formatDateForEmail(new Date(Date.now() - 860000))
            },
            {
                speakerName: 'Michael Chen',
                transcript: 'I see the issue. There\'s a temporary problem with our credit card processor. Let me offer you an alternative - would you like to try PayPal?',
                timestamp: formatDateForEmail(new Date(Date.now() - 840000))
            },
            {
                speakerName: 'Alice Johnson',
                transcript: 'Yes, that would work. How do I switch to PayPal?',
                timestamp: formatDateForEmail(new Date(Date.now() - 820000))
            },
            {
                speakerName: 'Michael Chen',
                transcript: 'Perfect! I\'ll guide you through it. On the payment page, look for the PayPal option and click it...',
                timestamp: formatDateForEmail(new Date(Date.now() - 800000))
            },
            {
                speakerName: 'Alice Johnson',
                transcript: 'Great! The payment went through successfully. Thank you for the quick help!',
                timestamp: formatDateForEmail(new Date(Date.now() - 780000))
            }
        ],
        duration: 18,
        messageCount: 12,
        transcriptCount: 7,
        resolutionTime: 18,
        priority: 'High',
        status: 'Completed',
        ratingLink: 'https://supportly.com/rating/SESS-98765',
        supportUrl: 'https://supportly.com/support',
        unsubscribeUrl: 'https://supportly.com/unsubscribe',
        dashboardUrl: 'https://supportly.com/dashboard',
        sessionDetailUrl: 'https://supportly.com/session/SESS-98765',
        preferencesUrl: 'https://supportly.com/preferences'
    };

    try {
        // Generate Customer Email Preview
        console.log('📧 Generating customer email preview...');
        const customerHtml = await TemplateEngine.render('customer-session-summary', sampleData);
        const customerPreviewPath = join(previewDir, 'customer-session-summary-preview.html');
        writeFileSync(customerPreviewPath, customerHtml);
        console.log(`✅ Customer email preview saved: ${customerPreviewPath}`);

        // Generate Agent Email Preview
        console.log('📧 Generating agent email preview...');
        const agentHtml = await TemplateEngine.render('agent-session-summary', sampleData);
        const agentPreviewPath = join(previewDir, 'agent-session-summary-preview.html');
        writeFileSync(agentPreviewPath, agentHtml);
        console.log(`✅ Agent email preview saved: ${agentPreviewPath}`);

        console.log('\n🎉 Email template previews generated successfully!');
        console.log('\n📂 Preview files created:');
        console.log(`   • Customer: ${customerPreviewPath}`);
        console.log(`   • Agent: ${agentPreviewPath}`);
        console.log('\n💡 Open these HTML files in your browser to preview the email templates.');

    } catch (error) {
        console.error('❌ Error generating email previews:', error);
        process.exit(1);
    }
}

// Run the preview generator
if (import.meta.url === `file://${process.argv[1]}`) {
    previewEmailTemplates();
}

export default previewEmailTemplates;
