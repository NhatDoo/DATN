// import "./globals.css";
import Bootstrap from "./components/Bootrapscript";

export const metadata = {
  title: "StudyLab",
  description: "Learning platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Bootstrap />
      </body>
    </html>
  );
}
