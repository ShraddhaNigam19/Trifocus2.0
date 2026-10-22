export const getDemoAuthState = () => false;

export const buildDemoUser = (email: string, displayName: string) => ({
  uid: 'demo-user',
  email,
  displayName,
});
