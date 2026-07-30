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
              background: '#fbfaf6',
              color: '#1a1915',
              border: '1px solid #e7e3d9',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#1f5c3d', secondary: '#fbfaf6' } },
            error: { iconTheme: { primary: '#a23b34', secondary: '#fbfaf6' } },
          }}
        />
      </ApolloProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
