const fs = require('fs');
const path = require('path');

// 1. Update package.json
const pkgPath = path.join(__dirname, '..', 'package.json');
try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    // Add script
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['pages:build'] = 'npx @cloudflare/next-on-pages';
    
    // Add dev dependency (if not present)
    pkg.devDependencies = pkg.devDependencies || {};
    if (!pkg.devDependencies['@cloudflare/next-on-pages']) {
        pkg.devDependencies['@cloudflare/next-on-pages'] = '^1.13.7';
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('Updated package.json');
} catch (e) {
    console.error('Error updating package.json:', e);
}

// 2. Update contact.ts
const contactPath = path.join(__dirname, '..', 'app', 'actions', 'contact.ts');
try {
    let content = fs.readFileSync(contactPath, 'utf8');
    
    // Replace sender email
    const oldEmail = "from: 'Fortress <onboarding@resend.dev>'";
    const newEmail = "from: 'Fortress <onboarding@fortress-stack.tech>'";
    
    if (content.includes(oldEmail)) {
        content = content.replace(oldEmail, newEmail);
        fs.writeFileSync(contactPath, content);
        console.log('Updated contact.ts email sender');
    } else {
        console.log('contact.ts email sender already updated or not found');
    }

} catch (e) {
    console.error('Error updating contact.ts:', e);
}
