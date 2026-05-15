import "./globals.css";

export const metadata = {
  title: "AI Notes Maker - Exam Preparation Notes Generator",
  description:
    "AI-powered exam notes generator. Generate comprehensive study notes, flashcards, and PYQ analysis for competitive exams like NTPC, SSC, RRB, UPSC.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
