FROM node:24-bookworm

# Pinned pi version — bump deliberately; the smoke must stay reproducible.
ARG PI_VERSION=0.84.3

RUN apt-get update && apt-get install -y --no-install-recommends \
      git python3 curl unzip ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

RUN npm install -g "@earendil-works/pi-coding-agent@${PI_VERSION}"

# Ephemeral git identity for the smoke worktree.
RUN git config --global user.email "smoke@pi-council.local" \
 && git config --global user.name "pi-council smoke" \
 && git config --global init.defaultBranch main

# Headless pi must trust project-local settings (packages, extensions)
# without a prompt; each pi invocation also passes --approve.
RUN mkdir -p /root/.pi/agent \
 && echo '{"defaultProjectTrust": "always"}' > /root/.pi/agent/settings.json

WORKDIR /work
