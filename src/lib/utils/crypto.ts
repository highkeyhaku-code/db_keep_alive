import crypto from "node:crypto";
import { env } from "@/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM推奨の12バイト (96ビット)

export interface EncryptedData {
  encryptedText: string;
  iv: string;
  authTag: string;
}

/**
 * 環境変数 ENCRYPTION_KEY から AES-256 用の 32バイト鍵 Buffer を生成する
 */
function getEncryptionKey(): Buffer {
  const rawKey = env.ENCRYPTION_KEY;

  // 64文字の16進数文字列（32バイト相当）の場合
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, "hex");
  }

  // ちょうど32バイトのUTF-8文字列の場合
  const utf8Buffer = Buffer.from(rawKey, "utf8");
  if (utf8Buffer.byteLength === 32) {
    return utf8Buffer;
  }

  // それ以外の32文字以上の文字列の場合は SHA-256 で32バイトに正規化
  return crypto.createHash("sha256").update(rawKey).digest();
}

/**
 * 平文のAPIキーを AES-256-GCM で暗号化する
 */
export function encrypt(plainText: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encryptedText = cipher.update(plainText, "utf8", "hex");
  encryptedText += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedText,
    iv: iv.toString("hex"),
    authTag,
  };
}

/**
 * AES-256-GCM で暗号化されたデータを復号化する
 */
export function decrypt(
  encryptedText: string,
  iv: string,
  authTag: string
): string {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
