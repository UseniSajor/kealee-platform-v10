function Error({ statusCode }: { statusCode: number }) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      background: '#f9fafb'
    }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#1f2937' }}>
        {statusCode || 'Error'}
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </p>
      <a href="/" style={{ 
        marginTop: '2rem',
        background: '#2563eb',
        color: 'white',
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem',
        textDecoration: 'none'
      }}>
        Go Home
      </a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;