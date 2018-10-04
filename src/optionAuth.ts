import OptionPage from './optionPage.js';
export default class OptionAuth {
  authenticated: boolean;
  password: string;

  authenticate(evt) {
    let passwordInput = document.getElementById('password') as HTMLInputElement;
    if (passwordInput.value == this.password) {
      this.authenticated = true;
      OptionPage.closeModal('passwordModal');
      OptionPage.show(document.getElementById('main'));
      OptionPage.hideInputError(passwordInput);
    } else {
      OptionPage.showInputError(passwordInput);
    }
  }

  constructor(password?: string) {
    this.password = password;
    this.authenticated = false;
  }

  setPassword(evt, option: OptionPage) {
    OptionPage.closeModal('confirmModal');
    evt.target.removeEventListener('click', option.auth.setPassword);
    var password = document.getElementById('setPassword') as HTMLInputElement;
    option.cfg.password = password.value;
    option.cfg.save('password');
    password.value = '';
  }

  setPasswordButtonText(evt) {
    let passwordText = document.getElementById('setPassword') as HTMLInputElement;
    let passwordBtn = document.getElementById('setPasswordBtn') as HTMLButtonElement;
    passwordBtn.innerText = passwordText.value === '' ? 'REMOVE' : 'SET';
  }
}