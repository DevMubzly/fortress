const fs = require('fs');
const path = require('path');

// 1. Update package.json
try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    let pkgStr = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgStr);
    
    // Add script
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['pages:build'] = 'npx @cloudflare/next-on-pages';
    
    // Add dev dependency
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
try {
    const contactPath = path.join(__dirname, '..', 'app', 'actions', 'contact.ts');
    let content = fs.readFileSync(contactPath, 'utf8');
    
    // Regex for email replacement
    const oldEmailRegex = /from:\s*'Fortress\s*<onboarding@resend\.dev>'/g;
    const newEmail = "from: 'Fortress <onboarding@fortress-stack.tech>'";
    
    let updated = false;
    if (oldEmailRegex.test(content)) {
        content = content.replace(oldEmailRegex, newEmail);
        fs.writeFileSync(contactPath, content);
        updated = true;
        console.log('Updated contact.ts email sender');
    } else {
        console.log('contact.ts email sender already updated or not found');
    }

} catch (e) {
    console.error('Error updating contact.ts:', e);
}
