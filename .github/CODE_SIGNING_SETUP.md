# 🔐 Code Signing Setup Guide

This guide will help you set up code signing for your LUME Desktop Controller releases to ensure users can run your app without security warnings.

## 📋 Current Status

- **✅ Windows & Linux**: Work without code signing
- **⚠️ macOS**: Shows security warnings without code signing
- **🔧 Auto-Detection**: Workflow automatically detects if signing is available

## 🍎 macOS Code Signing Setup

### Prerequisites

1. **Apple Developer Account** ($99/year)
2. **Developer ID Application Certificate** from Apple
3. **App-specific Password** for your Apple ID

### Step 1: Get Developer Certificate

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/certificates/list)
2. Click **"+"** to create a new certificate
3. Choose **"Developer ID Application"**
4. Follow the instructions to generate and download your certificate
5. Double-click to install it in your Keychain

### Step 2: Export Certificate

1. Open **Keychain Access** on your Mac
2. Find your **"Developer ID Application"** certificate
3. Right-click → **"Export"**
4. Choose **".p12"** format
5. Set a strong password
6. Save the file (e.g., `certificate.p12`)

### Step 3: Convert to Base64

```bash
# Convert your .p12 certificate to base64
base64 -i certificate.p12 -o certificate.base64.txt

# Copy the contents of certificate.base64.txt
cat certificate.base64.txt | pbcopy
```

### Step 4: Create App-Specific Password

1. Go to [Apple ID Account](https://appleid.apple.com/account/manage)
2. Sign in with your Apple Developer account
3. Go to **"App-Specific Passwords"**
4. Click **"+"** to create a new password
5. Label it "GitHub Actions LUME"
6. Copy the generated password

### Step 5: Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these repository secrets:

| Secret Name | Value | Description |
|-------------|--------|-------------|
| `APPLE_CERTIFICATE` | Contents of `certificate.base64.txt` | Base64 encoded .p12 certificate |
| `APPLE_CERTIFICATE_PASSWORD` | Your .p12 password | Password you set when exporting |
| `APPLE_SIGNING_IDENTITY` | Certificate name | e.g., "Developer ID Application: Your Name (XXXXXXXXXX)" |
| `APPLE_ID` | your.email@example.com | Your Apple Developer email |
| `APPLE_PASSWORD` | App-specific password | From Step 4 above |
| `APPLE_TEAM_ID` | Your Team ID | Found in Apple Developer Portal |

### Step 6: Find Your Signing Identity

To find your exact signing identity name:

```bash
# List all certificates in your keychain
security find-identity -v -p codesigning

# Look for something like:
# "Developer ID Application: Your Name (XXXXXXXXXX)"
```

### Step 7: Find Your Team ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Your Team ID is shown in the top-right corner
3. It's a 10-character alphanumeric string (e.g., `ABCD123456`)

## 🪟 Windows Code Signing (Optional)

### Prerequisites

1. **Code Signing Certificate** from a Certificate Authority
2. **EV Certificate** recommended for avoiding SmartScreen warnings

### Setup

Add these GitHub secrets:

| Secret Name | Value | Description |
|-------------|--------|-------------|
| `WINDOWS_CERTIFICATE` | Base64 encoded .p12 | Your Windows code signing certificate |
| `WINDOWS_CERTIFICATE_PASSWORD` | Certificate password | Password for the certificate |

## 🧪 Testing Your Setup

1. **Push a tag** to trigger the release workflow:
   ```bash
   git tag v1.2.2
   git push origin v1.2.2
   ```

2. **Or use the Version Bump workflow**:
   - Go to Actions → Version Bump → Run workflow

3. **Check the build logs** for signing status messages

## 🔍 Troubleshooting

### Common Issues

1. **"SecKeychainItemImport: One or more parameters passed to a function were not valid"**
   - Check your `APPLE_CERTIFICATE` is properly base64 encoded
   - Verify `APPLE_CERTIFICATE_PASSWORD` is correct

2. **"No identity found"**
   - Verify your `APPLE_SIGNING_IDENTITY` exactly matches the certificate name
   - Check the certificate isn't expired

3. **"Authentication failed"**
   - Ensure `APPLE_ID` and `APPLE_PASSWORD` are correct
   - Make sure you're using an app-specific password, not your regular password

### Debug Steps

1. **Check certificate validity**:
   ```bash
   # On your Mac
   security find-identity -v -p codesigning
   ```

2. **Verify base64 encoding**:
   ```bash
   # Test decode (should not error)
   base64 -D certificate.base64.txt > test.p12
   ```

3. **Test certificate import**:
   ```bash
   # Create temporary keychain and test import
   security create-keychain -p test temp.keychain
   security import test.p12 -k temp.keychain -P your_password
   security delete-keychain temp.keychain
   ```

## 🎯 Without Code Signing

If you don't set up code signing:

- **✅ Builds will still work** - the workflow automatically detects missing certificates
- **⚠️ macOS users** will see security warnings:
  1. "Cannot be opened because the developer cannot be verified"
  2. User must right-click → "Open" → "Open" to bypass
- **📦 Release notes** will include instructions for users

## 📞 Support

If you encounter issues:

1. Check the [GitHub Actions logs] for specific error messages
2. Verify all secrets are correctly set
3. Test certificate validity locally first
4. Ensure your Apple Developer account is active

---

**Note**: Code signing setup is optional but highly recommended for better user experience, especially on macOS.