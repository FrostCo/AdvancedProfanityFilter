import OptionPage from './optionPage.js';
export default class OptionAuth {
  authenticated: boolean;
  password: string;

  authenticate(event) {
    let passwordInput = document.getElementById('password') as HTMLInputElement;
    if (passwordInput.value == this.password) {
      this.authenticated = true;
      OptionPage.hide(document.getElementById('passwordContainer'));
      OptionPage.show(document.getElementById('main'));
    }
  }

  constructor(password?: string) {
    this.password = password;
    this.authenticated = false;
  }

  setPassword() {
    var password = document.getElementById('setPassword') as HTMLInputElement;
    if (password.value == '') {
      chrome.storage.sync.remove('password');
    } else {
      chrome.storage.sync.set({password: password.value});
      password.value = '';
    }
  }
}