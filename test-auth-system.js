// Test script to verify authentication system
// Run this in browser console to test multiple users

const testUsers = [
  'john.doe@cloud.neduet.edu.pk',
  'mary.sarah@neduet.edu.pk',
  'professor.ali@cloud.neduet.edu.pk',
  'student.test@cloud.neduet.edu.pk',
  'user.invalid@gmail.com' // Should fail
];

async function testAuthentication() {
  console.log('🧪 Starting Authentication Tests...');
  
  for (const email of testUsers) {
    console.log(`\n📧 Testing: ${email}`);
    
    try {
      const { data, error } = await window.supabase.auth.signInWithPassword({
        email: email,
        password: 'test123'
      });
      
      if (error) {
        console.log(`❌ Failed: ${error.message}`);
      } else {
        console.log(`✅ Success: User ${data.user.email} logged in`);
        console.log(`👤 Profile: ${data.user.full_name}`);
      }
      
      // Logout for next test
      await window.supabase.auth.signOut();
      
    } catch (err) {
      console.log(`💥 Error: ${err.message}`);
    }
  }
  
  console.log('\n🎉 Authentication tests completed!');
}

// Function to test 50+ users
async function testMultipleUsers() {
  console.log('👥 Testing 50+ users...');
  
  for (let i = 1; i <= 50; i++) {
    const email = `user${i.toString().padStart(2, '0')}@cloud.neduet.edu.pk`;
    
    try {
      const { data, error } = await window.supabase.auth.signInWithPassword({
        email: email,
        password: `password${i}`
      });
      
      if (error) {
        console.log(`❌ User ${i} failed: ${error.message}`);
      } else {
        console.log(`✅ User ${i} (${email}) success`);
      }
      
      // Logout for next test
      await window.supabase.auth.signOut();
      
    } catch (err) {
      console.log(`💥 User ${i} error: ${err.message}`);
    }
  }
  
  console.log('\n🎉 50+ users test completed!');
}

// Export functions for console use
window.testAuth = testAuthentication;
window.testMultipleUsers = testMultipleUsers;

console.log('🔧 Test functions loaded!');
console.log('Run testAuth() for basic tests');
console.log('Run testMultipleUsers() for 50+ users test');
