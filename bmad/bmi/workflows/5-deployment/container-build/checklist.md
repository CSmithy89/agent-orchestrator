# Container Build Pre-Flight Checklist

**Checklist Status Markers:** `[x]` Completed | `[ ]` Not completed | `[N/A]` Not applicable | `[!]` Requires attention

---

## 1. Build Prerequisites
- [ ] Container tool installed (docker/podman/buildah)
- [ ] Dockerfile exists and is valid
- [ ] Build context directory exists
- [ ] .dockerignore file present (recommended)
- [ ] Base image accessible

## 2. Dockerfile Quality
- [ ] Uses official/trusted base images
- [ ] Multi-stage build (recommended)
- [ ] Minimal layer count (<15 layers)
- [ ] No secrets in Dockerfile or build args
- [ ] Non-root user configured
- [ ] Health check defined (HEALTHCHECK)

## 3. Build Context
- [ ] Build context size reasonable (<100MB)
- [ ] .dockerignore excludes unnecessary files (node_modules, .git, *.log)
- [ ] No sensitive files in build context

## 4. Image Optimization
- [ ] Uses appropriate base image (alpine, distroless)
- [ ] Dependencies pinned to specific versions
- [ ] Unused packages removed
- [ ] Layer caching optimized

## 5. Security
- [ ] Base image up-to-date
- [ ] Vulnerability scan completed
- [ ] No critical vulnerabilities
- [ ] Runs as non-root user
- [ ] Minimal attack surface

## 6. Registry
- [ ] Registry credentials available
- [ ] Registry accessible
- [ ] Image naming follows conventions
- [ ] Tag strategy defined

## 7. Multi-Platform (if applicable)
- [ ] Platforms specified (linux/amd64, linux/arm64)
- [ ] Buildx or buildah configured for multi-platform
- [ ] Cross-compilation dependencies resolved

**Checklist Summary:**
- Total Items: ~35
- Completed: ___ / ___
- Status: [ ] ✅ Ready | [ ] ⚠️ Review | [ ] ❌ Blocked
