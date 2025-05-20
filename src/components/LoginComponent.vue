<template>
  <v-container class="d-flex justify-center align-center" style="height: 100vh;">
    <v-card width="400">
      <v-card-title class="text-center">
        Admin Login
      </v-card-title>

      <v-card-subtitle class="text-center">
        Vælg login metode
      </v-card-subtitle>

      <v-tabs v-model="loginMethod" grow>
        <v-tab value="email">Email & Adgangskode</v-tab>
        <v-tab value="otp">Mobil & OTP</v-tab>
      </v-tabs>

      <v-card-text>
        <v-form @submit.prevent="handleLogin">
          <v-container>
            <v-row v-if="loginMethod === 'email'">
              <v-col cols="12">
                <v-text-field label="Email" v-model="email" type="email" required></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field label="Adgangskode" v-model="password" type="password" required></v-text-field>
              </v-col>
            </v-row>

            <v-row v-if="loginMethod === 'otp'">
              <v-col cols="12">
                <v-text-field label="Mobilnummer" v-model="phone" type="tel" required></v-text-field>
              </v-col>
              <v-col cols="12" v-if="otpSent">
                <v-text-field label="OTP kode" v-model="otpCode" type="text" required></v-text-field>
              </v-col>
            </v-row>
          </v-container>

          <v-card-actions>
            <v-btn color="primary" block @click="handleLogin">
              {{ loginMethod === 'email' ? 'Log ind' : otpSent ? 'Bekræft OTP' : 'Send OTP' }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';

export default {
  setup() {
    const loginMethod = ref('email');
    const email = ref('');
    const password = ref('');
    const phone = ref('');
    const otpSent = ref(false);
    const otpCode = ref('');
    const error = ref('');
    const router = useRouter();
    const toast = useToast();

    const handleLogin = async () => {
      error.value = '';
      try {
        if (loginMethod.value === 'email') {
          // Validate
          if (!email.value || !password.value) {
            toast.error('Indtast email og adgangskode.');
            return;
          }
          // Call backend
          await axios.post('http://localhost:8090/api/auth/login', {
            email: email.value,
            password: password.value
          });
          toast.success(`Login som admin med email: ${email.value}`);
          return router.push('/admin/dashboard');
        }

        // OTP flow
        if (!otpSent.value) {
          if (!phone.value) {
            toast.error('Indtast mobilnummer.');
            return;
          }
          // Call backend to send OTP (endpoint to implement)
          await axios.post('/auth/send-otp', { phone: phone.value });
          toast.success('OTP sendt til nummer ' + phone.value);
          otpSent.value = true;
        } else {
          if (!otpCode.value) {
            toast.error('Indtast OTP kode.');
            return;
          }
          // Call backend to verify OTP
          await axios.post('/auth/login-otp', {
            phone: phone.value,
            otp: otpCode.value
          });
          toast.success('OTP bekræftet.');
          return router.push('/dashboard');
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Login mislykkedes.';
        toast.error(msg);
        error.value = msg;
      }
    };

    return {
      loginMethod,
      email,
      password,
      phone,
      otpSent,
      otpCode,
      error,
      handleLogin
    };
  }
};
</script>

<style scoped>
.login-container { max-width: 400px; margin: auto; padding: 1rem; }
label { display: block; margin-top: 0.5rem; }
input { width: 100%; padding: 0.5rem; margin-top: 0.25rem; }
button { margin-top: 1rem; padding: 0.75rem; width: 100%; }
.error { color: red; margin-bottom: 0.5rem; }
</style>
