# GitHub Actions Workflow

This directory contains the GitHub Actions workflow configuration for automated testing.

## 📋 **Available Workflows**

### `playwright.yml`
Automated testing workflow that runs on every pull request to `main`, every push to `main`, and on demand (Actions tab → Run workflow).

**Jobs:**

| Job | Runs on | What it does |
|-----|---------|--------------|
| `Checks` | PRs and pushes | `npm audit --audit-level=high`, Cucumber dry run (fails on undefined or ambiguous steps), Playwright spec discovery |
| `Tests` | PRs and pushes | Playwright specs, then Cucumber scenarios, headless. Fails if any test fails |
| `Publish Allure Report` | Pushes to `main` only | Builds the Allure report (with trend history) and deploys it to GitHub Pages |

`Checks` and `Tests` are the required status checks for merging into `main`. PR runs never publish a report and need no secrets.

### `dependabot.yml`
Opens weekly PRs for npm and GitHub Actions updates. Minor and patch npm updates are grouped into one PR.

## 🚀 **Setup Instructions**

### 1. **Enable GitHub Pages** (for Allure reports)
1. Go to your repository Settings
2. Navigate to Pages section
3. Set Source to "GitHub Actions"

No personal access token is needed. The workflow deploys with the built-in `GITHUB_TOKEN`.

### 2. **Point the Tests at Your Application**
The examples run against a bundled fixture page (`test-fixtures/example-app.html`) so the pipeline is green out of the box. To test your real app, set `url` in `config/testConfig.json`, or set the `BASE_URL` environment variable in the workflow.

### 3. **Customize the Workflow** (Optional)

#### **Change Test Tags:**
Edit the `Run Cucumber Tests` step in `.github/workflows/playwright.yml`:
```yaml
# Run all tests
run: npx cucumber-js

# Or run specific tags
# run: npx cucumber-js --tags "@Regression"
```

#### **Change Operating System:**
Edit `runs-on` for the `test` job in `.github/workflows/playwright.yml`:
```yaml
# Ubuntu (recommended - faster)
runs-on: ubuntu-latest

# Windows
# runs-on: windows-latest

# macOS
# runs-on: macos-latest
```

#### **Enable Scheduled Runs:**
Uncomment the `schedule` block at the top of `.github/workflows/playwright.yml`:
```yaml
schedule:
  - cron: '0 4 * * *'  # Daily at 4 AM UTC
```

## 📊 **Reports**

After each workflow run:
- **Allure Report** (pushes to `main`): `https://yourusername.github.io/your-repo-name/allure-report/`
- **Test Artifacts** (every run): videos, traces, screenshots and the Playwright HTML report, downloadable from the run summary for 14 days
- **Workflow Logs**: Available in the Actions tab of your repository

## 🔧 **Troubleshooting**

### **Workflow Fails:**
1. Check the Actions tab for detailed error logs
2. Ensure all dependencies are properly installed
3. Verify your test configuration is correct

### **`Checks` Fails on npm audit:**
A dependency has a new high or critical advisory. Run `npm audit` locally, then `npm audit fix` (or merge the Dependabot PR if one is open).

### **Reports Not Deploying:**
1. Ensure Pages Source is set to "GitHub Actions"
2. Reports only publish from pushes to `main`, not from PRs
3. Check the `github-pages` environment allows deployments from `main` (Settings → Environments)

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