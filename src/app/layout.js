import './globals.css'; 

export const metadata = {
  title: 'Neeraj Portfolio',
  description: 'Welcome to my personal portfolio',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">
        {/* You can add a Navbar here */}
        {children} 
        {/* Render page content */}
      </body>
    </html>
  );
}