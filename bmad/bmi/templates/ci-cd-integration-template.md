# BMI CI/CD Integration Template

This template demonstrates how to integrate BMI workflows with CI/CD pipelines (GitHub Actions, GitLab CI, Jenkins, etc.) for automated deployments and releases.

---

## Overview

BMI workflows can be invoked from CI/CD pipelines to automate:

1. **Continuous Deployment** - Auto-deploy on merge to main/develop
2. **Automated Releases** - Create releases on version tags
3. **Quality Gates** - Run load tests and performance checks in CI
4. **Incident Response** - Auto-rollback on deployment failures
5. **Monitoring Setup** - Configure monitoring for new deployments

---

## GitHub Actions Integration

### Workflow File Structure

```
.github/workflows/
├── deploy-dev.yml           # Deploy to dev on PR merge
├── deploy-staging.yml       # Deploy to staging on main push
├── deploy-production.yml    # Deploy to production on tag
├── release.yml              # Create release on version tag
└── rollback.yml             # Manual rollback workflow
```

---

### Deploy to Dev (PR Merge)

**.github/workflows/deploy-dev.yml**

```yaml
name: Deploy to Dev

on:
  pull_request:
    types: [closed]
    branches: [develop]

jobs:
  deploy-dev:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup BMAD CLI
        run: |
          # Install BMAD CLI (adjust based on your setup)
          npm install -g @bmad/cli
          # Or: pip install bmad-cli

      - name: Deploy to Dev with BMI
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
        run: |
          bmad-cli invoke bmi/deploy \
            --version "${{ github.sha }}" \
            --environment dev \
            --deployment-strategy rolling \
            --skip-smoke-tests false

      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Deployed to dev: https://dev.myapp.com'
            })
```

---

### Deploy to Staging (Main Branch Push)

**.github/workflows/deploy-staging.yml**

```yaml
name: Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for changelog

      - name: Setup BMAD CLI
        run: npm install -g @bmad/cli

      - name: Deploy to Staging
        env:
          DEPLOY_TOKEN: ${{ secrets.STAGING_DEPLOY_TOKEN }}
        run: |
          bmad-cli invoke bmi/deploy \
            --version "${{ github.sha }}" \
            --environment staging \
            --deployment-strategy blue-green \
            --skip-smoke-tests false

      - name: Run Load Tests
        run: |
          bmad-cli invoke bmi/load-testing \
            --target-url "https://staging.myapp.com" \
            --load-profile peak \
            --virtual-users 200 \
            --duration 600 \
            --success-criteria "p95<500ms,error_rate<1%"

      - name: Setup Monitoring
        if: success()
        env:
          DATADOG_API_KEY: ${{ secrets.DATADOG_API_KEY }}
        run: |
          bmad-cli invoke bmi/monitoring-setup \
            --environment staging \
            --application-name "my-app" \
            --monitoring-categories '["errors","performance","infrastructure"]' \
            --setup-dashboards true \
            --setup-alerts true

      - name: Notify Slack
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Staging deployment ${{ job.status }}: ${{ github.sha }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Staging deployment *${{ job.status }}*\nCommit: `${{ github.sha }}`\nURL: https://staging.myapp.com"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

### Deploy to Production (Version Tag)

**.github/workflows/deploy-production.yml**

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*.*.*'  # Trigger on version tags like v1.2.3

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production  # Requires manual approval in GitHub

    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Extract version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Setup BMAD CLI
        run: npm install -g @bmad/cli

      - name: Pre-Release Quality Gates
        run: |
          # Run quality gates before production
          bmad-cli invoke bmi/load-testing \
            --target-url "https://staging.myapp.com" \
            --load-profile stress \
            --success-criteria "p95<500ms,error_rate<1%"

      - name: Deploy to Production
        env:
          DEPLOY_TOKEN: ${{ secrets.PRODUCTION_DEPLOY_TOKEN }}
        run: |
          bmad-cli invoke bmi/deploy \
            --version "${{ steps.version.outputs.VERSION }}" \
            --environment production \
            --deployment-strategy blue-green \
            --skip-smoke-tests false

      - name: Setup Production Monitoring
        if: success()
        env:
          DATADOG_API_KEY: ${{ secrets.DATADOG_API_KEY }}
        run: |
          bmad-cli invoke bmi/monitoring-setup \
            --environment production \
            --application-name "my-app" \
            --monitoring-categories '["errors","performance","infrastructure","business"]' \
            --setup-dashboards true \
            --setup-alerts true \
            --alert-thresholds '{"error_rate":1.0,"latency_p95":500}'

      - name: Monitor Production (10 min)
        if: success()
        run: |
          echo "Monitoring production for 10 minutes..."
          sleep 600

          # Check production health
          bmad-cli invoke bmi/tasks/run-smoke-tests \
            --target-url "https://myapp.com" \
            --test-categories '["health","api","ui"]'

      - name: Rollback on Failure
        if: failure()
        run: |
          bmad-cli invoke bmi/rollback \
            --rollback-reason "Production deployment failed smoke tests" \
            --rollback-target "previous" \
            --environment production \
            --rollback-strategy "blue-green-instant"

      - name: Notify Team
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Production deployment ${{ job.status }}: v${{ steps.version.outputs.VERSION }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "🚀 Production deployment *${{ job.status }}*\nVersion: `v${{ steps.version.outputs.VERSION }}`\nURL: https://myapp.com"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

### Automated Release Creation

**.github/workflows/release.yml**

```yaml
name: Create Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  create-release:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for changelog

      - name: Extract version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Setup BMAD CLI
        run: npm install -g @bmad/cli

      - name: Create Release with BMI
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          bmad-cli invoke bmi/release \
            --release-version "${{ steps.version.outputs.VERSION }}" \
            --release-type auto \
            --package-ecosystem nodejs_npm \
            --changelog-format github-releases \
            --registry-publish true \
            --create-git-tag false

      - name: Generate Changelog
        run: |
          bmad-cli invoke bmi/changelog-generation \
            --commit-range "$(git describe --tags --abbrev=0 HEAD^)..HEAD" \
            --changelog-format keep-a-changelog \
            --output-file CHANGELOG.md \
            --append-mode true

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release v${{ steps.version.outputs.VERSION }}
          body_path: RELEASE_NOTES.md
          draft: false
          prerelease: false
```

---

### Manual Rollback Workflow

**.github/workflows/rollback.yml**

```yaml
name: Rollback Production

on:
  workflow_dispatch:  # Manual trigger
    inputs:
      rollback_target:
        description: 'Version to rollback to'
        required: true
        type: string
      rollback_reason:
        description: 'Reason for rollback'
        required: true
        type: string

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: production  # Requires approval

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup BMAD CLI
        run: npm install -g @bmad/cli

      - name: Execute Rollback
        env:
          DEPLOY_TOKEN: ${{ secrets.PRODUCTION_DEPLOY_TOKEN }}
        run: |
          bmad-cli invoke bmi/rollback \
            --rollback-reason "${{ github.event.inputs.rollback_reason }}" \
            --rollback-target "${{ github.event.inputs.rollback_target }}" \
            --environment production \
            --rollback-strategy "blue-green-instant"

      - name: Notify Team
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "⚠️ Production rollback executed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "⚠️ *Production Rollback*\nTarget: `${{ github.event.inputs.rollback_target }}`\nReason: ${{ github.event.inputs.rollback_reason }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## GitLab CI Integration

**.gitlab-ci.yml**

```yaml
stages:
  - deploy-dev
  - deploy-staging
  - quality-gates
  - deploy-production

variables:
  BMAD_CLI_VERSION: "latest"

before_script:
  - npm install -g @bmad/cli@${BMAD_CLI_VERSION}

# Deploy to dev on merge to develop
deploy-dev:
  stage: deploy-dev
  only:
    - develop
  script:
    - |
      bmad-cli invoke bmi/deploy \
        --version "${CI_COMMIT_SHA}" \
        --environment dev \
        --deployment-strategy rolling

# Deploy to staging on merge to main
deploy-staging:
  stage: deploy-staging
  only:
    - main
  script:
    - |
      bmad-cli invoke bmi/deploy \
        --version "${CI_COMMIT_SHA}" \
        --environment staging \
        --deployment-strategy blue-green

# Run quality gates
load-tests:
  stage: quality-gates
  only:
    - main
  script:
    - |
      bmad-cli invoke bmi/load-testing \
        --target-url "https://staging.myapp.com" \
        --load-profile peak \
        --success-criteria "p95<500ms,error_rate<1%"

# Deploy to production on tags
deploy-production:
  stage: deploy-production
  only:
    - tags
  when: manual  # Require manual approval
  environment:
    name: production
    url: https://myapp.com
  script:
    - VERSION=${CI_COMMIT_TAG#v}
    - |
      bmad-cli invoke bmi/deploy \
        --version "${VERSION}" \
        --environment production \
        --deployment-strategy blue-green
```

---

## Jenkins Integration

**Jenkinsfile**

```groovy
pipeline {
    agent any

    environment {
        BMAD_CLI = '/usr/local/bin/bmad-cli'
    }

    stages {
        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                sh """
                    ${BMAD_CLI} invoke bmi/deploy \
                        --version ${GIT_COMMIT} \
                        --environment dev \
                        --deployment-strategy rolling
                """
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                sh """
                    ${BMAD_CLI} invoke bmi/deploy \
                        --version ${GIT_COMMIT} \
                        --environment staging \
                        --deployment-strategy blue-green
                """
            }
        }

        stage('Load Tests') {
            when {
                branch 'main'
            }
            steps {
                sh """
                    ${BMAD_CLI} invoke bmi/load-testing \
                        --target-url "https://staging.myapp.com" \
                        --load-profile peak \
                        --success-criteria "p95<500ms,error_rate<1%"
                """
            }
        }

        stage('Deploy to Production') {
            when {
                tag pattern: "v\\d+\\.\\d+\\.\\d+", comparator: "REGEXP"
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'

                sh """
                    VERSION=\$(echo ${GIT_TAG} | sed 's/^v//')
                    ${BMAD_CLI} invoke bmi/deploy \
                        --version \${VERSION} \
                        --environment production \
                        --deployment-strategy blue-green
                """
            }
        }
    }

    post {
        failure {
            script {
                if (env.BRANCH_NAME == 'main' || env.TAG_NAME) {
                    sh """
                        ${BMAD_CLI} invoke bmi/rollback \
                            --rollback-reason "Deployment failed in CI" \
                            --rollback-target "previous" \
                            --environment staging \
                            --rollback-strategy "blue-green-instant"
                    """
                }
            }
        }
    }
}
```

---

## CircleCI Integration

**.circleci/config.yml**

```yaml
version: 2.1

jobs:
  deploy-dev:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - run:
          name: Install BMAD CLI
          command: npm install -g @bmad/cli
      - run:
          name: Deploy to Dev
          command: |
            bmad-cli invoke bmi/deploy \
              --version "${CIRCLE_SHA1}" \
              --environment dev \
              --deployment-strategy rolling

  deploy-staging:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - run:
          name: Install BMAD CLI
          command: npm install -g @bmad/cli
      - run:
          name: Deploy to Staging
          command: |
            bmad-cli invoke bmi/deploy \
              --version "${CIRCLE_SHA1}" \
              --environment staging \
              --deployment-strategy blue-green
      - run:
          name: Run Load Tests
          command: |
            bmad-cli invoke bmi/load-testing \
              --target-url "https://staging.myapp.com" \
              --load-profile peak

workflows:
  version: 2
  deploy:
    jobs:
      - deploy-dev:
          filters:
            branches:
              only: develop
      - deploy-staging:
          filters:
            branches:
              only: main
```

---

## Best Practices

### 1. Environment Secrets

Store deployment credentials securely:

```yaml
# GitHub Actions
secrets:
  - DEPLOY_TOKEN
  - NPM_TOKEN
  - DATADOG_API_KEY
  - SLACK_WEBHOOK_URL
```

### 2. Quality Gates

Always run quality gates before production:

```yaml
- Load tests (required)
- Performance profiling (major/minor releases)
- Security scans (production)
```

### 3. Rollback Strategy

Configure automatic rollback on failure:

```yaml
post:
  failure:
    - invoke bmi/rollback
```

### 4. Notifications

Notify team on deployment status:

```yaml
- Slack notifications
- Email alerts
- PagerDuty for production
```

### 5. Monitoring

Setup monitoring after each deployment:

```yaml
- invoke bmi/monitoring-setup
```

---

## Troubleshooting

### BMI CLI Not Found

```bash
# Ensure BMAD CLI is installed in CI environment
npm install -g @bmad/cli
# Or: pip install bmad-cli
```

### Authentication Failures

```bash
# Export tokens as environment variables
export DEPLOY_TOKEN="${{ secrets.DEPLOY_TOKEN }}"
export NPM_TOKEN="${{ secrets.NPM_TOKEN }}"
```

### Timeout Issues

```bash
# Increase timeout for long-running workflows
bmad-cli invoke bmi/load-testing --timeout 3600
```
