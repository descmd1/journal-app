import "./globals.css";

export const metadata = {
  title: "NigJournal - Affordable Academic Publishing for Nigerian Researchers",
  description: "Publish your research in high-quality journals at affordable rates. Built by Nigerians, for Nigerian academia.",
  keywords: "academic publishing, Nigeria, research, journal, peer review, affordable publishing",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
