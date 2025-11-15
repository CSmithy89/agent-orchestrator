# Container Build - Container Image Build and Security Scan Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmi/workflows/5-deployment/container-build/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>

<critical>CONTAINER SECURITY: Scan all images for vulnerabilities before deployment. Never deploy images with critical CVEs to production.</critical>

<workflow>

<step n="1" goal="Initialize Container Build Context">
  <action>Greet user: "I'm Diana, your DevOps Engineer. I'll help you build a secure, optimized container image for {image_name}."</action>
  <action>Gather build context:</action>
    - Image Name: {image_name}
    - Target Environment: {target_environment}
    - Dockerfile Path: {dockerfile_path} (default: ./Dockerfile)
    - Build Context: {build_context} (default: .)
    - Platforms: {platforms} (default: linux/amd64)
  <action>Verify prerequisites:</action>
    - Container build tool installed (docker/podman/buildah)
    - Dockerfile exists at specified path
    - Build context directory exists
  <action if="prerequisites not met">HALT: "Container build prerequisites not met. Install Docker/Podman and ensure Dockerfile exists."</action>
</step>

<step n="2" goal="Detect Container Build Tool">
  <action>Auto-detect container tool:</action>
    - Check for: docker --version
    - Check for: podman --version
    - Check for: buildah --version
  <action>Select first available tool (prefer docker > podman > buildah)</action>
  <action>Display detected tool and version</action>
</step>

<step n="3" goal="Analyze Dockerfile and Build Context">
  <action>Analyze Dockerfile:</action>
    - Base image used
    - Multi-stage build (yes/no)
    - Layer count
    - Build arguments required
  <action>Analyze build context size:</action>
    - Calculate context size: du -sh {build_context}
    - Check for .dockerignore file
    - Recommend excluding large files (node_modules, .git, etc.)
  <action if="context size > 100MB AND no .dockerignore">WARN: "Large build context detected ({context_size}). Consider adding .dockerignore to exclude unnecessary files."</action>
</step>

<step n="4" goal="Generate Image Tags">
  <action>Generate image tags based on environment and version:</action>
    - Git commit SHA: {image_name}:{git_sha}
    - Environment tag: {image_name}:{target_environment}
    - Latest tag: {image_name}:latest (only for production)
    - Semantic version (if available): {image_name}:v{semver}
  <action>Display proposed tags</action>
</step>

<step n="5" goal="Build Container Image">
  <action>Execute container build:</action>
    - docker build -t {image_name}:{tags} -f {dockerfile_path} {build_context}
    - OR podman build -t {image_name}:{tags} {build_context}
  <action>Monitor build progress with live output</action>
  <action>Capture build logs</action>
  <action if="build fails">HALT: "Container build failed. Check Dockerfile syntax and dependencies."</action>
  <action if="build succeeds">
    - Capture image ID
    - Calculate image size
    - Record build duration
  </action>
</step>

<step n="6" goal="Scan for Vulnerabilities">
  <action if="scan_vulnerabilities is false">Skip to step 7</action>
  <action>Scan image using Trivy (or Snyk/Grype if available):</action>
    - trivy image {image_name}:{tag} --severity HIGH,CRITICAL
  <action>Parse scan results:</action>
    - Critical vulnerabilities: {critical_count}
    - High vulnerabilities: {high_count}
    - Medium vulnerabilities: {medium_count}
  <action if="critical_count > 0">
    <warn>⚠️ CRITICAL VULNERABILITIES FOUND: {critical_count} critical CVEs detected</warn>
    <ask if="target_environment is production">Halt deployment due to critical vulnerabilities? [Y/n]</ask>
  </action>
</step>

<step n="7" goal="Push to Container Registry">
  <action if="push_to_registry is false">Skip to step 8</action>
  <action>Authenticate with registry:</action>
    - Docker Hub: docker login
    - ECR: aws ecr get-login-password | docker login
    - GCR: gcloud auth configure-docker
    - ACR: az acr login
    - GHCR: docker login ghcr.io
  <action>Push image with all tags:</action>
    - docker push {registry}/{image_name}:{tag}
  <action>Display pushed image URLs</action>
</step>

<step n="8" goal="Complete Container Build">
  <action>Display build summary:</action>
  ```
  ✅ CONTAINER BUILD COMPLETE

  Image: {registry}/{image_name}:{tags}
  Size: {image_size}
  Platforms: {platforms}
  Vulnerabilities: {critical_count} critical, {high_count} high

  Build Time: {build_duration}
  ```
  <action>Workflow complete ✅</action>
</step>

</workflow>
