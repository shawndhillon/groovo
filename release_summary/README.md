# 🎶 GROOVO

A social platform for music fans to log albums, share reviews, and discover new music.

---

## 🛑 Problem Statement
In today’s app ecosystem, there’s no centralized platform dedicated to music discussion and discovery.
Conversations are scattered across **Reddit**, **YouTube**, **Last.fm**, and **TikTok** — making it hard to find and share thoughtful perspectives on music.

This app fills that gap by creating a **community-driven space** for reviews, ratings, and discovery.

---

## ✨ Core Features

### 📚 Profile & Library
- Track albums and songs you’ve listened to
- Build a **personal listening diary**

### ⭐ Ratings & Reviews
- Rate albums on a **5-star system**
- Share **short or long-form reviews**

### 🌐 Social & Discovery
- Follow friends and see their activity
- Comment on reviews and lists
- Explore **trending albums** and **Album of the Week**

### 🔍 Search & Metadata
- Quickly find albums, artists, and genres
- Integration with **Spotify**

---

## 🎨 User Experience & Design

### 🧼 Clean & Simple
- Minimal, intuitive navigation
- Focused on usability and clarity

### 💡 Inspiration
- Drawing UI inspiration from platforms like **Letterboxd**

---

## 🚧 Status
This is a **Work in Progress (WIP)** project.
Core ideas and features are being developed — feedback and collaboration are welcome!


## Getting Started

### Access Deployed Site (Vercel)

The production deployment is hosted on Vercel:

* **Production URL:** [https://groovo-rho.vercel.app/](https://groovo-rho.vercel.app/)

---

### Run Locally

To run the application on your local machine:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/shawndhillon/groovo.git
   cd groovo
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   * Copy the example environment file:

     ```bash
     cp .env.example .env.local
     ```

   * Open `.env.local` and fill in the required values.

   * This file is **not committed** to the repository and is only used for local development.

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Access the app**:

   * Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
   * You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

---

## Deployment

### Vercel Preview Deployments

* Every push to a non-main branch triggers a **Preview Deployment** on Vercel.

* Vercel runs its checks.

* If the build and checks pass, Vercel generates a unique **Preview URL** for that commit/branch.

---

### Production Deployments (on `main`)

* The `main` branch is connected to the **Production** environment on Vercel.

* Any merge to `main` triggers a new **Production Deployment**.

* After the deployment finishes successfully:

  * The production site [Groovo](https://groovo-rho.vercel.app/) is updated.

  * The previous production deployment is kept as a fallback in Vercel's deployment history.

---

## Vercel Environments & Secrets

Vercel manages environment variables (secrets) securely and separately from the codebase:

* **Environment Variables** are configured in the Vercel dashboard under:

  * **Preview**

  * **Production**

* These values are **not committed** to the repository and are only visible in Vercel.

* Usage:

  * **Local development:** values in `.env.local`.

  * **Preview deployments:** values set under the *Preview* environment in Vercel.

  * **Production deployments:** values set under the *Production* environment in Vercel.

This separation ensures secrets (API keys, database URIs, etc.) are not leaked in the codebase and can differ between environments.

---

## Vercel Project

* **Vercel Project Dashboard:** [Dashboard](https://vercel.com/shawndhillons-projects/groovo)

From the Vercel project dashboard you can:

* View all **deployments**.

* Inspect **build logs** and deployment statuses.

* Manage **Environment Variables**.

* Configure domains, redirects, and other project settings.

