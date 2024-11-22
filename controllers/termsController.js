const fs = require('fs');
const path = require('path');

// Path to save the Terms and Conditions text (can be a database in production)
const termsPath = path.join(__dirname, '../data/terms-and-conditions.txt');

// Read Terms and Conditions
exports.getTerms = (req, res) => {
    fs.readFile(termsPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to load Terms and Conditions' });
        }
        res.status(200).json({ terms: data });
    });
};

// Update Terms and Conditions
exports.updateTerms = (req, res) => {
    const { termsText } = req.body;

    if (!termsText || typeof termsText !== 'string') {
        return res.status(400).json({ error: 'Invalid Terms and Conditions content' });
    }

    // Optional: Sanitize the input (same as privacy policy)
    const sanitizeHtml = require('sanitize-html');
    const sanitizedText = sanitizeHtml(termsText, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['b', 'i', 'u', 'a', 'p']),
        allowedAttributes: {
            a: ['href', 'target'],
        },
    });

    fs.writeFile(termsPath, sanitizedText, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to update Terms and Conditions' });
        }
        res.status(200).json({ message: 'Terms and Conditions updated successfully' });
    });
};
