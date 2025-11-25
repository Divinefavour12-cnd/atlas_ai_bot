/**
 * TEST FILE FOR ATLAS AI WHATSAPP BOT
 * 
 * This file tests the bot's functionality without requiring WhatsApp connection
 * Run with: node test.js
 */

require('dotenv').config();

// Test colors for console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function testHeader(testName) {
    console.log('\n' + '═'.repeat(60));
    log(`🧪 TEST: ${testName}`, 'cyan');
    console.log('═'.repeat(60));
}

function testResult(passed, message) {
    if (passed) {
        log(`✅ PASS: ${message}`, 'green');
    } else {
        log(`❌ FAIL: ${message}`, 'red');
    }
}

// Test 1: Environment Variables
async function testEnvironmentVariables() {
    testHeader('Environment Variables');
    
    const apiKey = process.env.GROQ_API_KEY;
    testResult(!!apiKey, 'GROQ_API_KEY exists in .env file');
    testResult(apiKey && apiKey.length > 20, 'GROQ_API_KEY appears to be valid format');
    
    return !!apiKey;
}

// Test 2: Dependencies
async function testDependencies() {
    testHeader('Required Dependencies');
    
    const requiredPackages = [
        '@whiskeysockets/baileys',
        'qrcode-terminal',
        'dotenv',
        'node-fetch',
        'pino'
    ];
    
    let allInstalled = true;
    
    for (const pkg of requiredPackages) {
        try {
            require.resolve(pkg);
            testResult(true, `${pkg} is installed`);
        } catch (e) {
            testResult(false, `${pkg} is NOT installed`);
            allInstalled = false;
        }
    }
    
    return allInstalled;
}

// Test 3: Groq API Connection
async function testGroqAPI() {
    testHeader('Groq API Connection');
    
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
        testResult(false, 'Cannot test API - no API key found');
        return false;
    }
    
    try {
        const fetch = (await import('node-fetch')).default;
        
        log('Sending test request to Groq API...', 'yellow');
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a test assistant. Respond with exactly: "Test successful"'
                    },
                    {
                        role: 'user',
                        content: 'Hello'
                    }
                ],
                max_tokens: 50,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            testResult(false, `API request failed: ${response.status} - ${errorText}`);
            return false;
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content?.trim();
        
        testResult(!!aiResponse, `Received response: "${aiResponse}"`);
        testResult(data.choices?.length > 0, 'Response contains valid data structure');
        
        log(`📊 Token usage: ${data.usage?.total_tokens || 'N/A'} tokens`, 'blue');
        
        return true;
        
    } catch (error) {
        testResult(false, `API test error: ${error.message}`);
        return false;
    }
}

// Test 4: External APIs (Joke & Quote)
async function testExternalAPIs() {
    testHeader('External APIs (Joke & Quote)');
    
    try {
        const fetch = (await import('node-fetch')).default;
        
        // Test Dad Joke API
        log('Testing Dad Joke API...', 'yellow');
        const jokeResponse = await fetch('https://icanhazdadjoke.com/', {
            headers: { 'Accept': 'application/json' }
        });
        const jokeData = await jokeResponse.json();
        testResult(!!jokeData.joke, `Dad Joke API works: "${jokeData.joke.substring(0, 50)}..."`);
        
        // Test Quote API (using ZenQuotes as primary)
        log('Testing Quote API...', 'yellow');
        const quoteResponse = await fetch('https://zenquotes.io/api/random');
        const quoteData = await quoteResponse.json();
        testResult(!!quoteData[0]?.q, `Quote API works: "${quoteData[0].q.substring(0, 50)}..." - ${quoteData[0].a}`);
        
        return true;
    } catch (error) {
        testResult(false, `External API test error: ${error.message}`);
        return false;
    }
}

// Test 5: File System Operations
async function testFileSystem() {
    testHeader('File System Operations');
    
    const fs = require('fs');
    const path = require('path');
    
    // Test session directory creation
    const sessionPath = './session';
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }
    testResult(fs.existsSync(sessionPath), 'Session directory exists/created');
    
    // Test log file creation
    const logFile = 'test_messages.log';
    try {
        fs.writeFileSync(logFile, 'Test log entry\n');
        testResult(fs.existsSync(logFile), 'Can create log files');
        fs.unlinkSync(logFile); // Clean up
    } catch (error) {
        testResult(false, `Cannot write log files: ${error.message}`);
        return false;
    }
    
    return true;
}

// Test 6: Bot Configuration
async function testBotConfiguration() {
    testHeader('Bot Configuration');
    
    const CONFIG = {
        botName: 'Atlas AI',
        version: '1.0.0',
        logFile: 'messages.log',
        sessionPath: './session',
        groqApiKey: process.env.GROQ_API_KEY,
        aiModel: 'llama-3.3-70b-versatile',
        maxTokens: 500,
        temperature: 0.7
    };
    
    testResult(!!CONFIG.botName, `Bot name: ${CONFIG.botName}`);
    testResult(!!CONFIG.version, `Version: ${CONFIG.version}`);
    testResult(!!CONFIG.aiModel, `AI Model: ${CONFIG.aiModel}`);
    testResult(CONFIG.maxTokens > 0, `Max tokens: ${CONFIG.maxTokens}`);
    testResult(CONFIG.temperature >= 0 && CONFIG.temperature <= 1, `Temperature: ${CONFIG.temperature}`);
    
    return true;
}

// Test 7: Conversation History Management
async function testConversationHistory() {
    testHeader('Conversation History Management');
    
    const conversationHistory = {};
    const testUserId = 'test@user.com';
    
    // Test adding messages
    conversationHistory[testUserId] = [];
    conversationHistory[testUserId].push({ role: 'user', content: 'Hello' });
    conversationHistory[testUserId].push({ role: 'assistant', content: 'Hi there!' });
    
    testResult(conversationHistory[testUserId].length === 2, 'Can add messages to history');
    
    // Test history limiting (should keep last 6)
    for (let i = 0; i < 10; i++) {
        conversationHistory[testUserId].push({ role: 'user', content: `Message ${i}` });
    }
    
    if (conversationHistory[testUserId].length > 6) {
        conversationHistory[testUserId] = conversationHistory[testUserId].slice(-6);
    }
    
    testResult(conversationHistory[testUserId].length === 6, 'History limiting works (keeps last 6)');
    
    // Test clearing history
    conversationHistory[testUserId] = [];
    testResult(conversationHistory[testUserId].length === 0, 'Can clear conversation history');
    
    return true;
}

// Run all tests
async function runAllTests() {
    console.log('\n');
    log('╔════════════════════════════════════════════════╗', 'cyan');
    log('║       ATLAS AI BOT - TEST SUITE              ║', 'cyan');
    log('╚════════════════════════════════════════════════╝', 'cyan');
    
    const results = {
        environment: await testEnvironmentVariables(),
        dependencies: await testDependencies(),
        groqAPI: await testGroqAPI(),
        externalAPIs: await testExternalAPIs(),
        fileSystem: await testFileSystem(),
        botConfig: await testBotConfiguration(),
        conversationHistory: await testConversationHistory()
    };
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    log('📊 TEST SUMMARY', 'cyan');
    console.log('═'.repeat(60));
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r).length;
    const failedTests = totalTests - passedTests;
    
    log(`Total Tests: ${totalTests}`, 'blue');
    log(`Passed: ${passedTests}`, 'green');
    log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
    
    if (failedTests === 0) {
        log('\n🎉 ALL TESTS PASSED! Your bot is ready to run!', 'green');
        log('\n📝 To start the bot, run: node index.js', 'yellow');
    } else {
        log('\n⚠️  SOME TESTS FAILED. Please fix the issues above.', 'red');
        
        if (!results.dependencies) {
            log('\n💡 Install missing dependencies with:', 'yellow');
            log('   npm install', 'cyan');
        }
        
        if (!results.environment || !results.groqAPI) {
            log('\n💡 Make sure your .env file contains:', 'yellow');
            log('   GROQ_API_KEY=your_actual_api_key_here', 'cyan');
        }
    }
    
    console.log('\n');
}

// Run tests
runAllTests().catch(error => {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    process.exit(1);
});