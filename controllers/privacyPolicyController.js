const fs = require('fs');
const path = require('path');

// Path to save the Privacy Policy text (can be a database in production)
const privacyPolicyPath = path.join(__dirname, '../data/privacy-policy.txt');

// Read Privacy Policy
exports.getPrivacyPolicy = (req, res) => {
    console.log('Fetching Privacy Policy...');
    fs.readFile(privacyPolicyPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading privacy policy file:', err);
            return res.status(500).json({ error: 'Failed to load Privacy Policy' });
        }
        console.log('Fetched Privacy Policy:', data); // Log the fetched content
        res.status(200).json({ policy: data });
    });
};

// Update Privacy Policy
exports.updatePrivacyPolicy = (req, res) => {
    const { policyText } = req.body;

    console.log('Received new Privacy Policy:', policyText); // Log incoming data

    if (!policyText || typeof policyText !== 'string') {
        return res.status(400).json({ error: 'Invalid Privacy Policy content' });
    }

    fs.writeFile(privacyPolicyPath, policyText, (err) => {
        if (err) {
            console.error('Error writing to privacy policy file:', err);
            return res.status(500).json({ error: 'Failed to update Privacy Policy' });
        }
        console.log('Privacy Policy updated successfully.');
        res.status(200).json({ message: 'Privacy Policy updated successfully' });
    });
};
