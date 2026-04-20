const API_KEY = 'AIzaSyCjSmwZCuSvCCsrOwxuoaUest9Xl0chKxg';

async function testEndpoint(version) {
  const url = `https://generativelanguage.googleapis.com/${version}/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  console.log(`\nTesting ${version} endpoint...`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
    });
    const data = await response.json();
    if (response.ok) {
      console.log(`[SUCCESS] ${version} worked!`);
    } else {
      console.log(`[FAILED] ${version} status: ${response.status} - ${JSON.stringify(data.error?.message || data)}`);
    }
  } catch (err) {
    console.log(`[ERROR] ${version}: ${err.message}`);
  }
}

async function run() {
  await testEndpoint('v1');
  await testEndpoint('v1beta');
}

run();
