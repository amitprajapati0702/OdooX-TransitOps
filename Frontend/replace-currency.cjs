const fs = require('fs');
const path = require('path');

const files = [
  'Trips.jsx',
  'Maintenance.jsx',
  'Fleet.jsx',
  'Finance.jsx',
  'Overview.jsx',
  'Analytics.jsx'
];

for (const file of files) {
  const filePath = path.join(__dirname, 'src', 'pages', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Update currency formatter
    content = content.replace(/currency:\s*"USD"/g, 'currency: "INR"');
    content = content.replace(/"en-US"/g, '"en-IN"');
    
    // Update hardcoded labels
    content = content.replace(/\(\$\)/g, '(₹)');
    content = content.replace(/\(\$\s-\sOptional\)/g, '(₹ - Optional)');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + file);
  } else {
    console.log('Skipped ' + file);
  }
}
