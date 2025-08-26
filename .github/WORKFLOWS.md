# 🚀 GitHub Actions Workflows

This repository includes several GitHub Actions workflows for automated building, testing, and releasing of the LUME Desktop Controller.

## 📋 Available Workflows

### 1. 🏗️ Build and Test (`build.yml`)
**Trigger:** Push to `main`/`develop`, PRs to `main`, or manual dispatch

- **Frontend Testing**: Linting, building
- **Multi-platform builds**: macOS, Ubuntu, Windows
- **Debug builds** for testing
- **Artifact uploads** for review

### 2. 🎯 Release Build (`release.yml`)
**Trigger:** Version tags (`v*.*.*`) or manual dispatch

- **Multi-platform releases**:
  - macOS (Intel + Apple Silicon)
  - Windows (x64)
  - Linux (x64)
- **Automatic GitHub releases**
- **Code signing support** (when configured)
- **Professional release notes**

### 3. 📈 Version Bump (`version-bump.yml`)
**Trigger:** Manual dispatch only

- **Semantic versioning**: patch, minor, major bumps
- **Custom versions** supported
- **Automatic commits and tags**
- **Triggers release workflow**

## 🔧 Setup Instructions

### 1. Basic Setup
The workflows will work out-of-the-box for basic builds. No additional setup required!

### 2. Code Signing (Optional but Recommended)

#### macOS Code Signing
Add these secrets to your GitHub repository:
```
APPLE_CERTIFICATE          # Base64 encoded .p12 certificate
APPLE_CERTIFICATE_PASSWORD # Certificate password
APPLE_SIGNING_IDENTITY     # Certificate name (e.g., "Developer ID Application: Your Name")
APPLE_ID                   # Your Apple ID email
APPLE_PASSWORD             # App-specific password
APPLE_TEAM_ID              # Your Apple Developer Team ID
```

#### Windows Code Signing
Add these secrets:
```
WINDOWS_CERTIFICATE         # Base64 encoded .p12 certificate
WINDOWS_CERTIFICATE_PASSWORD # Certificate password
```

### 3. Repository Settings
1. Go to **Settings > Actions > General**
2. Set **Workflow permissions** to "Read and write permissions"
3. Enable **Allow GitHub Actions to create and approve pull requests**

## 📦 How to Create a Release

### Method 1: Version Bump (Recommended)
1. Go to **Actions** tab
2. Click **Version Bump** workflow
3. Click **Run workflow**
4. Choose version type (patch/minor/major) or enter custom version
5. Click **Run workflow**

This will:
- Update version numbers
- Create and push a git tag
- Automatically trigger the release workflow

### Method 2: Manual Tag
```bash
git tag v1.2.2
git push origin v1.2.2
```

### Method 3: Manual Release Workflow
1. Go to **Actions** tab
2. Click **Release Build** workflow
3. Click **Run workflow**
4. Enter version and options
5. Click **Run workflow**

## 📋 Release Artifacts

Each release includes:
- **Windows**: `.exe` and `.msi` installers
- **macOS**: `.dmg` disk image (Intel + Apple Silicon)
- **Linux**: `.AppImage` and `.deb` packages

## 🔍 Monitoring Builds

### Build Status
- ✅ **Green checkmark**: Build successful
- ❌ **Red X**: Build failed
- 🟡 **Yellow dot**: Build in progress

### Viewing Logs
1. Click on any workflow run
2. Click on a job to see detailed logs
3. Download artifacts if available

## 🛠️ Troubleshooting

### Common Issues

1. **Build fails on dependencies**
   - Check Node.js version compatibility
   - Verify package-lock.json is committed

2. **Tauri build fails**
   - Check Rust dependencies
   - Verify tauri.conf.json syntax

3. **Release not created**
   - Check repository permissions
   - Verify tag format (`v1.2.3`)

### Debug Steps
1. Check workflow logs for errors
2. Verify secrets are configured correctly
3. Test locally with `npm run tauri:build`
4. Check Tauri configuration

## 🎯 Best Practices

1. **Use version bump workflow** for consistent versioning
2. **Test in development** before releasing
3. **Keep dependencies updated** regularly
4. **Use semantic versioning** (major.minor.patch)
5. **Write meaningful commit messages**
6. **Review release notes** before publishing

## 📞 Support

If you encounter issues with the workflows:
1. Check the troubleshooting section above
2. Review workflow logs for specific error messages
3. Ensure all required secrets are configured
4. Test builds locally first

---

Happy building! 🎆