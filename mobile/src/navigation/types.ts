export type RootStackParamList = {
  Splash: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
  Login: { verifiedEmail?: string } | undefined;
  Profile: undefined;
  TaskSelection: undefined;
  Home: undefined;
};
