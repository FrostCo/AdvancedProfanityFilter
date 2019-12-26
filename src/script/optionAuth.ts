import OptionPage from './optionPage';
export default class OptionAuth {
  authenticated: boolean;
  password: string;

  authenticate(evt) {
    let passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
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

  setPassword(optionPage: OptionPage) {
    let password = document.getElementById('setPassword') as HTMLInputElement;
    optionPage.cfg.password = password.value;
    optionPage.saveProp('password');
    password.value = '';
    this.setPasswordButton(optionPage);
  }

  setPasswordButton(optionPage: OptionPage) {
    let passwordText = document.getElementById('setPassword') as HTMLInputElement;
    let passwordBtn = document.getElementById('setPasswordBtn') as HTMLButtonElement;

    if (optionPage.cfg.password) { // Password already set
      OptionPage.enableBtn(passwordBtn);
      if (passwordText.value) { // Password field filled
        passwordBtn.innerText = 'SET';
      } else { // Empty password field
        passwordBtn.innerText = 'REMOVE';
      }
    } else { // Password not already set
      passwordBtn.innerText = 'SET';
      if (passwordText.value) { // Password field filled
        OptionPage.enableBtn(passwordBtn);
      } else { // Empty password field
        OptionPage.disableBtn(passwordBtn);
      }
    }
  }
}