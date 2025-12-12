export default function AuthLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '3rem 1rem'
    }}>
      {children}
    </div>
  )
}