import OptionPage from './optionPage.js';
export default class OptionAuth {
  authenticated: boolean;
  password: string;

  authenticate(event) {
    let passwordInput = document.getElementById('password') as HTMLInputElement;
    if (passwordInput.value == this.password) {
      this.authenticated = true;
      document.getElementById('passwordModal').style.display = 'none';
      OptionPage.show(document.getElementById('main'));
    } else {
      passwordInput.classList.add('w3-border-red');
    }
  }

  constructor(password?: string) {
    this.password = password;
    this.authenticated = false;
  }

  setPassword(optionPage: OptionPage) {
    var password = document.getElementById('setPassword') as HTMLInputElement;
    optionPage.cfg.password = password.value;
    optionPage.cfg.save('password');
    password.value = '';
  }
}