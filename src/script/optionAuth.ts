import OptionPage from './optionPage';
export default class OptionAuth {
  authenticated: boolean;
  password: string;

  authenticate(evt) {
    const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
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

  async setPassword(optionPage: OptionPage) {
    const password = document.getElementById('setPassword') as HTMLInputElement;
    optionPage.cfg.password = password.value;
    try {
      await optionPage.cfg.save('password');
      password.value = '';
      this.setPasswordButton(optionPage);
    } catch (e) {
      OptionPage.handleError('Failed to update password.', e);
    }
  }

  setPasswordButton(optionPage: OptionPage) {
    const passwordText = document.getElementById('setPassword') as HTMLInputElement;
    const passwordBtn = document.getElementById('setPasswordBtn') as HTMLButtonElement;

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