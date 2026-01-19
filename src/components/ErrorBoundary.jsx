import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error Boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '20px',
                    textAlign: 'center',
                    background: '#1a1a2e',
                    color: '#fff'
                }}>
                    <h1>⚠️ Something went wrong</h1>
                    <p>The application encountered an error and couldn&apos;t load properly.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            background: '#6366f1',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px'
                        }}
                    >
                        Reload Page
                    </button>
                    {this.props.showError && (
                        <pre style={{
                            marginTop: '20px',
                            padding: '10px',
                            background: '#000',
                            borderRadius: '4px',
                            fontSize: '12px',
                            maxWidth: '600px',
                            overflow: 'auto'
                        }}>
                            {this.state.error?.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
