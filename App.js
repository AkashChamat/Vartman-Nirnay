import { decode, encode } from 'base-64';

global.atob = global.atob || decode;
global.btoa = global.btoa || encode;

import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/Auth/AuthContext';
import AuthNavigator from './src/Auth/AuthNavigator';
import FlashMessage from "react-native-flash-message";

const App = () => {
  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#5B9EED" 
        translucent={false}
        hidden={false}
      />
      <AuthProvider>
        <AuthNavigator />
      </AuthProvider>
      {/* Move FlashMessage to the end - this is the key fix */}
      <FlashMessage 
        position="top" 
        duration={4000}
        floating={true}
        style={{ paddingTop: 25 }}
      />
    </>
  );
};

export default App;