// Test script to verify simplified email templates and functionality
// Usage: node test/test-session-summary-emails.js
import "dotenv/config";
import mailservice from '../services/mailservice.js';
import connect from './connect.js';

async function testSessionSummaryEmails() {
    console.log('🧪 Testing Simplified Session Summary Email Templates...\n');

    // Sample data for testing
    const sessionId = 'SESS-12345';
    const subject = 'Login Issues with Mobile App';
    const description = 'Customer unable to login to mobile application after recent update';
    const category = 'Technical Support';
    const summary = 'Session resolved successfully. Customer was experiencing login issues due to cached credentials. Guided customer through clearing app cache and re-entering credentials. Issue resolved, customer able to login successfully. Recommended enabling biometric authentication for improved security and convenience.';
    const agentName = 'Sarah Johnson';

    // Mock user (customer) object
    const user = {
        name: 'John Doe',
        email: 'john.doe@example.com'
    };

    // Mock session object
    const session = {
        date: new Date(),
        agentId: {
            email: 'sarah.johnson@supportly.com'
        }
    };

    try {
        console.log('📧 Testing Customer Session Summary Email...');

        if (process.env.NODE_ENV !== 'production') {
            console.log('⚠️  Running in development mode - emails will be sent to local mail server');
        }

        // Test customer summary email
        await mailservice.sendCustomerSessionSummary(sessionId, subject, description, category, summary, agentName, user, session);
        console.log('✅ Customer summary email sent successfully');

        console.log('\n📧 Testing Agent Session Summary Email...');

        // Test agent summary email
        await mailservice.sendAgentSessionSummary(sessionId, subject, description, category, summary, agentName, user, session);
        console.log('✅ Agent summary email sent successfully');

        console.log('\n🎉 All email templates tested successfully!');
        console.log('\n📋 Test Summary:');
        console.log(`   • Session ID: ${sessionId}`);
        console.log(`   • Subject: ${subject}`);
        console.log(`   • Category: ${category}`);
        console.log(`   • Customer: ${user.name} (${user.email})`);
        console.log(`   • Agent: ${agentName}`);
        console.log(`   • Summary: ${summary.substring(0, 100)}...`);

    } catch (error) {
        console.error('❌ Error testing email templates:', error);
        process.exit(1);
    }
}


connect().then(async () => {
    testSessionSummaryEmails();
}).catch(err => {
    console.error(err);
});