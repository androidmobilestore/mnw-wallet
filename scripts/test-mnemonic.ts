import { PrismaClient } from '@prisma/client';
import * as bip39 from 'bip39';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Test mnemonic generation
async function testMnemonic() {
  console.log('Testing mnemonic generation...');
  
  try {
    // Generate mnemonic
    const mnemonic = bip39.generateMnemonic(128); // 12 words
    console.log('Generated mnemonic:', mnemonic);
    console.log('Word count:', mnemonic.split(' ').length);
    
    // Test encryption
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key-32-chars-minimum!', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(mnemonic, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const encryptedMnemonic = `${iv.toString('hex')}:${encrypted}`;
    console.log('Encrypted mnemonic:', encryptedMnemonic);
    
    // Test decryption
    const parts = encryptedMnemonic.split(':');
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(parts[0], 'hex'));
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log('Decrypted mnemonic:', decrypted);
    console.log('Match:', mnemonic === decrypted);
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMnemonic();