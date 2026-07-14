const { encrypt, decrypt, hashForLookup } = require('../../src/utils/encryption');

describe('Encryption Utils', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  describe('encrypt / decrypt', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const plaintext = 'Alice Johnson';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('data');
      expect(encrypted).toHaveProperty('tag');
      expect(encrypted.data).not.toBe(plaintext);

      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext', () => {
      const encrypted1 = encrypt('test@email.com');
      const encrypted2 = encrypt('test@email.com');

      expect(encrypted1.data).not.toBe(encrypted2.data);
      expect(decrypt(encrypted1)).toBe('test@email.com');
      expect(decrypt(encrypted2)).toBe('test@email.com');
    });

    it('should return null for null input', () => {
      expect(encrypt(null)).toBeNull();
      expect(decrypt(null)).toBeNull();
    });
  });

  describe('hashForLookup', () => {
    it('should produce consistent hash for same email', () => {
      const hash1 = hashForLookup('Alice@Example.com');
      const hash2 = hashForLookup('alice@example.com');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different values', () => {
      const hash1 = hashForLookup('alice@example.com');
      const hash2 = hashForLookup('bob@example.com');
      expect(hash1).not.toBe(hash2);
    });
  });
});
