/* ═══════════════════════════════════════════════════════════════
   auth.js – Authentication & User Profile Logic
═══════════════════════════════════════════════════════════════ */
window.SheRoutes = window.SheRoutes || {};

SheRoutes.Auth = (function () {
  let currentUser = null;

  function init() {
    bindModalToggles();
    bindForms();
    checkAuthStatus();
  }

  function bindModalToggles() {
    const btnSignin = document.getElementById('btn-signin');
    const btnLogout = document.getElementById('btn-logout');
    const authOverlay = document.getElementById('auth-modal-overlay');
    const authClose = document.getElementById('auth-modal-close');
    
    // Auth Flow logic
    if (btnSignin) {
      btnSignin.addEventListener('click', () => {
        document.getElementById('profile-modal-overlay').hidden = true;
        authOverlay.hidden = false;
      });
    }

    if (btnLogout) {
      btnLogout.addEventListener('click', logout);
    }

    if (authClose) {
      authClose.addEventListener('click', () => {
        authOverlay.hidden = true;
      });
    }

    // Toggle between Signup and Login
    document.getElementById('toggle-to-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('signup-form').hidden = true;
      document.getElementById('login-form').hidden = false;
      document.getElementById('auth-modal-subtitle').textContent = 'Welcome back!';
    });

    document.getElementById('toggle-to-signup')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('signup-form').hidden = false;
      document.getElementById('login-form').hidden = true;
      document.getElementById('auth-modal-subtitle').textContent = 'Create your account';
    });

    // Toggle between Password and OTP Login
    document.getElementById('tab-login-pass')?.addEventListener('click', () => {
      document.getElementById('tab-login-pass').style.background = 'var(--pink)';
      document.getElementById('tab-login-pass').style.color = '#fff';
      document.getElementById('tab-login-otp').style.background = 'transparent';
      document.getElementById('tab-login-otp').style.color = 'var(--pink)';
      
      document.getElementById('login-pass-section').hidden = false;
      document.getElementById('login-otp-section').hidden = true;
    });

    document.getElementById('tab-login-otp')?.addEventListener('click', () => {
      document.getElementById('tab-login-otp').style.background = 'var(--pink)';
      document.getElementById('tab-login-otp').style.color = '#fff';
      document.getElementById('tab-login-pass').style.background = 'transparent';
      document.getElementById('tab-login-pass').style.color = 'var(--pink)';
      
      document.getElementById('login-pass-section').hidden = true;
      document.getElementById('login-otp-section').hidden = false;
    });
  }

  function bindForms() {
    // Signup
    document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass = document.getElementById('su-pass').value;
      const confirm = document.getElementById('su-confirm').value;

      if (pass !== confirm) {
        return SheRoutes.UI.showToast('Passwords do not match', 'error');
      }

      const payload = {
        name: document.getElementById('su-name').value,
        email: document.getElementById('su-email').value,
        phone: document.getElementById('su-phone').value,
        password: pass,
        emergencyName: document.getElementById('su-em-name').value,
        emergencyPhone: document.getElementById('su-em-phone').value,
        allowLocation: document.getElementById('su-location').checked
      };

      try {
        const res = await SheRoutes.API.register(payload);
        handleLoginSuccess(res.token, res.user);
        SheRoutes.UI.showToast('Account created successfully!', 'success');
        document.getElementById('auth-modal-overlay').hidden = true;
      } catch (err) {
        SheRoutes.UI.showToast(err.message, 'error');
      }
    });

    // Login Password
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // If the password section is visible, we're doing a normal login
      if (!document.getElementById('login-pass-section').hidden) {
        const payload = {
          email: document.getElementById('li-email').value,
          password: document.getElementById('li-pass').value
        };
        try {
          const res = await SheRoutes.API.login(payload);
          handleLoginSuccess(res.token, res.user);
          SheRoutes.UI.showToast('Logged in successfully!', 'success');
          document.getElementById('auth-modal-overlay').hidden = true;
        } catch (err) {
          SheRoutes.UI.showToast(err.message, 'error');
        }
      }
    });

    // Send OTP
    document.getElementById('btn-send-otp')?.addEventListener('click', async () => {
      const phone = document.getElementById('li-phone').value;
      if (!phone) return SheRoutes.UI.showToast('Enter your phone number first', 'error');

      try {
        const res = await SheRoutes.API.sendOtp(phone);
        SheRoutes.UI.showToast(`OTP Sent! (Demo: ${res.demoOtp})`, 'success', 5000);
      } catch (err) {
        SheRoutes.UI.showToast('Failed to send OTP: ' + err.message, 'error');
      }
    });

    // Verify OTP
    document.getElementById('btn-verify-otp')?.addEventListener('click', async () => {
      const phone = document.getElementById('li-phone').value;
      const otp = document.getElementById('li-otp').value;
      if (!phone || !otp) return SheRoutes.UI.showToast('Enter phone and OTP', 'error');

      try {
        const res = await SheRoutes.API.verifyOtp(phone, otp);
        if (res.action === 'login') {
          handleLoginSuccess(res.token, res.user);
          SheRoutes.UI.showToast('Logged in successfully!', 'success');
          document.getElementById('auth-modal-overlay').hidden = true;
        } else {
          // If action is register, they need to fill the signup form
          SheRoutes.UI.showToast('OTP Verified! Please complete your profile.', 'info');
          document.getElementById('toggle-to-signup').click();
          document.getElementById('su-phone').value = phone;
        }
      } catch (err) {
        SheRoutes.UI.showToast('Failed to verify OTP: ' + err.message, 'error');
      }
    });
  }

  async function checkAuthStatus() {
    const token = localStorage.getItem('sheroutes_token');
    if (token) {
      try {
        const user = await SheRoutes.API.getMe(token);
        handleLoginSuccess(token, user, false);
      } catch (e) {
        console.warn('Session expired or invalid token');
        logout(false);
      }
    }
  }

  function handleLoginSuccess(token, user, showToast = true) {
    localStorage.setItem('sheroutes_token', token);
    currentUser = user;
    
    // Update UI profile modal
    document.getElementById('profile-modal-title').textContent = user.name;
    document.getElementById('profile-modal-email').textContent = user.email;
    
    const phoneEl = document.getElementById('profile-modal-phone');
    phoneEl.style.display = 'block';
    phoneEl.textContent = 'Phone: ' + user.phone;

    document.getElementById('btn-signin').style.display = 'none';
    document.getElementById('btn-logout').style.display = 'block';

    const emConfig = user.emergencyContacts && user.emergencyContacts[0];
    if (emConfig) {
      document.getElementById('profile-emergency-display').style.display = 'block';
      document.getElementById('em-display-name').textContent = emConfig.name;
      document.getElementById('em-display-phone').textContent = emConfig.phone;
    } else {
      document.getElementById('profile-emergency-display').style.display = 'none';
    }

    // Also update the navbar profile icon to show some color
    const navAvatar = document.querySelector('.profile-avatar');
    if (navAvatar) {
      navAvatar.style.background = 'var(--pink)';
      navAvatar.style.color = '#fff';
      navAvatar.textContent = user.name[0].toUpperCase();
    }
  }

  function logout(showMessage = true) {
    localStorage.removeItem('sheroutes_token');
    currentUser = null;
    
    // Reset Profile UI
    document.getElementById('profile-modal-title').textContent = 'Guest User';
    document.getElementById('profile-modal-email').textContent = 'Sign in to save your routes';
    document.getElementById('profile-modal-phone').style.display = 'none';
    document.getElementById('btn-signin').style.display = 'block';
    document.getElementById('btn-logout').style.display = 'none';
    document.getElementById('profile-emergency-display').style.display = 'none';

    const navAvatar = document.querySelector('.profile-avatar');
    if (navAvatar) {
      navAvatar.style.background = 'var(--pink-light)';
      navAvatar.style.color = 'var(--navy)';
      navAvatar.textContent = '👤';
    }

    if (showMessage) SheRoutes.UI.showToast('Logged out safely', 'info');
    document.getElementById('profile-modal-overlay').hidden = true;
  }

  function getCurrentUser() {
    return currentUser;
  }

  return { init, getCurrentUser, logout };
})();

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  if (SheRoutes.Auth) SheRoutes.Auth.init();
});
