// Enhanced ErrorHandler.js - Improved error handling with logging
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Error logging function that can be used across the app
export const logError = (component, error, additionalInfo = {}) => {
  const errorLog = {
    component,
    error: error?.message || String(error),
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    ...additionalInfo
  };
  
  console.error(`[${component}] Error:`, errorLog);
  
  return errorLog;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      componentName: props.componentName || 'Unknown'
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error with component name
    logError(this.state.componentName, error, { errorInfo });
    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // If onReset prop is provided, call it
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback UI if provided, otherwise use default
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }
      
      // Default fallback UI
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error && this.state.error.toString()}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.resetError}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Component wrapper function with component name tracking
export const withErrorBoundary = (WrappedComponent, options = {}) => {
  const wrappedName = WrappedComponent.displayName || 
                      WrappedComponent.name || 
                      'Component';
  
  const WithErrorBoundary = (props) => (
    <ErrorBoundary 
      componentName={wrappedName}
      fallback={options.fallback}
      onReset={options.onReset}
    >
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
  
  WithErrorBoundary.displayName = `withErrorBoundary(${wrappedName})`;
  return WithErrorBoundary;
};

// Enhanced HOC to handle API errors with improved logging
export const withErrorHandler = (WrappedComponent) => {
  const wrappedName = WrappedComponent.displayName || 
                      WrappedComponent.name || 
                      'Component';
  
  const WithErrorHandler = (props) => {
    const [error, setError] = React.useState(null);

    const handleApiError = (error, context = '') => {
      logError(`${wrappedName}:API${context ? ':' + context : ''}`, error);
      setError(error);
      
      // Optionally return the error so it can be used in the component
      return error;
    };

    const resetError = () => {
      setError(null);
    };

    if (error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>API Error</Text>
          <Text style={styles.message}>{error.message}</Text>
          <TouchableOpacity style={styles.button} onPress={resetError}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return <WrappedComponent 
      {...props} 
      handleApiError={handleApiError}
      resetApiError={resetError}
    />;
  };
  
  WithErrorHandler.displayName = `withErrorHandler(${wrappedName})`;
  return WithErrorHandler;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0288D1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ErrorBoundary;