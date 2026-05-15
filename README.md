# AI Notes Maker

AI-powered exam preparation notes generator. Generate comprehensive study notes, flashcards, and PYQ analysis for competitive exams like NTPC, SSC, RRB, UPSC, and more.

## Features

- **AI-Powered Notes**: Generate detailed study notes using SambaNova AI
- **Flashcards**: Create interactive flashcards for quick revision
- **Exam-Focused**: Tailored for Indian competitive exams (NTPC, SSC CGL, SSC CHSL, RRB, UPSC, etc.)
- **Subject-Wise**: Generate notes for specific subjects (History, Geography, Polity, Science, Math, etc.)
- **HTML Download**: Download notes and flashcards as standalone HTML files
- **YouTube References**: Quick links to exam analysis videos on YouTube
- **Hindi/Hinglish**: Notes generated in Hindi with English technical terms
- **PYQ Analysis**: Previous Year Question pattern analysis included
- **Memory Tricks**: Mnemonics and shortcuts for easy memorization

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **AI**: SambaNova API (Meta-Llama-3.3-70B-Instruct)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- SambaNova API Key

### Installation

```bash
git clone https://github.com/Aman262626/Notes-ai.git
cd Notes-ai
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
SAMBANOVA_API_KEY=your_sambanova_api_key_here
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## Deploy on Vercel

1. Push to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add `SAMBANOVA_API_KEY` environment variable in Vercel settings
4. Deploy

## Usage

1. Enter your SambaNova API key (or set it as env variable)
2. Select an exam (e.g., RRB NTPC)
3. Choose a subject (e.g., History)
4. Optionally enter a specific topic
5. Choose mode: Notes or Flashcards
6. Click Generate
7. Download the generated HTML file

## License

MIT
