import React from 'react';
import { AuthScreen } from './AuthScreen';

/**
 * LoginScreen - Dedicated Authentication & PIN Login Interface
 * Wraps and exports the institutional authentication screen with PIN recovery flow.
 */
export const LoginScreen: React.FC = () => {
  return <AuthScreen />;
};

export default LoginScreen;
