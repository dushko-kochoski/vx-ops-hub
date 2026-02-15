VX Ops Hub

VX Ops Hub is a lightweight B2B operations CRM built to simulate how a growth-focused firm manages leads, automations, and AI-assisted workflows.

This project was built as a full-stack production-style application using Next.js, Supabase, and OpenAI.

🚀 Purpose

The goal of VX Ops Hub is to:

Manage inbound B2B leads

Track lead lifecycle stages

Secure user data with Row Level Security (RLS)

Trigger automation when business events happen

Integrate AI into sales workflows

Deploy a real SaaS-style app to production

This simulates how a growth firm would embed AI-driven systems into their operations.

🧱 Tech Stack
Frontend

Next.js 16 (App Router)

React + TypeScript

Tailwind CSS

Backend

Supabase (Postgres + Auth)

Supabase Row-Level Security (RLS)

Serverless API Routes (Next.js)

AI

OpenAI SDK

Server-side AI route for outreach generation

Hosting

Vercel (frontend + serverless functions)

Supabase (database + authentication)

🔐 Authentication

Magic link login via Supabase

Custom auth callback handling

Implicit flow used for reliability

Secure session handling

Production redirect configuration

📊 Features

User authentication (magic link)

Leads CRUD

Stage management (New → Contacted → Qualified → Won → Lost)

Row-Level Security (users see only their leads)

Webhook-style automation endpoint

AI-generated outreach emails per lead

Server-side API key handling

Production deployment on Vercel

🤖 AI Feature

Each lead includes an “AI Email” option that:

Calls a secure server-side API route

Uses OpenAI to generate a short outreach email

Returns structured subject + body

Never exposes API keys to the client

This demonstrates AI-led workflow integration in a B2B ops context.

🛠 Architecture Decisions

Supabase chosen to avoid building a custom backend

RLS enforced at the database level

Serverless routes used for secure AI calls

Environment variables used for secrets

Clean separation between client and server logic

Deployed with production-ready configuration

🔎 Debugging Challenges Solved

PKCE code verifier issues in production

Supabase redirect misconfiguration

Vercel environment variable build failures

Route/page conflicts in Next.js App Router

PowerShell execution policy blocking npm

Git remote configuration issues

▶️ Running Locally

Create .env.local:

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...


Install dependencies:

npm install


Run:

npm run dev

📦 Deployment

Deployed via Vercel

Environment variables configured in Vercel dashboard

Supabase production redirect URLs configured

🎯 Why This Project Matters

VX Ops Hub demonstrates:

Full-stack SaaS architecture

Secure authentication handling

Production deployment workflow

AI integration into business processes

Practical debugging under real conditions

📌 Status

Production-ready demo application.