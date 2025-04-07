const fs = require('fs-extra');
const path = require('path');

// Define session directory
const SESSION_DIR = path.join(__dirname, 'whatsapp-session');

async function clearSessions() {
  try {
    // Check if the directory exists
    if (await fs.pathExists(SESSION_DIR)) {
      console.log('Removing WhatsApp session data...');
      await fs.remove(SESSION_DIR);
      console.log('Session data cleared successfully!');
      
      // Also remove QR code image if it exists
      const qrImagePath = path.join(__dirname, 'whatsapp-qr.png');
      if (await fs.pathExists(qrImagePath)) {
        await fs.remove(qrImagePath);
        console.log('QR code image removed.');
      }
    } else {
      console.log('No session data found.');
    }
  } catch (error) {
    console.error('Error clearing session data:', error.message);
  }
}

// Run the function
clearSessions();
