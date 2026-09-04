import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { client } from './lib/apolloClient.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ApolloProvider client={client}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#faf9f6',
              color: '#0d0d0d',
              border: '1px solid #e4e2dc',
              borderRadius: '999px',
              fontSize: '14px',
              padding: '10px 18px',
            },
            success: { iconTheme: { primary: '#4f46e5', secondary: '#faf9f6' } },
            error: { iconTheme: { primary: '#a23b34', secondary: '#faf9f6' } },
          }}
        />
      </ApolloProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
