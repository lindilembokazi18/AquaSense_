import React, { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { styles as s } from '../theme/styles';
import { shadow } from '../theme/colors';
import { Input, Label, Logo } from '../components/Core';

export default function LoginScreen({ onLogin, onCreateAccount, onResetPassword }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('APK');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const login = async () => {
    setBusy(true); setMessage('');
    const { error, data } = await onLogin(email, password);
    setBusy(false);
    if (error) setMessage(error.message || 'Login failed');
    else setMessage(data?.role === 'admin' ? 'Admin access granted' : 'Student access granted');
  };

  const create = async () => {
    setBusy(true); setMessage('');
    const { error } = await onCreateAccount({ name, email, password, campus });
    setBusy(false);
    if (error) setMessage(error.message || 'Account could not be created');
    else { setMessage('Account created. Check your email if confirmation is enabled, then login.'); setMode('login'); }
  };

  const forgotPassword = async () => {
    setMessage('');
    if (!email.trim()) {
      Alert.alert('Forgot password', 'Enter your email address first, then tap Forgot.');
      return;
    }
    setBusy(true);
    const { error } = await onResetPassword(email);
    setBusy(false);
    if (error) setMessage(error.message || 'Password reset email could not be sent.');
    else Alert.alert('Reset email sent', 'Check your email for the password reset link.');
  };

  const isCreate = mode === 'create';
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={s.loginWrap}>
        <Logo />
        <View style={[s.loginCard, shadow]}>
          <Text style={s.h1}>{isCreate ? 'Create Account' : 'Welcome Back'}</Text>
          <Text style={s.copy}>{isCreate ? 'Create your AquaSense account and choose your campus.' : 'Login using your registered AquaSense account.'}</Text>
          {isCreate ? <><Label>Full Name</Label><Input icon="person" placeholder="Alex Thompson" value={name} onChangeText={setName} /><Label>Campus</Label><Input icon="business" placeholder="APK" value={campus} onChangeText={setCampus} /></> : null}
          <Label>Email Address</Label>
          <Input icon="mail" placeholder="scientist@university.edu" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <View style={s.rowBetween}><Label>Password</Label>{!isCreate ? <Pressable onPress={forgotPassword}><Text style={s.forgot}>Forgot?</Text></Pressable> : null}</View>
          <Input
            icon="lock-closed"
            placeholder="••••••••"
            right={passwordVisible ? 'eye-off' : 'eye'}
            value={password}
            onChangeText={setPassword}
            secure={!passwordVisible}
            onRightPress={() => setPasswordVisible(!passwordVisible)}
          />
          {message ? <Text style={s.successMsg}>{message}</Text> : null}
          <Pressable onPress={isCreate ? create : login} style={[s.primaryBtn, shadow]} disabled={busy}>
            <Text style={s.primaryText}>{busy ? 'Please wait...' : isCreate ? 'Create Account' : 'Login'}</Text>
          </Pressable>
          <Pressable onPress={() => { setMode(isCreate ? 'login' : 'create'); setMessage(''); }}>
            <Text style={s.centerText}>{isCreate ? 'Already have an account? ' : 'New to AquaSense? '}<Text style={s.link}>{isCreate ? 'Login' : 'Create account'}</Text></Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
