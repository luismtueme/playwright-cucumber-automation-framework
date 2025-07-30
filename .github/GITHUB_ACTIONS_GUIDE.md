# GitHub Actions Workflow

This directory contains the GitHub Actions workflow configuration for automated testing.

## 📋 **Available Workflows**

### `playwright.yml`
Automated testing workflow that runs on every push and pull request.

**Features:**
- ✅ Runs Cucumber tests with Playwright
- ✅ Generates Allure reports
- ✅ Deploys reports to GitHub Pages
- ✅ Caches Allure history for trend analysis
- ✅ Supports multiple operating systems

## 🚀 **Setup Instructions**

### 1. **Enable GitHub Pages** (for Allure reports)
1. Go to your repository Settings
2. Navigate to Pages section
3. Set Source to "Deploy from a branch"
4. Select branch: `gh-pages`
5. Click Save

### 2. **Customize the Workflow** (Optional)

#### **Change Test Tags:**
Edit `.github/workflows/playwright.yml` line 44:
```yaml
# Run all tests
run: npx cucumber-js

# Or run specific tags
# run: npx cucumber-js --tags "@Regression"
```

#### **Change Operating System:**
Edit `.github/workflows/playwright.yml` line 18:
```yaml
# Ubuntu (recommended - faster)
runs-on: ubuntu-latest

# Windows
# runs-on: windows-latest

# macOS
# runs-on: macos-latest
```

#### **Enable Scheduled Runs:**
Uncomment lines 12-13 in `.github/workflows/playwright.yml`:
```yaml
schedule:
  - cron: '0 4 * * *'  # Daily at 4 AM UTC
```

## 📊 **Reports**

After each workflow run:
- **Allure Report**: Available at `https://yourusername.github.io/your-repo-name/`
- **Workflow Logs**: Available in the Actions tab of your repository

## 🔧 **Troubleshooting**

### **Workflow Fails:**
1. Check the Actions tab for detailed error logs
2. Ensure all dependencies are properly installed
3. Verify your test configuration is correct

### **Reports Not Deploying:**
1. Ensure GitHub Pages is enabled
2. Check that the `gh-pages` branch is created
3. Verify repository permissions allow workflow deployment

### **Performance Issues:**
1. The workflow uses caching to improve performance
2. Consider using self-hosted runners for faster execution
3. Optimize test execution time by using parallel jobs

## 📝 **Customization Examples**

### **Add Environment Variables:**
```yaml
- name: Run Tests with Environment
  run: npx cucumber-js
  env:
    NODE_ENV: production
    API_URL: ${{ secrets.API_URL }}
```

### **Run Tests in Parallel:**
```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
```

### **Add Slack Notifications:**
```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
``` 