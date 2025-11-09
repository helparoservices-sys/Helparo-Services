/**
 * MANUAL SECURITY TEST SCRIPT
 * Run this in browser console to test security features
 * NOTE: This is for development/testing only
 */

console.log('🔬 HELPARO SECURITY TEST SUITE');
console.log('================================\n');

// ============================================================================
// 1. XSS PROTECTION TESTS
// ============================================================================
console.log('📝 TEST 1: XSS Protection');
console.log('---------------------------');

const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '<iframe src="javascript:alert(\'XSS\')">',
  '<svg onload=alert("XSS")>',
  'javascript:alert("XSS")',
  '<body onload=alert("XSS")>',
];

console.log('✅ Test these payloads in:');
console.log('  - Review text fields');
console.log('  - Service descriptions');
console.log('  - Chat messages');
console.log('  - Profile bio');
console.log('  - Comments');
console.log('\n⚠️  Expected: All scripts should be stripped/escaped\n');

// ============================================================================
// 2. CSRF TOKEN VALIDATION TEST
// ============================================================================
console.log('📝 TEST 2: CSRF Protection');
console.log('---------------------------');

async function testCSRF() {
  try {
    // Try request without CSRF token
    const response = await fetch('/api/some-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    
    console.log('Status:', response.status);
    console.log('✅ Expected: 403 Forbidden (CSRF token missing)');
    
    if (response.status === 403) {
      console.log('✅ CSRF Protection: WORKING');
    } else {
      console.log('❌ CSRF Protection: FAILED - Request allowed without token');
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

console.log('Run: testCSRF()');
console.log('⚠️  Expected: 403 Forbidden for requests without valid CSRF token\n');

// ============================================================================
// 3. RATE LIMITING TEST
// ============================================================================
console.log('📝 TEST 3: Rate Limiting');
console.log('---------------------------');

async function testRateLimit(endpoint, limit = 10) {
  console.log(`Testing rate limit on ${endpoint}...`);
  const results = { allowed: 0, blocked: 0 };
  
  for (let i = 0; i < limit + 5; i++) {
    try {
      const response = await fetch(endpoint, { method: 'GET' });
      
      if (response.status === 429) {
        results.blocked++;
        console.log(`Request ${i + 1}: ❌ BLOCKED (429 Too Many Requests)`);
      } else {
        results.allowed++;
        console.log(`Request ${i + 1}: ✅ Allowed (${response.status})`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`Request ${i + 1}: Error - ${error.message}`);
    }
  }
  
  console.log('\n📊 Results:', results);
  console.log('✅ Expected: First', limit, 'allowed, rest blocked with 429\n');
  return results;
}

console.log('Run: testRateLimit("/api/endpoint", 10)');
console.log('⚠️  Expected: Requests blocked after limit exceeded\n');

// ============================================================================
// 4. INPUT VALIDATION TEST
// ============================================================================
console.log('📝 TEST 4: Input Validation');
console.log('---------------------------');

const invalidInputs = {
  email: ['invalid-email', 'test@', '@test.com', 'test@test', ''],
  phone: ['123', 'abc123', '+91abc', '1234567890123456', ''],
  url: ['not-a-url', 'javascript:alert(1)', 'file:///etc/passwd', ''],
  numbers: ['-1', 'abc', '999999999999', '', null],
};

console.log('✅ Test these invalid inputs:');
Object.entries(invalidInputs).forEach(([field, values]) => {
  console.log(`  ${field}:`, values);
});
console.log('\n⚠️  Expected: Clear validation error messages\n');

// ============================================================================
// 5. AUTHENTICATION TEST
// ============================================================================
console.log('📝 TEST 5: Authentication & Authorization');
console.log('---------------------------');

async function testAuth() {
  // Test 1: Access protected route without login
  console.log('Test 1: Accessing /customer/dashboard without login...');
  window.open('/customer/dashboard', '_blank');
  console.log('✅ Expected: Redirect to /auth/login\n');
  
  // Test 2: Access admin route as customer
  console.log('Test 2: Try accessing /admin/dashboard as customer...');
  console.log('✅ Expected: 403 Forbidden or redirect\n');
  
  // Test 3: Access helper route as customer
  console.log('Test 3: Try accessing /helper/dashboard as customer...');
  console.log('✅ Expected: 403 Forbidden or redirect\n');
}

console.log('Run: testAuth()');
console.log('⚠️  Expected: Proper authentication and role-based access control\n');

// ============================================================================
// 6. SQL INJECTION TEST
// ============================================================================
console.log('📝 TEST 6: SQL Injection Protection');
console.log('---------------------------');

const sqlInjectionPayloads = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "admin'--",
  "' UNION SELECT * FROM users--",
  "1; DELETE FROM users WHERE 1=1--",
];

console.log('✅ Test these payloads in search/filter fields:');
sqlInjectionPayloads.forEach(payload => console.log(`  - "${payload}"`));
console.log('\n⚠️  Expected: No SQL errors, queries properly parameterized\n');

// ============================================================================
// 7. FILE UPLOAD SECURITY TEST
// ============================================================================
console.log('📝 TEST 7: File Upload Security');
console.log('---------------------------');

const maliciousFiles = [
  { name: 'test.exe', type: 'application/x-msdownload' },
  { name: 'test.sh', type: 'application/x-sh' },
  { name: 'test.php', type: 'application/x-httpd-php' },
  { name: 'test.js', type: 'application/javascript' },
  { name: '../../../etc/passwd', type: 'text/plain' },
];

console.log('✅ Try uploading these files:');
maliciousFiles.forEach(file => console.log(`  - ${file.name} (${file.type})`));
console.log('\n⚠️  Expected: Only image/document types accepted, size limits enforced\n');

// ============================================================================
// 8. SESSION SECURITY TEST
// ============================================================================
console.log('📝 TEST 8: Session Security');
console.log('---------------------------');

function checkSessionSecurity() {
  const cookies = document.cookie.split(';').map(c => c.trim());
  console.log('Current cookies:', cookies);
  
  // Check for secure flags
  console.log('\n✅ Verify cookies have:');
  console.log('  - HttpOnly flag (prevents XSS access)');
  console.log('  - Secure flag (HTTPS only)');
  console.log('  - SameSite=Lax/Strict (prevents CSRF)');
  console.log('\n⚠️  Check browser DevTools > Application > Cookies\n');
}

console.log('Run: checkSessionSecurity()');

// ============================================================================
// 9. SECURITY HEADERS TEST
// ============================================================================
console.log('📝 TEST 9: Security Headers');
console.log('---------------------------');

async function checkSecurityHeaders() {
  const response = await fetch(window.location.href);
  const headers = {
    'Content-Security-Policy': response.headers.get('Content-Security-Policy'),
    'X-Frame-Options': response.headers.get('X-Frame-Options'),
    'X-Content-Type-Options': response.headers.get('X-Content-Type-Options'),
    'Strict-Transport-Security': response.headers.get('Strict-Transport-Security'),
    'Referrer-Policy': response.headers.get('Referrer-Policy'),
  };
  
  console.log('Security Headers:');
  Object.entries(headers).forEach(([name, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`${status} ${name}: ${value || 'MISSING'}`);
  });
  
  console.log('\n⚠️  All headers should be present\n');
}

console.log('Run: checkSecurityHeaders()');

// ============================================================================
// 10. PERFORMANCE TEST
// ============================================================================
console.log('📝 TEST 10: Performance & Web Vitals');
console.log('---------------------------');

function checkPerformance() {
  if ('PerformanceObserver' in window) {
    console.log('Performance Monitoring: ✅ Available');
    console.log('Check DevTools Console for Web Vitals (CLS, FID, LCP)');
  } else {
    console.log('Performance Monitoring: ❌ Not available in this browser');
  }
  
  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation) {
    console.log('\nPage Load Times:');
    console.log(`  DNS Lookup: ${navigation.domainLookupEnd - navigation.domainLookupStart}ms`);
    console.log(`  TCP Connection: ${navigation.connectEnd - navigation.connectStart}ms`);
    console.log(`  Request: ${navigation.responseStart - navigation.requestStart}ms`);
    console.log(`  Response: ${navigation.responseEnd - navigation.responseStart}ms`);
    console.log(`  DOM Processing: ${navigation.domComplete - navigation.domLoading}ms`);
    console.log(`  Total Load Time: ${navigation.loadEventEnd - navigation.fetchStart}ms`);
  }
  
  console.log('\n✅ Expected: Page load < 2 seconds\n');
}

console.log('Run: checkPerformance()');

// ============================================================================
// EXPORT TEST FUNCTIONS
// ============================================================================
console.log('\n🎯 QUICK TEST COMMANDS:');
console.log('========================');
console.log('testCSRF()           - Test CSRF protection');
console.log('testRateLimit(url)   - Test rate limiting');
console.log('testAuth()           - Test authentication');
console.log('checkSessionSecurity() - Check cookie security');
console.log('checkSecurityHeaders() - Check HTTP headers');
console.log('checkPerformance()   - Check page performance');
console.log('\n📚 For full testing, follow SECURITY_TEST_PLAN.md');
console.log('================================\n');

// Export functions to global scope for easy access
window.helparoTests = {
  testCSRF,
  testRateLimit,
  testAuth,
  checkSessionSecurity,
  checkSecurityHeaders,
  checkPerformance,
};

console.log('✅ All test functions available via window.helparoTests');
