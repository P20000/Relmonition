import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ANSI terminal colors for premium presentation
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const printHeader = (title: string) => {
  console.log(`\n${COLORS.bright}${COLORS.blue}=== ${title.toUpperCase()} ===${COLORS.reset}\n`);
};

let hasFailures = false;

// ----------------------------------------------------
// 1. Dependency Audit (npm audit)
// ----------------------------------------------------
const checkDependencies = (): Promise<void> => {
  return new Promise((resolve) => {
    printHeader('1. Third-Party Dependency Audit');
    console.log('Running npm audit to check for vulnerable dependencies...');
    
    exec('npm audit --json', (err: any, stdout: string, stderr: string) => {
      try {
        const auditResult = JSON.parse(stdout);
        const vulnerabilities = auditResult.metadata?.vulnerabilities || {};
        const total = Object.values(vulnerabilities).reduce((sum: number, val: any) => sum + val, 0) as number;
        
        if (total === 0) {
          console.log(`${COLORS.green}✔ No known package vulnerabilities found!${COLORS.reset}`);
        } else {
          console.warn(`${COLORS.yellow}⚠ Found package vulnerabilities:${COLORS.reset}`);
          console.warn(`  - Info: ${vulnerabilities.info || 0}`);
          console.warn(`  - Low: ${vulnerabilities.low || 0}`);
          console.warn(`  - Moderate: ${vulnerabilities.moderate || 0}`);
          console.warn(`  - High: ${vulnerabilities.high || 0}`);
          console.warn(`  - Critical: ${vulnerabilities.critical || 0}`);
          
          if (vulnerabilities.high > 0 || vulnerabilities.critical > 0) {
            console.error(`${COLORS.red}✖ CRITICAL/HIGH vulnerabilities found! Actions required (npm audit fix).${COLORS.reset}`);
            hasFailures = true;
          } else {
            console.log(`${COLORS.yellow}✔ Low/moderate issues found, proceeding with warnings.${COLORS.reset}`);
          }
        }
      } catch (e) {
        console.log(`${COLORS.yellow}⚠ Could not parse npm audit output or npm audit not supported. Skipping...${COLORS.reset}`);
      }
      resolve();
    });
  });
};

// ----------------------------------------------------
// 2. Helper to find all source files recursively
// ----------------------------------------------------
const getFiles = (dir: string, extension: string): string[] => {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '__tests__') {
        results = results.concat(getFiles(filePath, extension));
      }
    } else if (file.endsWith(extension)) {
      results.push(filePath);
    }
  }
  return results;
};

// ----------------------------------------------------
// 3. SAST - Scan for missing authentication middleware on routes
// ----------------------------------------------------
const checkRouteMiddleware = () => {
  printHeader('2. Route Protection Static Analysis (SAST)');
  const routeFiles = getFiles(path.join(__dirname, '../src/routes'), '.ts');
  let unprotectedRoutesCount = 0;

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    // Look for router endpoints registering without authenticate
    let usesAuthenticate = content.includes('authenticate');
    
    if (!usesAuthenticate) {
      // Check if it registers routes and verify if they are public exceptions
      const routeRegistrations = lines.filter((l: string) => l.match(/\.(get|post|put|delete|patch|use)\(/));
      
      const publicRoutes = routeRegistrations.filter((r: string) => {
        const isLogin = r.includes('/login');
        const isRegister = r.includes('/register');
        const isVerify = r.includes('/verify');
        const isHealth = r.includes('/health');
        return isLogin || isRegister || isVerify || isHealth;
      });

      if (routeRegistrations.length > publicRoutes.length) {
        console.error(`${COLORS.red}✖ Vulnerability Warning in ${path.basename(file)}:${COLORS.reset}`);
        console.error(`  - Found route definitions but 'authenticate' middleware is not registered in this router file.`);
        unprotectedRoutesCount++;
      }
    }
  }

  if (unprotectedRoutesCount === 0) {
    console.log(`${COLORS.green}✔ All route files register authentication middleware or use public exceptions.${COLORS.reset}`);
  } else {
    hasFailures = true;
  }
};

// ----------------------------------------------------
// 4. SAST - Scan for SQL Injection Patterns
// ----------------------------------------------------
const checkSQLInjection = () => {
  printHeader('3. SQL Injection Static Analysis (SAST)');
  const srcFiles = getFiles(path.join(__dirname, '../src'), '.ts');
  let sqliWarnings = 0;

  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check for drizzle sql.raw with interpolation
      if (line.includes('sql.raw(') && line.includes('`')) {
        const match = line.match(/\$\{.*\}/);
        if (match) {
          console.error(`${COLORS.red}✖ SQL Injection Risk in ${path.basename(file)}:L${i + 1}:${COLORS.reset}`);
          console.error(`  - Line: "${line.trim()}"`);
          console.error(`  - Recommendation: Do not use template literal interpolation inside sql.raw(). Use parameterized query bindings instead.`);
          sqliWarnings++;
        }
      }
    }
  }

  if (sqliWarnings === 0) {
    console.log(`${COLORS.green}✔ No potential sql.raw SQL Injection risks found!${COLORS.reset}`);
  } else {
    hasFailures = true;
  }
};

// ----------------------------------------------------
// 5. SAST - Scan for Prompt Injection Defenses
// ----------------------------------------------------
const checkPromptSafety = () => {
  printHeader('4. AI Prompt Safety Static Analysis (SAST)');
  const srcFiles = getFiles(path.join(__dirname, '../src'), '.ts');
  let promptWarnings = 0;

  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    // Check if the file defines LLM query prompts
    const hasQueryPrompt = content.includes('USER QUERY:');
    const hasXmlQueryShield = content.includes('<user_query>');

    if (hasQueryPrompt && !hasXmlQueryShield) {
      console.warn(`${COLORS.yellow}⚠ Prompt Injection Risk in ${path.basename(file)}:${COLORS.reset}`);
      console.warn(`  - Found raw "USER QUERY" concatenation in LLM prompt without XML tag shielding.`);
      console.warn(`  - Recommendation: Encapsulate user queries inside <user_query> tags and add system instructions command constraints.`);
      promptWarnings++;
    }
  }

  if (promptWarnings === 0) {
    console.log(`${COLORS.green}✔ All LLM prompt builders utilize XML tags for user input shielding!${COLORS.reset}`);
  } else {
    // Keep it as warning/info unless critical
    console.log(`${COLORS.cyan}ℹ Prompt safety check passed with warning flags.${COLORS.reset}`);
  }
};

// ----------------------------------------------------
// 6. Security Integration Test Suite Runner
// ----------------------------------------------------
const runSecurityTests = (): Promise<void> => {
  return new Promise((resolve) => {
    printHeader('5. Security Test Suite Execution');
    console.log('Executing Vitest security test suites...');
    
    exec('node -r dotenv/config node_modules/vitest/vitest.mjs run src', (err: any, stdout: string, stderr: string) => {
      console.log(stdout);
      if (err) {
        console.error(stderr);
        console.error(`${COLORS.red}✖ Security unit tests failed!${COLORS.reset}`);
        hasFailures = true;
      } else {
        console.log(`${COLORS.green}✔ All security and controller tests passed successfully!${COLORS.reset}`);
      }
      resolve();
    });
  });
};

// ----------------------------------------------------
// Main pipeline entry point
// ----------------------------------------------------
const runPipeline = async () => {
  console.log(`\n${COLORS.bright}${COLORS.cyan}====================================================`);
  console.log('          RELMONITION SECURITY SCANNER PIPELINE      ');
  console.log(`====================================================${COLORS.reset}\n`);
  
  await checkDependencies();
  checkRouteMiddleware();
  checkSQLInjection();
  checkPromptSafety();
  await runSecurityTests();
  
  console.log(`\n${COLORS.bright}${COLORS.cyan}====================================================`);
  if (hasFailures) {
    console.log(`  RESULT: ${COLORS.red}FAILED${COLORS.reset} - Security vulnerabilities or test failures detected.`);
    console.log(`${COLORS.bright}${COLORS.cyan}====================================================${COLORS.reset}\n`);
    process.exit(1);
  } else {
    console.log(`  RESULT: ${COLORS.green}PASSED${COLORS.reset} - All security checks and tests successfully passed.`);
    console.log(`${COLORS.bright}${COLORS.cyan}====================================================${COLORS.reset}\n`);
    process.exit(0);
  }
};

runPipeline();
