FROM public.ecr.aws/docker/library/node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat python3 make gcc g++ musl-dev binutils autoconf automake libtool pkgconfig check-dev file patch git alpine-sdk build-base libgudev-dev
WORKDIR /app

# Workaround - rebuild the dependancies to avoid missing linux dependancies

COPY package.json ./
RUN npm i --legacy-peer-deps

# Install dependencies based on the preferred package manager
# COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
# RUN \
#   if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
#   elif [ -f package-lock.json ]; then npm ci --legacy-peer-deps; \
#   elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
#   else echo "Lockfile not found." && exit 1; \
#   fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NPM_BUILD_ENV=production
# RUN mv -f .env.${NPM_BUILD_ENV} .env.production && rm -f .env.development 

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next


FROM public.ecr.aws/nginx/nginx:stable-alpine AS runner


RUN addgroup --system --gid 1001 reactjs
RUN adduser --system --uid 1001 reactjs

ARG ENABLE_HTACCESS=false
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY ./nginx/.htpasswd /etc/nginx/conf.d/.htpasswd
RUN if [ "$ENABLE_HTACCESS" = "true" ] ; then sed -ri -e "s!#auth!auth!g" /etc/nginx/conf.d/default.conf ; fi
COPY --from=builder --chown=reactjs:reactjs /app/dist /usr/share/nginx/html