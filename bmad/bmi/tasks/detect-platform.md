# Task: Detect Deployment Platform

**Purpose:** Auto-detect deployment platform from project configuration files

**Used By:** deploy, container-build workflows

**Inputs:**
- `project_root` - Project root directory (default: current directory)

**Outputs:**
- `platform` - Detected platform (vercel, railway, heroku, kubernetes, etc.)
- `confidence` - Detection confidence (high, medium, low)
- `config_file` - Configuration file that indicated the platform

---

## Detection Logic

### 1. Check for platform-specific configuration files

```bash
# Vercel
if [ -f "vercel.json" ]; then
  platform="vercel"
  confidence="high"
  config_file="vercel.json"
fi

# Railway
if [ -f "railway.toml" ] || [ -f "railway.json" ]; then
  platform="railway"
  confidence="high"
  config_file="railway.toml"
fi

# Heroku
if [ -f "Procfile" ] || [ -f "app.json" ]; then
  platform="heroku"
  confidence="high"
  config_file="Procfile"
fi

# Render
if [ -f "render.yaml" ]; then
  platform="render"
  confidence="high"
  config_file="render.yaml"
fi

# Kubernetes
if [ -d "k8s" ] || [ -d "kubernetes" ] || [ -f "deployment.yaml" ]; then
  platform="kubernetes"
  confidence="high"
  config_file="k8s/ or deployment.yaml"
fi

# Docker Compose
if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
  platform="docker-compose"
  confidence="high"
  config_file="docker-compose.yml"
fi

# Netlify
if [ -f "netlify.toml" ]; then
  platform="netlify"
  confidence="high"
  config_file="netlify.toml"
fi

# Fly.io
if [ -f "fly.toml" ]; then
  platform="fly.io"
  confidence="high"
  config_file="fly.toml"
fi

# Cloudflare Pages
if [ -f "wrangler.toml" ]; then
  platform="cloudflare-pages"
  confidence="high"
  config_file="wrangler.toml"
fi

# AWS Elastic Beanstalk
if [ -d ".ebextensions" ] || [ -f ".elasticbeanstalk/config.yml" ]; then
  platform="aws-elastic-beanstalk"
  confidence="high"
  config_file=".elasticbeanstalk/config.yml"
fi

# GCP App Engine
if [ -f "app.yaml" ]; then
  platform="gcp-app-engine"
  confidence="high"
  config_file="app.yaml"
fi

# Azure App Service
if [ -f "azure-pipelines.yml" ] || [ -f ".azure" ]; then
  platform="azure-app-service"
  confidence="medium"
  config_file="azure-pipelines.yml"
fi
```

### 2. Check package.json scripts (if Node.js project)

```bash
if [ -f "package.json" ]; then
  # Check for platform-specific scripts
  if grep -q "vercel" package.json; then
    platform="vercel"
    confidence="medium"
  elif grep -q "railway" package.json; then
    platform="railway"
    confidence="medium"
  fi
fi
```

### 3. Fallback: Dockerfile detection

```bash
if [ -z "$platform" ] && [ -f "Dockerfile" ]; then
  platform="docker"
  confidence="medium"
  config_file="Dockerfile"
fi
```

---

## Usage Example

```yaml
# From deploy workflow
<step n="2" goal="Detect Platform">
  <action>Invoke task: detect-platform</action>
  <action>Display detected platform:</action>
    - Platform: {platform}
    - Confidence: {confidence}
    - Config file: {config_file}
  <action if="confidence is low">Ask user to confirm platform</action>
</step>
```

---

## Supported Platforms (15+)

- Serverless: Vercel, Railway, Render, Netlify, Heroku, Fly.io, Cloudflare Pages
- Cloud: AWS Elastic Beanstalk, AWS ECS, AWS Lambda, GCP App Engine, GCP Cloud Run, Azure App Service, Azure Container Apps
- Container: Kubernetes, Docker, Docker Compose
- Static: GitHub Pages, GitLab Pages, DigitalOcean App Platform
