# AI Document Editor with Gemini & Supabase

A premium, AI-powered document editor that allows real-time document manipulation using Google Gemini. Features a two-panel layout with a glassmorphism aesthetic, support for multimodal input (OCR), and seamless Supabase integration for authentication and real-time data syncing.

## ✨ Key Features

-   **🤖 AI-Powered Editing**: Directly manipulate your document using natural language via Gemini 2.5 Flash.
-   **🖼️ Multimodal Support (OCR)**: Upload images containing text, and the AI will extract and insert the content directly into your editor.
-   **🔄 Intelligent Command Execution**: Support for complex commands like `update_doc_by_line`, `insert_at_line`, `append_to_document`, and `delete_lines`.
-   **🔐 Supabase Authentication**: Secure login using Email or Magic Links.
-   **💾 Auto-Save & Real-time Sync**: Your documents are automatically saved to Supabase and synced across sessions.
-   **🎨 Premium UI**: Dark/Neon theme with glassmorphism, animated backgrounds, and smooth transitions.
-   **📤 Export Support**: Download your documents as `.txt` files in a single click.

## 🚀 Getting Started

### 1. Prerequisites

-   Node.js 18+ and npm
-   A Supabase project
-   A Google Gemini API Key

### 2. Environment Variables

Create a `.env.local` file in the root directory and add the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Installation

```bash
git clone <your-repo-url>
cd my-first-nextjs
npm install
```

### 4. Database Setup

Ensure your Supabase database has a `documents` table with the following schema:
- `id`: UUID (Primary Key)
- `content`: Text
- `user_id`: UUID (References auth.users)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🛠️ Built With

-   [Next.js](https://nextjs.org/) - Framework
-   [Supabase](https://supabase.com/) - Backend & Auth
-   [Google Gemini](https://ai.google.dev/) - AI Engine
-   [Tailwind CSS](https://tailwindcss.com/) - Styling
-   [Lucide React](https://lucide.dev/) - Icons

