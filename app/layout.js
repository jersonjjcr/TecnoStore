import "./globals.css";

export const metadata = {
  title: "TecnoStore Admin",
  description: "Dashboard para ventas, inventario y reparaciones de telefonos."
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
